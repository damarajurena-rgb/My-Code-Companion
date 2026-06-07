import { Crown } from "lucide-react";
import { toast } from "sonner";

const BENEFITS = [
  "Debugging tools — step-through error tracing",
  "Optimization hints — efficiency & memory tips",
  "Runtime analysis — time complexity insights",
  "Progress tracking — save sessions & notes",
  "Multi-language — Java, Python, DSA",
  "Premium analytics — efficiency comparisons",
].join("\n• ");

export function PremiumButton() {
  const handleClick = () => {
    // TODO (Phase 6): redirect to Razorpay/Paytm checkout URL
    toast.info("Premium checkout coming soon", {
      description: "Unlock debugging, optimization, runtime analysis, and more.",
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Upgrade to Premium — unlock debugging, optimization, runtime analysis, progress tracking, multi-language support, and analytics"
      title={`Premium benefits:\n• ${BENEFITS}`}
      style={{
        background: "linear-gradient(135deg, #FFD700, #F5B800)",
        color: "#0D1B2A",
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-md px-3 font-mono text-xs font-bold shadow-sm transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Crown className="h-3.5 w-3.5" aria-hidden />
      Upgrade to Premium
    </button>
  );
}
