import { useState } from "react";
import {
  Crown,
  Bug,
  Gauge,
  Clock,
  BarChart3,
  Languages,
  LineChart,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BENEFITS = [
  {
    icon: Bug,
    label: "Debugging tools",
    desc: "Step-through error tracing and breakpoint analysis",
  },
  {
    icon: Gauge,
    label: "Optimization hints",
    desc: "Efficiency & memory usage tips per line",
  },
  {
    icon: Clock,
    label: "Runtime analysis",
    desc: "Time complexity insights and profiling",
  },
  {
    icon: BarChart3,
    label: "Progress tracking",
    desc: "Save sessions, revision notes & milestones",
  },
  {
    icon: Languages,
    label: "Multi-language support",
    desc: "Python, Java, C, C++ and full DSA coverage",
  },
  {
    icon: LineChart,
    label: "Premium analytics",
    desc: "Compare attempts and measure efficiency gains",
  },
];

export function PremiumButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="premium"
        size="sm"
        onClick={() => setOpen(true)}
        aria-label="Upgrade to Premium"
        className="h-8 gap-1.5 font-mono text-xs font-bold"
      >
        <Crown className="h-3.5 w-3.5" aria-hidden />
        Upgrade to Premium
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-gold/20 bg-card sm:max-w-md">
          <DialogHeader className="gap-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0D1B2A] to-black ring-2 ring-gold/30">
              <Crown className="h-6 w-6 text-gold" aria-hidden />
            </div>
            <DialogTitle className="text-center font-mono text-lg font-bold">
              Upgrade to <span className="text-gold">Premium</span>
            </DialogTitle>
            <DialogDescription className="text-center text-sm">
              Unlock advanced tools to supercharge your learning.
            </DialogDescription>
          </DialogHeader>

          <ul className="mt-2 grid gap-2.5">
            {BENEFITS.map(({ icon: Icon, label, desc }) => (
              <li
                key={label}
                className="flex items-start gap-3 rounded-lg border border-border bg-background/60 p-3 transition-colors hover:bg-background"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gold/10">
                  <Icon className="h-4 w-4 text-gold" aria-hidden />
                </div>
                <div>
                  <p className="font-mono text-xs font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-col gap-2">
            <Button
              variant="premium"
              className="w-full font-mono text-sm font-bold"
              onClick={() => setOpen(false)}
            >
              <Crown className="h-4 w-4" aria-hidden />
              Get Premium — Coming Soon
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Phase 6 will add Razorpay / Paytm checkout.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
