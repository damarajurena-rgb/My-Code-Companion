import ReactMarkdown from "react-markdown";
import { useState } from "react";
import { Loader2, Sparkles, AlertTriangle, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ExplainResult {
  summary: string;
  lines: Array<{ line: number; code: string; explain: string }>;
  memory: string;
  memoryDiagram?: string;
  flow: string;
  flowDiagram?: string;
}

interface Props {
  result: ExplainResult | null;
  loading: boolean;
  error: string | null;
  onRun: () => void;
  onHoverLine?: (line: number | null) => void;
  highlightedLine?: number | null;
  consequence: {
    loading: boolean;
    data: { removedLine: number; removedCode: string; impact: string; severity: string } | null;
  };
  onAnalyzeLine?: (line: number) => void;
}

const severityColor: Record<string, string> = {
  critical: "text-destructive",
  major: "text-orange-400",
  minor: "text-yellow-400",
  cosmetic: "text-muted-foreground",
};

export function ExplanationPanel({
  result,
  loading,
  error,
  onRun,
  onHoverLine,
  highlightedLine,
  consequence,
  onAnalyzeLine,
}: Props) {
  const [copiedLine, setCopiedLine] = useState<number | null>(null);

  const copyLine = async (line: number, code: string, explain: string) => {
    const text = `// L${line}: ${code}\n// ${explain}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLine(line);
      setTimeout(() => setCopiedLine((v) => (v === line ? null : v)), 1500);
    } catch {
      /* ignore */
    }
  };
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-mint" />
          <h2 className="font-mono text-sm font-semibold tracking-tight">Tutor Explanation</h2>
        </div>
        <Button size="sm" onClick={onRun} disabled={loading} className="bg-mint text-primary-foreground hover:bg-mint-glow">
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Explain"}
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-5 px-4 py-4">
          {error && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !loading && !error && (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Click <span className="font-mono text-mint">Explain</span> to get a line-by-line breakdown,
              memory model, and execution flow.
            </div>
          )}

          {loading && !result && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-mint" />
              <p className="font-mono text-xs">Analyzing your code...</p>
            </div>
          )}

          {result && (
            <>
              <div className="rounded-lg border border-border bg-card/40 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-mint">Summary</p>
                <p className="text-sm leading-relaxed">{result.summary}</p>
              </div>

              <section>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-mint">
                  Line by Line
                </p>
                <ol className="space-y-1.5">
                  {result.lines.map((l) => {
                    const active = highlightedLine === l.line;
                    return (
                      <li
                        key={l.line}
                        onMouseEnter={() => onHoverLine?.(l.line)}
                        onMouseLeave={() => onHoverLine?.(null)}
                        className={`group cursor-pointer rounded-md border border-transparent px-2.5 py-2 text-sm transition-all ${
                          active
                            ? "border-mint/40 bg-mint/10"
                            : "hover:border-border hover:bg-card/60"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 inline-flex h-5 min-w-[1.75rem] items-center justify-center rounded bg-secondary px-1.5 font-mono text-[10px] text-mint">
                            L{l.line}
                          </span>
                          <div className="flex-1">
                            <pre className="mb-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[11px] text-muted-foreground">
                              {l.code}
                            </pre>
                            <p className="text-[13px] leading-snug">{l.explain}</p>
                            <button
                              onClick={() => onAnalyzeLine?.(l.line)}
                              className="mt-1.5 hidden text-[10px] font-medium text-mint hover:underline group-hover:inline"
                            >
                              What if I remove this line?
                            </button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </section>




              {(consequence.loading || consequence.data) && (
                <section className="rounded-lg border border-mint/30 bg-mint/5 p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-mint" />
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-mint">
                      Consequence Analysis
                    </p>
                  </div>
                  {consequence.loading && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reasoning about removal...
                    </div>
                  )}
                  {consequence.data && (
                    <div>
                      <div className="mb-1 flex items-center gap-2 text-xs">
                        <span className="font-mono text-mint">L{consequence.data.removedLine}</span>
                        <span
                          className={`rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${
                            severityColor[consequence.data.severity] ?? "text-muted-foreground"
                          }`}
                        >
                          {consequence.data.severity}
                        </span>
                      </div>
                      <pre className="mb-2 overflow-x-auto rounded bg-background/60 px-2 py-1 font-mono text-[11px] text-muted-foreground">
                        {consequence.data.removedCode}
                      </pre>
                      <div className="prose prose-invert prose-sm max-w-none text-sm">
                        <ReactMarkdown>{consequence.data.impact}</ReactMarkdown>
                      </div>
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
