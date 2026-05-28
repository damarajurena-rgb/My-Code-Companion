import { useEffect, useRef, useState } from "react";
import { Bot, Minus, Square, X, GripHorizontal } from "lucide-react";
import { AssistantChat, type ChatMessage } from "./AssistantChat";

interface Props {
  messages: ChatMessage[];
  onSend: (text: string) => Promise<void>;
  loading: boolean;
}

const STORAGE_KEY = "ct-floating-assistant";

type State = { x: number; y: number; w: number; h: number; minimized: boolean; open: boolean };

const DEFAULT_STATE: State = {
  x: -1, // sentinel → compute from viewport on mount
  y: -1,
  w: 380,
  h: 520,
  minimized: false,
  open: true,
};

export function FloatingAssistant({ messages, onSend, loading }: Props) {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const dragRef = useRef<{ dx: number; dy: number } | null>(null);
  const resizeRef = useRef<{ sw: number; sh: number; sx: number; sy: number } | null>(null);

  // Load persisted state + compute default position bottom-right
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Partial<State>) : {};
      setState((s) => {
        const next = { ...s, ...saved };
        if (next.x < 0 || next.y < 0) {
          next.w = Math.min(next.w, window.innerWidth - 32);
          next.h = Math.min(next.h, window.innerHeight - 32);
          next.x = Math.max(16, window.innerWidth - next.w - 16);
          next.y = Math.max(16, window.innerHeight - next.h - 16);
        }
        // Clamp into viewport
        next.x = Math.min(Math.max(0, next.x), window.innerWidth - 80);
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

  // Drag
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current) {
        setState((s) => ({
          ...s,
          x: Math.min(Math.max(0, e.clientX - dragRef.current!.dx), window.innerWidth - 80),
          y: Math.min(Math.max(0, e.clientY - dragRef.current!.dy), window.innerHeight - 40),
        }));
      } else if (resizeRef.current) {
        const r = resizeRef.current;
        setState((s) => ({
          ...s,
          w: Math.max(300, r.sw + (e.clientX - r.sx)),
          h: Math.max(280, r.sh + (e.clientY - r.sy)),
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
    dragRef.current = { dx: e.clientX - state.x, dy: e.clientY - state.y };
    document.body.style.userSelect = "none";
  };
  const startResize = (e: React.MouseEvent) => {
    e.stopPropagation();
    resizeRef.current = { sw: state.w, sh: state.h, sx: e.clientX, sy: e.clientY };
    document.body.style.userSelect = "none";
  };

  if (!state.open) {
    return (
      <button
        onClick={() => setState((s) => ({ ...s, open: true, minimized: false }))}
        aria-label="Open Copilot Assistant"
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-mint text-primary-foreground shadow-lg hover:bg-mint-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bot className="h-5 w-5" />
      </button>
    );
  }

  const minimized = state.minimized;
  const h = minimized ? 44 : state.h;

  return (
    <div
      role="dialog"
      aria-label="Copilot Assistant"
      style={{ left: state.x, top: state.y, width: state.w, height: h }}
      className="fixed z-40 flex flex-col overflow-hidden rounded-lg border border-border bg-background/95 shadow-2xl backdrop-blur"
    >
      <div
        onMouseDown={startDrag}
        className="flex h-11 shrink-0 cursor-move items-center justify-between gap-2 border-b border-border bg-card/80 px-3"
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <Bot className="h-3.5 w-3.5 text-mint" />
          <span className="font-mono text-xs font-semibold">Copilot Assistant</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setState((s) => ({ ...s, minimized: !s.minimized }))}
            aria-label={minimized ? "Maximize assistant" : "Minimize assistant"}
            title={minimized ? "Maximize" : "Minimize"}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {minimized ? <Square className="h-3 w-3" /> : <Minus className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => setState((s) => ({ ...s, open: false }))}
            aria-label="Close assistant"
            title="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="min-h-0 flex-1">
            <AssistantChat messages={messages} onSend={onSend} loading={loading} />
          </div>
          <div
            onMouseDown={startResize}
            aria-hidden
            className="absolute bottom-0 right-0 h-4 w-4 cursor-nwse-resize"
            style={{
              background:
                "linear-gradient(135deg, transparent 50%, hsl(var(--border, 0 0% 50%)) 50%)",
            }}
          />
        </>
      )}
    </div>
  );
}
