import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { AlertTriangle } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  fontFamily: "JetBrains Mono, monospace",
  themeVariables: {
    primaryColor: "#2a1244",
    primaryTextColor: "#f3e8ff",
    primaryBorderColor: "#a855f7",
    lineColor: "#c084fc",
    secondaryColor: "#1a0b2e",
    tertiaryColor: "#0d0618",
    background: "#0d0618",
    mainBkg: "#2a1244",
    nodeBorder: "#a855f7",
    clusterBkg: "#1a0b2e",
    clusterBorder: "#a855f7",
    edgeLabelBackground: "#0d0618",
  },
  flowchart: { htmlLabels: true, curve: "basis", padding: 16, nodeSpacing: 50, rankSpacing: 60, useMaxWidth: true },
  securityLevel: "loose",
});

interface Props {
  code: string;
  id: string;
}

export function MermaidDiagram({ code, id }: Props) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    if (!code?.trim()) {
      setSvg("");
      setError(null);
      return;
    }
    const cleaned = code.replace(/^```(?:mermaid)?\s*/i, "").replace(/```\s*$/i, "").trim();
    mermaid
      .render(`m-${id}-${Math.random().toString(36).slice(2, 9)}`, cleaned)
      .then(({ svg }) => {
        if (!cancelled) {
          setSvg(svg);
          setError(null);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Diagram parse error");
          setSvg("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code, id]);

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">Diagram error: {error}</span>
      </div>
    );
  }

  if (!svg) {
    return (
      <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
        No diagram yet
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="mermaid-host flex w-full justify-center overflow-auto p-4 [&_svg]:!max-w-full [&_svg]:!h-auto [&_svg]:!min-h-[280px]"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
