import { useEffect, useState } from "react";
import { Code2, MessageCircle, Database, Activity, GitBranch, Crown, Sparkles } from "lucide-react";

const STORAGE_KEY = "copilot.intro.played";

/**
 * Intro animation overlay played once per session.
 * Six scenes (~6s each ≈ 36s total). Skippable.
 */
export function IntroAnimation() {
  const [visible, setVisible] = useState(false);
  const [scene, setScene] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timings = [5000, 5500, 6000, 6500, 6500, 6500];
    const t = setTimeout(() => {
      if (scene >= 5) finish();
      else setScene((s) => s + 1);
    }, timings[scene]);
    return () => clearTimeout(t);
  }, [visible, scene]);

  const finish = () => {
    sessionStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Intro animation"
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at center, #0D1B2A 0%, #000000 80%)",
      }}
    >
      {/* Skip */}
      <button
        onClick={finish}
        className="absolute right-6 top-6 rounded-full border border-white/20 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 backdrop-blur transition hover:bg-white/10 hover:text-white"
        aria-label="Skip intro"
      >
        Skip intro →
      </button>

      {/* Scene progress */}
      <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className="h-1 w-8 rounded-full transition-all duration-500"
            style={{
              background: i <= scene ? "#22d3ee" : "rgba(255,255,255,0.15)",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-3xl px-8 text-white">
        {scene === 0 && <SceneLogo />}
        {scene === 1 && <SceneBubble />}
        {scene === 2 && <SceneBar icon={<Database className="h-5 w-5" />} title="Memory" hue="#22d3ee" desc="Visualize variables, stack frames, and heap objects in real time." />}
        {scene === 3 && <SceneBar icon={<Activity className="h-5 w-5" />} title="Execution Flow" hue="#a78bfa" desc="Trace loops, branches, recursion, and function calls step by step." />}
        {scene === 4 && <SceneBar icon={<GitBranch className="h-5 w-5" />} title="Diagrams" hue="#f472b6" desc="Animated linked lists, queues, and trees with next/prev arrows." />}
        {scene === 5 && <ScenePremium />}
      </div>
    </div>
  );
}

function SceneLogo() {
  return (
    <div className="flex flex-col items-center text-center animate-fade-in">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-2xl"
        style={{
          background: "linear-gradient(135deg, #0D1B2A, #1e3a5f)",
          boxShadow: "0 0 60px rgba(34,211,238,0.4)",
        }}
      >
        <Code2 className="h-12 w-12" style={{ color: "#22d3ee" }} />
      </div>
      <h1 className="mb-3 text-5xl font-bold tracking-tight">
        Code Companion <span style={{ color: "#22d3ee" }}>AI</span>
      </h1>
      <p className="text-xl text-white/70">Learn Smarter</p>
    </div>
  );
}

function SceneBubble() {
  return (
    <div className="relative flex h-80 flex-col items-center justify-center animate-fade-in">
      <h2 className="mb-8 text-2xl font-semibold text-white/90">Your AI tutor — one click away</h2>
      <div className="relative">
        <div
          className="absolute inset-0 rounded-full animate-ping"
          style={{ background: "#22d3ee", opacity: 0.3 }}
        />
        <div
          className="relative flex h-20 w-20 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, #0D1B2A, #000000)",
            boxShadow: "0 0 40px rgba(34,211,238,0.6)",
          }}
        >
          <MessageCircle className="h-9 w-9 text-white" />
        </div>
      </div>
      <div
        className="mt-6 w-72 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur animate-scale-in"
        style={{ animationDelay: "0.6s", animationFillMode: "both" }}
      >
        <div className="mb-2 h-2 w-1/2 rounded bg-white/20" />
        <div className="mb-2 h-2 w-3/4 rounded bg-white/15" />
        <div className="h-2 w-2/3 rounded bg-white/10" />
      </div>
    </div>
  );
}

function SceneBar({ icon, title, hue, desc }: { icon: React.ReactNode; title: string; hue: string; desc: string }) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ background: `${hue}22`, color: hue }}
        >
          {icon}
        </div>
        <h2 className="text-3xl font-bold">{title}</h2>
      </div>
      <p className="mb-8 text-lg text-white/70">{desc}</p>
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-white/10 overflow-hidden"
          >
            <div
              className="h-full rounded-full animate-[grow_1.2s_ease-out_forwards]"
              style={{
                background: `linear-gradient(90deg, ${hue}, ${hue}66)`,
                width: 0,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          </div>
        ))}
      </div>
      <style>{`@keyframes grow { from { width: 0 } to { width: ${70 + Math.random() * 25}% } }`}</style>
    </div>
  );
}

function ScenePremium() {
  return (
    <div className="text-center animate-fade-in">
      <div
        className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
        style={{
          background: "linear-gradient(135deg, #FFD700, #F5B800)",
          boxShadow: "0 0 80px rgba(255,215,0,0.6)",
        }}
      >
        <Crown className="h-10 w-10 text-black" />
      </div>
      <h2 className="mb-3 text-4xl font-bold" style={{ color: "#FFD700" }}>
        Unlock Premium
      </h2>
      <p className="mb-6 text-white/70">
        Debugging · Optimization · Runtime analysis · Progress tracking · Multi-language · Analytics
      </p>
      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-cyan-400/10 px-6 py-3 text-lg font-semibold text-cyan-300">
        <Sparkles className="h-5 w-5" /> Start learning now
      </div>
    </div>
  );
}
