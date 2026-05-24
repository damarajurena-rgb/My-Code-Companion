import { createServerFn } from "@tanstack/react-start";

type Mode = "explain" | "consequences" | "chat";

interface AIInput {
  mode: Mode;
  language: string;
  code: string;
  question?: string;
  history?: Array<{ role: "user" | "assistant"; content: string }>;
}

const SYSTEM_PROMPTS: Record<Mode, string> = {
  explain: `You are Copilot Tutor, a friendly programming tutor. The user gives you source code in a given language. Produce a precise LINE-BY-LINE explanation PLUS Mermaid diagrams for memory and execution flow.

Return STRICT JSON only, no prose, no markdown fences. Shape:
{
  "summary": "1-2 sentence high-level summary",
  "lines": [
    { "line": 1, "code": "<the source on that line>", "explain": "what this line does, why it matters" }
  ],
  "memory": "Short markdown description of the memory model: variables, stack frames, heap allocations.",
  "memoryDiagram": "Mermaid flowchart code (no fences) showing variables/stack/heap. Use subgraphs named Stack and Heap when relevant.",
  "flow": "Short markdown description of execution flow: loops, recursion, branches, function call order.",
  "flowDiagram": "Mermaid flowchart code (no fences) showing execution flow with decisions, loops, function calls."
}

Mermaid rules:
- Use 'flowchart TD' syntax. Keep node IDs short (A, B, S1, H1...).
- Use subgraph for grouping: subgraph Stack ... end / subgraph Heap ... end.
- Decisions: A{Condition?}. Loops: arrow back to earlier node with label.
- Quote labels containing special chars: A["x = 5"].
- Keep each diagram under 20 nodes. Valid Mermaid only — it MUST parse.

Other rules:
- Include EVERY non-empty line. Skip blank lines.
- Keep each "explain" to 1-3 sentences. Beginner-friendly but technically correct.
- "memory" and "flow" should be 2-4 sentences each.`,
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
  .inputValidator((d: AIInput) => d)
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
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
