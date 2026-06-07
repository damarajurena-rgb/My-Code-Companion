import { useEffect, useRef, useState, useCallback } from "react";
import { X, GraduationCap, Zap, ScrollText, Trash2, MessageCircle } from "lucide-react";
import { AssistantChat, type ChatMessage } from "./AssistantChat";

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  loading: boolean;
  onClear?: () => void;
}

const STORAGE_KEY = "ct-floating-assistant";

type Mode = "tutor" | "quick" | "exam";

type State = {
  w: number;
  h: number;
  open: boolean;
  mode: Mode;
};

const DEFAULT_STATE: State = {
  w: 400,
  h: 560,
  open: false,
  mode: "tutor",
};

const BUBBLE = 60;
const GRADIENT = "linear-gradient(135deg, #0D1B2A, #000000)";

const MODE_PREFIX: Record<Mode, string> = {
  tutor:
    "[Tutor Mode] Teach me step-by-step like a patient instructor. Use headings, numbered steps, and reference specific line numbers and memory state where relevant.\n\nQuestion: ",
  quick:
    "[Quick Help] Answer in 1-3 short sentences. No headings, no fluff — just the hint.\n\nQuestion: ",
  exam:
    "[Exam Prep] Respond viva-style: ask me a focused follow-up question about this code first, then give the model answer underneath. Keep it concise.\n\nTopic: ",
};

const MODE_META: Record<Mode, { label: string; icon: typeof GraduationCap; hint: string }> = {
  tutor: { label: "Tutor", icon: GraduationCap, hint: "Detailed step-by-step teaching" },
  quick: { label: "Quick Help", icon: Zap, hint: "Short hints, fast answers" },
  exam: { label: "Exam Prep", icon: ScrollText, hint: "Viva-style Q&A drills" },
};

export function FloatingAssistant({ messages, onSend, loading, onClear }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const resizeRef = useRef<{ sw: number; sh: number; sx: number; sy: number } | null>(null);

  // Load persisted size/mode/open
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Partial<State>;
        setState((s) => ({
          ...s,
          w: saved.w ?? s.w,
          h: saved.h ?? s.h,
          mode: saved.mode ?? s.mode,
          open: saved.open ?? s.open,
        }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state]);

  // Resize from top-left grip (panel anchored bottom-right)
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const r = resizeRef.current;
      setState((s) => ({
        ...s,
        w: Math.max(320, Math.min(window.innerWidth - 20, r.sw + (r.sx - e.clientX))),
        h: Math.max(320, Math.min(window.innerHeight - 20, r.sh + (r.sy - e.clientY))),
      }));
    };
    const onUp = () => {
      resizeRef.current = null;
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = { sw: state.w, sh: state.h, sx: e.clientX, sy: e.clientY };
    document.body.style.userSelect = "none";
  };

  // Alt+A toggle, Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        setState((s) => ({ ...s, open: !s.open }));
      }
      if (e.key === "Escape" && state.open) {
        setState((s) => ({ ...s, open: false }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state.open]);

  const wrappedSend = useCallback(
    (text: string) => onSend(MODE_PREFIX[state.mode] + text),
    [onSend, state.mode],
  );

  const handleClear = () => {
    if (!onClear || messages.length === 0) return;
    if (window.confirm("Clear assistant conversation?")) onClear();
  };

  // ────────── Circular bubble (flush bottom-right) ──────────
  if (!state.open) {
    return (
      <button
        onClick={() => setState((s) => ({ ...s, open: true }))}
        aria-label="Open Copilot Assistant (Alt+A)"
        title="Copilot Assistant — click to open (Alt+A)"
        style={{
          width: BUBBLE,
          height: BUBBLE,
          background: GRADIENT,
          bottom: 0,
          right: 0,
        }}
        className="fixed z-40 m-3 flex items-center justify-center rounded-full text-white shadow-2xl ring-2 ring-white/20 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-mint"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
        {messages.length > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-mint px-1 font-mono text-[10px] font-bold text-primary-foreground ring-2 ring-background"
          >
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  // ────────── Expanded panel (anchored bottom-right) ──────────
  const w = Math.min(state.w, typeof window !== "undefined" ? window.innerWidth - 20 : state.w);
  const h = Math.min(state.h, typeof window !== "undefined" ? window.innerHeight - 20 : state.h);

  return (
    <div
      role="dialog"
      aria-label="Copilot Assistant panel"
      style={{ right: 12, bottom: 12, width: w, height: h }}
      className="fixed z-40 flex flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl ring-1 ring-white/10 backdrop-blur"
    >
      {/* Header */}
      <div
        style={{ background: GRADIENT }}
        className="flex h-11 shrink-0 items-center justify-between gap-2 border-b border-border px-3 text-white"
      >
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4" aria-hidden />
          <span className="font-mono text-xs font-semibold">Copilot Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          {onClear && (
            <button
              onClick={handleClear}
              aria-label="Clear conversation"
              title="Clear chat"
              disabled={messages.length === 0}
              className="inline-flex h-7 items-center gap-1 rounded px-2 text-[10px] font-medium text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint disabled:opacity-40"
            >
              <Trash2 className="h-3 w-3" />
              Clear
            </button>
          )}
          <button
            onClick={() => setState((s) => ({ ...s, open: false }))}
            aria-label="Close assistant"
            title="Close (Esc)"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-white/80 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mode tabs */}
      <div
        role="tablist"
        aria-label="Assistant mode"
        className="flex shrink-0 items-center gap-1 border-b border-border bg-card/40 px-2 py-1.5"
      >
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const meta = MODE_META[m];
          const Icon = meta.icon;
          const active = state.mode === m;
          return (
            <button
              key={m}
              role="tab"
              aria-selected={active}
              aria-label={`${meta.label} mode — ${meta.hint}`}
              title={meta.hint}
              onClick={() => setState((s) => ({ ...s, mode: m }))}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 font-mono text-[11px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                active
                  ? "bg-mint text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-3 w-3" aria-hidden />
              {meta.label}
            </button>
          );
        })}
      </div>

      <div className="border-b border-border bg-background/40 px-3 py-1.5">
        <p className="text-[10px] text-muted-foreground">{MODE_META[state.mode].hint}</p>
      </div>

      <div className="min-h-0 flex-1">
        <AssistantChat messages={messages} onSend={wrappedSend} loading={loading} />
      </div>

      {/* Resize grip — top-left since panel is anchored bottom-right */}
      <div
        onMouseDown={startResize}
        aria-hidden
        title="Resize"
        className="absolute left-0 top-0 h-4 w-4 cursor-nwse-resize"
        style={{
          background: "linear-gradient(315deg, transparent 50%, hsl(var(--border, 0 0% 50%)) 50%)",
        }}
      />
    </div>
  );
}
