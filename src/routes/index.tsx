import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useCallback } from "react";
import { Code2, Github, Sparkles } from "lucide-react";

import { aiAssist } from "@/lib/ai.functions";
import { LANGUAGES, SAMPLES, type LangId } from "@/lib/languages";
import { CodeEditor } from "@/components/workspace/CodeEditor";
import { ExplanationPanel, type ExplainResult } from "@/components/workspace/ExplanationPanel";
import { AssistantChat, type ChatMessage } from "@/components/workspace/AssistantChat";
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
          "Paste code in Python, JavaScript, Java, C, or C++ and get line-by-line AI explanations, memory & execution flow insights, and tutor-style Q&A.",
      },
      { property: "og:title", content: "Copilot Tutor — AI Code Explainer" },
      {
        property: "og:description",
        content: "Understand code line-by-line with an integrated AI tutor.",
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
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card/40 px-5 py-2.5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint/15 glow-mint">
            <Code2 className="h-4 w-4 text-mint" />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold tracking-tight">
              Copilot<span className="text-mint">.tutor</span>
            </h1>
            <p className="text-[10px] text-muted-foreground">
              AI code explainer · line-by-line · memory · execution flow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger className="h-8 w-[140px] border-border bg-input font-mono text-xs">
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
          >
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            Explain
          </Button>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
            aria-label="GitHub"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </header>

      {/* Main 3-pane dashboard */}
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-3 p-3">
        {/* Editor */}
        <section className="col-span-12 flex min-h-0 flex-col lg:col-span-6">
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
        </section>

        {/* Right side: tabs (Explanation | Copilot Chat) */}
        <section className="col-span-12 flex min-h-0 flex-col lg:col-span-6">
          <Tabs defaultValue="explain" className="flex min-h-0 flex-1 flex-col">
            <TabsList className="mb-2 h-9 w-fit bg-card/60">
              <TabsTrigger value="explain" className="font-mono text-xs">
                Explanation
              </TabsTrigger>
              <TabsTrigger value="chat" className="font-mono text-xs">
                Copilot Chat
              </TabsTrigger>
            </TabsList>
            <TabsContent
              value="explain"
              className="m-0 min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card/40"
            >
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
            </TabsContent>
            <TabsContent
              value="chat"
              className="m-0 min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-card/40"
            >
              <AssistantChat messages={chat} onSend={sendChat} loading={chatLoading} />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </div>
  );
}
