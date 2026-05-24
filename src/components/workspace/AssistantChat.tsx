import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  loading: boolean;
}

const SUGGESTIONS = [
  "Explain what happens in memory step by step",
  "What's the time complexity?",
  "Rewrite this iteratively instead of recursively",
  "Where could this code break?",
];

export function AssistantChat({ messages, onSend, loading }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const submit = async () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    await onSend(t);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-mint/15">
          <Bot className="h-3.5 w-3.5 text-mint" />
        </div>
        <div>
          <h2 className="font-mono text-sm font-semibold tracking-tight">Copilot Tutor</h2>
          <p className="text-[10px] text-muted-foreground">Ask anything about your code</p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div ref={scrollRef} className="space-y-4 px-4 py-4">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Hi — I'm Copilot. I can read the code in the editor. Try asking:
              </p>
              <div className="flex flex-col gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-md border border-border bg-card/40 px-2.5 py-1.5 text-left text-xs text-foreground transition-colors hover:border-mint/40 hover:bg-mint/5"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-mint/15">
                  <Bot className="h-3.5 w-3.5 text-mint" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-mint text-primary-foreground"
                    : "border border-border bg-card/60"
                }`}
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{m.content}</p>
                )}
              </div>
              {m.role === "user" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-secondary">
                  <User className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-2.5">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-mint/15">
                <Bot className="h-3.5 w-3.5 text-mint" />
              </div>
              <div className="rounded-lg border border-border bg-card/60 px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-mint" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-border p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask Copilot about your code..."
            className="min-h-[40px] resize-none border-border bg-input font-sans text-sm"
            rows={1}
          />
          <Button
            onClick={submit}
            disabled={loading || !input.trim()}
            size="icon"
            className="bg-mint text-primary-foreground hover:bg-mint-glow"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
