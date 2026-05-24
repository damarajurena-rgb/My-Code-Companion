import { useEffect, useRef, useState } from "react";
import mermaid from "mermaid";
import { AlertTriangle } from "lucide-react";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  fontFamily: "JetBrains Mono, monospace",
  themeVariables: {
    primaryColor: "#1b4332",
    primaryTextColor: "#e6fff4",
    primaryBorderColor: "#2dd4a8",
    lineColor: "#2dd4a8",
    secondaryColor: "#0f2a3a",
    tertiaryColor: "#0d1b2a",
    background: "#0d1b2a",
    mainBkg: "#1b4332",
    nodeBorder: "#2dd4a8",
    clusterBkg: "#0f2a3a",
    clusterBorder: "#2dd4a8",
    edgeLabelBackground: "#0d1b2a",
  },
  flowchart: { htmlLabels: true, curve: "basis" },
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
      className="mermaid-host flex w-full justify-center overflow-auto p-2 [&_svg]:!max-w-full [&_svg]:!h-auto"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
