import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, Minus, X, GripHorizontal, GraduationCap, Zap, ScrollText, Trash2 } from "lucide-react";
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
  x: number;
  y: number;
  w: number;
  h: number;
  open: boolean; // true = expanded panel, false = circular bubble
  mode: Mode;
};

const DEFAULT_STATE: State = {
  x: -1,
  y: -1,
  w: 400,
  h: 560,
  open: false,
  mode: "tutor",
};

const BUBBLE = 56;

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
  const dragRef = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const resizeRef = useRef<{ sw: number; sh: number; sx: number; sy: number } | null>(null);

  // Load persisted state + default position bottom-right
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<State>) : {};
      setState((s) => {
        const next = { ...s, ...saved };
        const size = next.open ? { w: next.w, h: next.h } : { w: BUBBLE, h: BUBBLE };
        if (next.x < 0 || next.y < 0) {
          next.x = Math.max(16, window.innerWidth - size.w - 20);
          next.y = Math.max(16, window.innerHeight - size.h - 20);
        }
        next.x = Math.min(Math.max(0, next.x), window.innerWidth - 60);
        next.y = Math.min(Math.max(0, next.y), window.innerHeight - 60);
        return next;
      });
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

  // Pointer events for drag / resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        dragRef.current.moved = true;
        setState((s) => ({
          ...s,
          x: Math.min(Math.max(0, e.clientX - dragRef.current!.dx), window.innerWidth - 50),
          y: Math.min(Math.max(0, e.clientY - dragRef.current!.dy), window.innerHeight - 50),
        }));
      } else if (resizeRef.current) {
        const r = resizeRef.current;
        setState((s) => ({
          ...s,
          w: Math.max(320, Math.min(window.innerWidth - 20, r.sw + (e.clientX - r.sx))),
          h: Math.max(320, Math.min(window.innerHeight - 20, r.sh + (e.clientY - r.sy))),
        }));
      }
    };
    const onUp = () => {
      dragRef.current = null;
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

  const startDrag = (e: React.MouseEvent) => {
    dragRef.current = { dx: e.clientX - state.x, dy: e.clientY - state.y, moved: false };
    document.body.style.userSelect = "none";
  };
  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = { sw: state.w, sh: state.h, sx: e.clientX, sy: e.clientY };
    document.body.style.userSelect = "none";
  };

  // Global shortcut: Alt+A toggles the bubble open/closed
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

  // ────────── Circular bubble ──────────
  if (!state.open) {
    const posStyle =
      state.x >= 0 && state.y >= 0
        ? { left: state.x, top: state.y }
        : { right: 20, bottom: 20 };
    return (
      <button
        onMouseDown={startDrag}
        onClick={(e) => {
          if (dragRef.current?.moved) {
            e.preventDefault();
            return;
          }
          setState((s) => ({ ...s, open: true }));
        }}
        aria-label="Open Copilot Assistant (Alt+A)"
        title="Copilot Assistant — drag to move, click to open (Alt+A)"
        style={{ ...posStyle, width: BUBBLE, height: BUBBLE }}
        className="fixed z-40 flex items-center justify-center rounded-full bg-mint text-primary-foreground shadow-2xl ring-2 ring-mint/40 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring active:cursor-grabbing"
      >
        <Bot className="h-6 w-6" aria-hidden />
        {messages.length > 0 && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-background px-1 font-mono text-[10px] font-bold text-mint ring-2 ring-mint"
          >
            {messages.length}
          </span>
        )}
      </button>
    );
  }

  // ────────── Expanded panel ──────────
  const w = Math.min(state.w, typeof window !== "undefined" ? window.innerWidth - 20 : state.w);
  const h = Math.min(state.h, typeof window !== "undefined" ? window.innerHeight - 20 : state.h);

  return (
    <div
      role="dialog"
      aria-label="Copilot Assistant panel"
      style={{ left: state.x, top: state.y, width: w, height: h }}
      className="fixed z-40 flex flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl ring-1 ring-mint/20 backdrop-blur"
    >
      {/* Drag handle / header */}
      <div
        onMouseDown={startDrag}
        className="flex h-11 shrink-0 cursor-move items-center justify-between gap-2 border-b border-border bg-card/80 px-3"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
          <Bot className="h-3.5 w-3.5 text-mint" aria-hidden />
          <span className="font-mono text-xs font-semibold">Copilot Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          {onClear && (
            <button
              onClick={() => {
                if (messages.length === 0) return;
                if (window.confirm("Clear assistant conversation?")) onClear();
              }}
              aria-label="Clear conversation"
              title="Clear chat"
              disabled={messages.length === 0}
              className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setState((s) => ({ ...s, open: false }))}
            aria-label="Minimize to bubble"
            title="Minimize"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, open: false }))}
            aria-label="Close assistant"
            title="Close (Esc)"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

      {/* Resize grip */}
      <div
        onMouseDown={startResize}
        aria-hidden
        title="Resize"
        className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
        style={{
          background: "linear-gradient(135deg, transparent 50%, hsl(var(--border, 0 0% 50%)) 50%)",
        }}
      />
    </div>
  );
}
