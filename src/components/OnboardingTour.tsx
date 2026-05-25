import { useEffect, useState } from "react";
import { X, Sparkles, Keyboard, Database, Bot, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const KEY = "ct-onboarded-v1";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Copilot Tutor",
    body: "Paste or type code in any of 5 languages and get a line-by-line breakdown — explained like a tutor would.",
  },
  {
    icon: Keyboard,
    title: "One shortcut to remember",
    body: "Hit ⌘/Ctrl + Enter from anywhere to run Explain. Click the Explain button to do the same.",
  },
  {
    icon: Database,
    title: "Memory & execution diagrams",
    body: "After Explain runs, scroll to the Diagrams Canvas to see how variables sit in memory and how control flows through your code.",
  },
  {
    icon: Bot,
    title: "Ask Copilot anything",
    body: "Use the assistant below to debug, get alternative implementations, ask for complexity, or run 'what if' analyses.",
  },
];

export function OnboardingTour() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setOpen(true);
    } catch {
      /* ignore */
    }
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
    setStep(0);
  };

  if (!open) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const last = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ct-tour-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 px-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl glow-mint">
        <button
          onClick={dismiss}
          aria-label="Close tour"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-mint/15 text-mint">
          <Icon className="h-6 w-6" />
        </div>

        <h2 id="ct-tour-title" className="mb-2 font-mono text-lg font-bold tracking-tight">
          {s.title}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">{s.body}</p>

        <div className="mb-5 flex items-center gap-1.5" aria-hidden>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-mint" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={dismiss}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </button>
          <Button
            size="sm"
            onClick={() => (last ? dismiss() : setStep(step + 1))}
            className="bg-mint text-primary-foreground hover:bg-mint-glow"
          >
            {last ? "Get started" : "Next"}
            {!last && <ArrowRight className="ml-1 h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
