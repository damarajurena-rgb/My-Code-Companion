import { Sun, Moon, Contrast } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";

const NEXT_LABEL: Record<Theme, string> = {
  light: "Switch to dark theme",
  dark: "Switch to high-contrast theme",
  hc: "Switch to light theme",
};

export function ThemeToggle() {
  const { theme, cycle } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Contrast;
  return (
    <button
      onClick={cycle}
      aria-label={NEXT_LABEL[theme]}
      title={NEXT_LABEL[theme]}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card/60 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}
