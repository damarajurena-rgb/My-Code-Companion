import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

type Mode = "explain" | "consequences" | "chat";

interface AIInput {
  mode: Mode;
  language: string;
  code: string;
  question?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

const aiInputSchema = z.object({
  mode: z.enum(["explain", "consequences", "chat"]),
  language: z.string().max(50),
  code: z.string().max(50_000),
  question: z.string().max(4_000).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8_000),
      }),
    )
    .max(30)
    .optional(),
});

// Simple in-memory per-IP rate limiter to mitigate credit abuse.
// Note: worker isolates may not share memory, but this still meaningfully
// throttles bursts from a single client hitting the same isolate.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string) {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return;
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT_MAX) {
    throw new Error("Rate limit exceeded. Please wait a minute and try again.");
  }
}


const SYSTEM_PROMPTS: Record<Mode, string> = {
  explain: `You are Copilot Tutor, a friendly programming tutor. The user gives you source code in a given language. Produce a precise LINE-BY-LINE explanation, an overall memory diagram, an execution-flow diagram, AND per-line memory SNAPSHOTS that show how memory evolves.

Return STRICT JSON only, no prose, no markdown fences. Shape:
{
  "summary": "1-2 sentence high-level summary",
  "lines": [
    { "line": 1, "code": "<the source on that line>", "explain": "what this line does, why it matters" }
  ],
  "memory": "Short markdown description of the memory model: variables, stack frames, heap allocations.",
  "memoryDiagram": "Mermaid flowchart code (no fences) — OVERALL final memory state.",
  "flow": "Short markdown description of execution flow: loops, recursion, branches, function call order.",
  "flowDiagram": "Mermaid flowchart code (no fences) showing execution flow with decisions, loops, function calls.",
  "snapshots": [
    { "line": 3, "note": "1-sentence what changed in memory at this line", "memoryDiagram": "Mermaid code for memory state JUST AFTER executing this line" }
  ]
}

Mermaid rules (memory diagrams):
- Use 'flowchart TD' or 'flowchart LR'. Keep node IDs short (S1, H1, A0...).
- ALWAYS group with subgraphs when relevant: 'subgraph Stack', 'subgraph Heap', 'subgraph Globals'. End each with 'end'.
- Data-structure-aware visuals:
  * Arrays: horizontal LR chain of cells labeled with index and value, e.g. A0["[0] 7"] --> A1["[1] 3"] --> A2["[2] 9"]. Add a 'len=N' node when useful.
  * Stack (data structure): vertical TD chain with a TOP["top →"] arrow pointing at the head.
  * Queue: LR chain with FRONT["front →"] on the left and REAR["→ rear"] on the right.
  * Linked list: nodes like N1["val=5 | next"] --> N2["val=8 | next"] --> NULL(((null))).
  * Stack frames (call stack): each frame is its own subgraph named like 'frame: foo(x=2)' containing local variables.
  * Heap objects: inside 'subgraph Heap', nodes labeled with type and id, e.g. H1["Obj#1 name='a'"]. Stack vars reference them with dashed arrows: V1 -. ref .-> H1.
- For EVERY memory node, prefix the label with the source line that created/last-modified it in parentheses, e.g. S1["(L2) i = 0"]. This lets the UI cross-link memory cells to code.
- Color coding via classDef at the end of the diagram:
  classDef var fill:#2a1244,stroke:#a855f7,color:#f3e8ff;
  classDef heap fill:#1a3c2a,stroke:#22c55e,color:#dcfce7;
  classDef frame fill:#1e293b,stroke:#38bdf8,color:#e0f2fe;
  classDef ptr fill:#3b0764,stroke:#f59e0b,color:#fef3c7;
  Then 'class S1,S2 var' etc.
- Quote labels containing special chars. Keep each diagram under 25 nodes. MUST parse as valid Mermaid.

Snapshot rules:
- Provide a snapshot for KEY lines: variable assignments, function entries/returns, representative loop iterations, data-structure mutations. Skip pure comments, blank lines, trivial syntax.
- 4-12 snapshots total for typical programs.
- Each snapshot.memoryDiagram is a COMPLETE standalone mermaid diagram, not a delta.

Other rules:
- Include EVERY non-empty code line in 'lines'. Skip blank lines.
- Keep each 'explain' to 1-3 sentences. Beginner-friendly but technically correct.
- 'memory' and 'flow' descriptions: 2-4 sentences each.`,
  consequences: `You are Copilot Tutor. The user gives you code and the index of a specific line. Explain what would BREAK if this line were removed.

Return STRICT JSON only:
{
  "removedLine": <number>,
  "removedCode": "<the line>",
  "impact": "markdown: what breaks, runtime errors, behavioral changes, why",
  "severity": "critical" | "major" | "minor" | "cosmetic"
}`,
  chat: `You are Copilot, an AI programming tutor embedded inside a code explainer app. The user is studying the provided code. Answer their questions about the code, memory, execution flow, or consequences. Be concise, use markdown, use code blocks where helpful. Always ground answers in the provided code.`,
};

export const aiAssist = createServerFn({ method: "POST" })
  .inputValidator((d: unknown): AIInput => aiInputSchema.parse(d) as AIInput)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Per-IP rate limit to mitigate anonymous credit abuse.
    try {
      const req = getRequest();
      const ip =
        req?.headers.get("cf-connecting-ip") ??
        req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        "unknown";
      checkRateLimit(ip);
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("Rate limit")) throw e;
      // If request context is unavailable, fall through without limiting.
    }


    const system = SYSTEM_PROMPTS[data.mode];
    const userContent =
      data.mode === "chat"
        ? `Language: ${data.language}\n\nCode under study:\n\`\`\`${data.language}\n${data.code}\n\`\`\`\n\nQuestion: ${data.question ?? ""}`
        : data.mode === "consequences"
          ? `Language: ${data.language}\nLine to analyze: ${data.question}\n\nFull code:\n\`\`\`${data.language}\n${data.code}\n\`\`\``
          : `Language: ${data.language}\n\nCode:\n\`\`\`${data.language}\n${data.code}\n\`\`\``;

    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: system },
    ];
    if (data.history && data.mode === "chat") {
      for (const m of data.history) messages.push({ role: m.role, content: m.content });
    }
    messages.push({ role: "user", content: userContent });

    const body: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages,
    };
    if (data.mode !== "chat") {
      body.response_format = { type: "json_object" };
    }

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      if (resp.status === 429) throw new Error("Rate limit reached. Please wait a moment and try again.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Add credits in Lovable workspace settings.");
      const t = await resp.text();
      console.error("AI gateway error:", resp.status, t);
      throw new Error(`AI gateway error (${resp.status})`);
    }

    const json = await resp.json();
    const content: string = json.choices?.[0]?.message?.content ?? "";

    if (data.mode === "chat") {
      return { content };
    }

    // Parse JSON output (strip potential fences just in case)
    const cleaned = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    try {
      return { content, parsed: JSON.parse(cleaned) };
    } catch {
      return { content, parsed: null };
    }
  });
