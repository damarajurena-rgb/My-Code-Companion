import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback, useEffect } from "react";
import { Code2, Sparkles, Database, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";

import { aiAssist } from "@/lib/ai.functions";
import { LANGUAGES, SAMPLES, type LangId } from "@/lib/languages";
import { CodeEditor } from "@/components/workspace/CodeEditor";
import { ExplanationPanel, type ExplainResult, type MemorySnapshot } from "@/components/workspace/ExplanationPanel";
import type { ChatMessage } from "@/components/workspace/AssistantChat";
import { FloatingAssistant } from "@/components/workspace/FloatingAssistant";
import { MermaidDiagram } from "@/components/workspace/MermaidDiagram";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingTour } from "@/components/OnboardingTour";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Copilot Tutor — Line-by-line AI Code Explainer" },
      {
        name: "description",
        content:
          "Paste code in Python, JavaScript, Java, C, or C++ and get line-by-line AI explanations, memory & execution flow diagrams, and tutor-style Q&A.",
      },
      { property: "og:title", content: "Copilot Tutor — AI Code Explainer" },
      {
        property: "og:description",
        content: "Understand code line-by-line with diagrams and an integrated AI tutor.",
      },
    ],
  }),
  component: Workspace,
});

function Workspace() {
  const [language, setLanguage] = useState<LangId>("python");
  const [code, setCode] = useState<string>(SAMPLES.python);
  const [highlightedLine, setHighlightedLine] = useState<number | null>(null);

  const [explainResult, setExplainResult] = useState<ExplainResult | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);

  const [consequence, setConsequence] = useState<{
    loading: boolean;
    data: { removedLine: number; removedCode: string; impact: string; severity: string } | null;
  }>({ loading: false, data: null });

  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  const callAI = useServerFn(aiAssist);

  const onLanguageChange = (v: string) => {
    const id = v as LangId;
    setLanguage(id);
    setCode(SAMPLES[id]);
    setExplainResult(null);
    setConsequence({ loading: false, data: null });
    setHighlightedLine(null);
  };

  const runExplain = useCallback(async () => {
    setExplainLoading(true);
    setExplainError(null);
    try {
      const res = await callAI({ data: { mode: "explain", language, code } });
      if (res.parsed) setExplainResult(res.parsed as ExplainResult);
      else setExplainError("Could not parse AI response. Try again.");
    } catch (e) {
      setExplainError(e instanceof Error ? e.message : "Failed to explain");
    } finally {
      setExplainLoading(false);
    }
  }, [callAI, code, language]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        if (!explainLoading) runExplain();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [runExplain, explainLoading]);

  const analyzeLine = useCallback(
    async (line: number) => {
      setConsequence({ loading: true, data: null });
      try {
        const res = await callAI({
          data: { mode: "consequences", language, code, question: String(line) },
        });
        if (res.parsed) setConsequence({ loading: false, data: res.parsed as any });
        else setConsequence({ loading: false, data: null });
      } catch {
        setConsequence({ loading: false, data: null });
      }
    },
    [callAI, code, language],
  );

  const sendChat = useCallback(
    async (text: string) => {
      const next: ChatMessage[] = [...chat, { role: "user", content: text }];
      setChat(next);
      setChatLoading(true);
      try {
        const res = await callAI({
          data: {
            mode: "chat",
            language,
            code,
            question: text,
            history: chat,
          },
        });
        setChat([...next, { role: "assistant", content: res.content || "(no response)" }]);
      } catch (e) {
        setChat([
          ...next,
          {
            role: "assistant",
            content: `⚠️ ${e instanceof Error ? e.message : "Failed to respond"}`,
          },
        ]);
      } finally {
        setChatLoading(false);
      }
    },
    [callAI, chat, code, language],
  );

  const currentLang = LANGUAGES.find((l) => l.id === language)!;

  return (
    <div className="flex min-h-dvh flex-col">
      <OnboardingTour />
      <a
        href="#workspace-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-mint focus:px-3 focus:py-1.5 focus:text-xs focus:font-medium focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      {/* ────────── Row 1: Header / Navigation ────────── */}
      <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 glow-mint">
            <Code2 className="h-4 w-4 text-mint" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-tight">
              Copilot<span className="text-mint">.tutor</span>
            </h1>
            <p className="hidden text-[10px] text-muted-foreground sm:block">
              AI code explainer · diagrams · memory · execution flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger aria-label="Programming language" className="h-8 w-[130px] border-border bg-input font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id} className="font-mono text-xs">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            onClick={runExplain}
            disabled={explainLoading}
            className="h-8 bg-mint text-primary-foreground hover:bg-mint-glow"
            title="Explain (⌘/Ctrl + Enter)"
            aria-label="Explain code (Command or Control + Enter)"
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Explain
            <kbd className="ml-2 hidden rounded bg-black/30 px-1.5 py-0.5 font-mono text-[9px] text-primary-foreground/80 sm:inline">
              ⌘↵
            </kbd>
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main id="workspace-main" className="flex flex-1 flex-col">

      {/* ────────── Row 2: Editor | Explanations ────────── */}
      <section className="grid grid-cols-1 gap-3 px-3 pt-3 lg:grid-cols-2">
        <div className="flex h-[60vh] min-h-[420px] flex-col lg:h-[70vh]">
          <div className="mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Editor
              </span>
              <span className="rounded bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-mint">
                {currentLang.label}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {code.split("\n").length} lines
            </span>
          </div>
          <div className="min-h-0 flex-1">
            <CodeEditor
              value={code}
              onChange={setCode}
              language={currentLang.monaco}
              highlightedLine={highlightedLine}
              onLineClick={(l) => setHighlightedLine(l)}
            />
          </div>
        </div>

        <div className="flex h-[60vh] min-h-[420px] flex-col overflow-hidden rounded-lg border border-border bg-card/40 lg:h-[70vh]">
          <ExplanationPanel
            result={explainResult}
            loading={explainLoading}
            error={explainError}
            onRun={runExplain}
            onHoverLine={setHighlightedLine}
            highlightedLine={highlightedLine}
            consequence={consequence}
            onAnalyzeLine={analyzeLine}
          />
        </div>
      </section>

      {/* ────────── Row 3: Diagrams Canvas ────────── */}
      <section className="px-3 pt-3">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Diagrams Canvas · Mermaid
          </span>
        </div>
        <div className="overflow-hidden rounded-lg border border-border bg-card/40">
          <Tabs defaultValue="memory" className="w-full">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <TabsList className="h-8 bg-secondary/40">
                <TabsTrigger value="memory" className="gap-1.5 text-xs">
                  <Database className="h-3 w-3" /> Memory
                </TabsTrigger>
                <TabsTrigger value="flow" className="gap-1.5 text-xs">
                  <Activity className="h-3 w-3" /> Execution Flow
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="memory" className="m-0">
              <DiagramView
                diagram={
                  (highlightedLine &&
                    explainResult?.snapshots?.find((s) => s.line === highlightedLine)
                      ?.memoryDiagram) ||
                  explainResult?.memoryDiagram
                }
                text={
                  (highlightedLine &&
                    explainResult?.snapshots?.find((s) => s.line === highlightedLine)?.note) ||
                  explainResult?.memory
                }
                id={`mem-${highlightedLine ?? "all"}`}
                emptyHint="Run Explain to visualize variables, stack frames, heap objects, arrays, queues, and linked lists."
                snapshotLine={
                  highlightedLine &&
                  explainResult?.snapshots?.some((s) => s.line === highlightedLine)
                    ? highlightedLine
                    : null
                }
                snapshots={explainResult?.snapshots}
                onPickSnapshot={(l) => setHighlightedLine(l)}
                onNodeLineClick={(l) => setHighlightedLine(l)}
                onNodeLineHover={(l) => setHighlightedLine(l)}
                highlightLine={highlightedLine}
              />
            </TabsContent>
            <TabsContent value="flow" className="m-0">
              <DiagramView
                diagram={explainResult?.flowDiagram}
                text={explainResult?.flow}
                id="flow"
                emptyHint="Run Explain to visualize loops, branches, recursion, and function calls."
                onNodeLineClick={(l) => setHighlightedLine(l)}
                highlightLine={highlightedLine}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ────────── Floating AI Assistant (movable / minimizable) ────────── */}
      <FloatingAssistant
        messages={chat}
        onSend={sendChat}
        loading={chatLoading}
        onClear={() => setChat([])}
      />

      </main>
    </div>
  );
}

function DiagramView({
  diagram,
  text,
  id,
  emptyHint,
  snapshotLine,
  snapshots,
  onPickSnapshot,
  onNodeLineClick,
  onNodeLineHover,
  highlightLine,
}: {
  diagram?: string;
  text?: string;
  id: string;
  emptyHint: string;
  snapshotLine?: number | null;
  snapshots?: MemorySnapshot[];
  onPickSnapshot?: (line: number) => void;
  onNodeLineClick?: (line: number) => void;
  onNodeLineHover?: (line: number | null) => void;
  highlightLine?: number | null;
}) {
  if (!diagram && !text) {
    return (
      <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {emptyHint}
      </div>
    );
  }
  return (
    <div className="grid gap-3 p-3 md:grid-cols-[1fr_280px]">
      <div className="flex h-[480px] flex-col rounded-md border border-border bg-background/40">
        {snapshots && snapshots.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card/40 px-2 py-1.5">
            <span className="mr-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Snapshot
            </span>
            <button
              onClick={() => onPickSnapshot?.(0)}
              className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors ${
                !snapshotLine
                  ? "bg-mint text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              final
            </button>
            {snapshots.map((s) => (
              <button
                key={s.line}
                onClick={() => onPickSnapshot?.(s.line)}
                title={s.note}
                className={`rounded px-2 py-0.5 font-mono text-[10px] transition-colors ${
                  snapshotLine === s.line
                    ? "bg-mint text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                L{s.line}
              </button>
            ))}
          </div>
        )}
        <div className="min-h-0 flex-1">
          {diagram ? (
            <MermaidDiagram
              code={diagram}
              id={id}
              onNodeLineClick={onNodeLineClick}
              onNodeLineHover={onNodeLineHover}
              highlightLine={highlightLine}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
              No diagram available
            </div>
          )}
        </div>
      </div>
      <aside className="rounded-md border border-border bg-card/40 p-3">
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-mint">
          {snapshotLine ? `Snapshot @ L${snapshotLine}` : "Notes"}
        </p>
        <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
          {text ? <ReactMarkdown>{text}</ReactMarkdown> : <p className="text-muted-foreground">—</p>}
        </div>
        <p className="mt-3 text-[10px] text-muted-foreground">
          Tip: hover a code line or click a memory node labeled (Lx) to sync views.
        </p>
      </aside>
    </div>
  );
}
