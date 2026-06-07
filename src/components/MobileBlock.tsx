import { Monitor } from "lucide-react";

export function MobileBlock() {
  return (
    <div
      role="alert"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-background px-6 text-center"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-mint/15">
        <Monitor className="h-7 w-7 text-mint" aria-hidden />
      </div>
      <h1 className="font-mono text-lg font-bold tracking-tight">Desktop or Tablet Required</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        Copilot Tutor is optimized for laptops, desktops, and tablets. Please open this workspace
        on a larger screen for the full experience.
      </p>
    </div>
  );
}
