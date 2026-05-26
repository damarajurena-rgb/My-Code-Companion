import { useEffect, useRef, useState, useCallback } from "react";
import mermaid from "mermaid";
import svgPanZoom from "svg-pan-zoom";
import { AlertTriangle, ZoomIn, ZoomOut, Maximize2, Download } from "lucide-react";

function initMermaid() {
  const isDark = document.documentElement.classList.contains("dark");
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? "dark" : "default",
    fontFamily: "JetBrains Mono, monospace",
    themeVariables: isDark
      ? {
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
        }
      : {
          primaryColor: "#f3e8ff",
          primaryTextColor: "#3b0764",
          primaryBorderColor: "#7c3aed",
          lineColor: "#7c3aed",
          secondaryColor: "#ede9fe",
          tertiaryColor: "#faf5ff",
          background: "#ffffff",
          mainBkg: "#f3e8ff",
          nodeBorder: "#7c3aed",
          clusterBkg: "#faf5ff",
          clusterBorder: "#a855f7",
          edgeLabelBackground: "#ffffff",
        },
    flowchart: {
      htmlLabels: true,
      curve: "basis",
      padding: 16,
      nodeSpacing: 50,
      rankSpacing: 60,
      useMaxWidth: false,
    },
    securityLevel: "loose",
  });
}

initMermaid();

interface Props {
  code: string;
  id: string;
  onNodeLineClick?: (line: number) => void;
  onNodeLineHover?: (line: number | null) => void;
  highlightLine?: number | null;
}

export function MermaidDiagram({ code, id, onNodeLineClick, onNodeLineHover, highlightLine }: Props) {
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [themeBump, setThemeBump] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const panZoomRef = useRef<ReturnType<typeof svgPanZoom> | null>(null);

  useEffect(() => {
    const onChange = () => {
      initMermaid();
      setThemeBump((v) => v + 1);
    };
    window.addEventListener("ct-theme-change", onChange);
    return () => window.removeEventListener("ct-theme-change", onChange);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!code?.trim()) {
      setSvg("");
      setError(null);
      return;
    }
    const cleaned = code
      .replace(/^```(?:mermaid)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    mermaid
      .render(`m-${id}-${themeBump}-${Math.random().toString(36).slice(2, 9)}`, cleaned)
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
  }, [code, id, themeBump]);

  // Wire up svg-pan-zoom whenever a new svg is rendered.
  useEffect(() => {
    if (!svg || !containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    svgEl.setAttribute("width", "100%");
    svgEl.setAttribute("height", "100%");
    svgEl.style.maxWidth = "100%";
    svgEl.style.maxHeight = "100%";

    try {
      panZoomRef.current?.destroy();
    } catch {
      /* ignore */
    }
    panZoomRef.current = svgPanZoom(svgEl as SVGElement, {
      controlIconsEnabled: false,
      fit: true,
      center: true,
      minZoom: 0.4,
      maxZoom: 6,
      zoomScaleSensitivity: 0.3,
      contain: false,
    });

    const ro = new ResizeObserver(() => {
      panZoomRef.current?.resize();
      panZoomRef.current?.fit();
      panZoomRef.current?.center();
    });
    ro.observe(containerRef.current);

    // Cross-link memory nodes to source lines: any node whose label contains
    // (L<number>) gets click + hover handlers that drive the editor highlight.
    const nodes = svgEl.querySelectorAll<SVGGElement>("g.node");
    const cleanupFns: Array<() => void> = [];
    nodes.forEach((node) => {
      const text = node.textContent ?? "";
      const m = text.match(/L(\d+)/);
      if (!m) return;
      const line = Number(m[1]);
      (node as unknown as HTMLElement).style.cursor = "pointer";
      node.setAttribute("data-line", String(line));
      const onClick = () => onNodeLineClick?.(line);
      const onEnter = () => onNodeLineHover?.(line);
      const onLeave = () => onNodeLineHover?.(null);
      node.addEventListener("click", onClick);
      node.addEventListener("mouseenter", onEnter);
      node.addEventListener("mouseleave", onLeave);
      cleanupFns.push(() => {
        node.removeEventListener("click", onClick);
        node.removeEventListener("mouseenter", onEnter);
        node.removeEventListener("mouseleave", onLeave);
      });
    });

    return () => {
      ro.disconnect();
      try {
        panZoomRef.current?.destroy();
      } catch {
        /* ignore */
      }
      panZoomRef.current = null;
    };
  }, [svg]);

  const zoomIn = () => panZoomRef.current?.zoomIn();
  const zoomOut = () => panZoomRef.current?.zoomOut();
  const reset = () => {
    panZoomRef.current?.resetZoom();
    panZoomRef.current?.center();
    panZoomRef.current?.fit();
  };

  const download = useCallback(async () => {
    if (!containerRef.current) return;
    const svgEl = containerRef.current.querySelector("svg");
    if (!svgEl) return;
    // Clone and inline current size to avoid losing dimensions
    const clone = svgEl.cloneNode(true) as SVGElement;
    const bbox = (svgEl as SVGGraphicsElement).getBoundingClientRect();
    const w = Math.max(800, Math.round(bbox.width * 2));
    const h = Math.max(600, Math.round(bbox.height * 2));
    clone.setAttribute("width", String(w));
    clone.setAttribute("height", String(h));
    const xml = new XMLSerializer().serializeToString(clone);
    const svgBlob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${xml}`], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("image load failed"));
        img.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const isDark = document.documentElement.classList.contains("dark");
      ctx.fillStyle = isDark ? "#0d0618" : "#ffffff";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `diagram-${id}.png`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, "image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  }, [id]);

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
      <div className="flex h-64 items-center justify-center text-xs text-muted-foreground">
        No diagram yet
      </div>
    );
  }

  return (
    <div className="relative h-full min-h-[320px] w-full">
      <div
        ref={containerRef}
        className="mermaid-host h-full w-full overflow-hidden rounded-md"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div
        className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-border bg-card/80 p-1 backdrop-blur"
        role="toolbar"
        aria-label="Diagram controls"
      >
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ZoomIn className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ZoomOut className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={reset}
          aria-label="Fit to view"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={download}
          aria-label="Download diagram as PNG"
          className="rounded p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Download className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
