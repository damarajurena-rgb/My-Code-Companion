import Editor, { type OnMount } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: string;
  onLineClick?: (line: number) => void;
  highlightedLine?: number | null;
}

function currentTheme() {
  if (typeof document === "undefined") return "vs-dark";
  return document.documentElement.classList.contains("dark") ? "vs-dark" : "vs";
}

export function CodeEditor({ value, onChange, language, onLineClick, highlightedLine }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decoRef = useRef<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<string>(currentTheme());

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onChange = () => setTheme(currentTheme());
    window.addEventListener("ct-theme-change", onChange);
    return () => window.removeEventListener("ct-theme-change", onChange);
  }, []);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onMouseDown((e) => {
      const line = e.target.position?.lineNumber;
      if (line && onLineClick) onLineClick(line);
    });

    if (highlightedLine) {
      decoRef.current = editor.deltaDecorations(decoRef.current, [
        {
          range: new monaco.Range(highlightedLine, 1, highlightedLine, 1),
          options: {
            isWholeLine: true,
            className: "editor-line-highlight",
            linesDecorationsClassName: "editor-line-marker",
          },
        },
      ]);
    }
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border border-border bg-card">
      <style>{`
        .editor-line-highlight { background: color-mix(in oklab, var(--mint) 18%, transparent); }
        .editor-line-marker { background: var(--mint); width: 3px !important; margin-left: 3px; }
      `}</style>
      {mounted ? (
        <Editor
          height="100%"
          language={language}
          value={value}
          theme={theme}
          onChange={(v) => onChange(v ?? "")}
          onMount={handleMount}
          options={{
            fontFamily: "Consolas, 'Courier New', monospace",
            fontSize: 13,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            padding: { top: 14, bottom: 14 },
            renderLineHighlight: "gutter",
            tabSize: 2,
            insertSpaces: true,
            detectIndentation: true,
            wordWrap: "off",
            scrollbar: {
              horizontal: "auto",
              vertical: "auto",
              horizontalScrollbarSize: 10,
              verticalScrollbarSize: 10,
              alwaysConsumeMouseWheel: false,
            },
            ariaLabel: "Code editor",
          }}
        />
      ) : (
        <div className="flex h-full items-center justify-center font-mono text-xs text-muted-foreground">
          Loading editor...
        </div>
      )}
    </div>
  );
}
