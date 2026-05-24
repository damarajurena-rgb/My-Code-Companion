import Editor, { type OnMount } from "@monaco-editor/react";
import { useRef } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (v: string) => void;
  language: string;
  onLineClick?: (line: number) => void;
  highlightedLine?: number | null;
}

export function CodeEditor({ value, onChange, language, onLineClick, highlightedLine }: CodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decoRef = useRef<string[]>([]);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    editor.onMouseDown((e) => {
      const line = e.target.position?.lineNumber;
      if (line && onLineClick) onLineClick(line);
    });

    // Apply highlight if any
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
      <Editor
        height="100%"
        language={language}
        value={value}
        theme="vs-dark"
        onChange={(v) => onChange(v ?? "")}
        onMount={handleMount}
        options={{
          fontFamily: "JetBrains Mono, monospace",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 14, bottom: 14 },
          renderLineHighlight: "gutter",
          tabSize: 2,
        }}
      />
    </div>
  );
}
