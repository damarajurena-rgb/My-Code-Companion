import type { ReactNode } from "react";

interface MarkdownTextProps {
  children: string;
}

function inlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={index} className="rounded bg-secondary px-1 py-0.5 font-mono text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export function MarkdownText({ children }: MarkdownTextProps) {
  const blocks = children.split(/```/g);

  return (
    <div className="space-y-2">
      {blocks.map((block, blockIndex) => {
        const isCode = blockIndex % 2 === 1;
        if (isCode) {
          const code = block.replace(/^\w+\n/, "").trim();
          return (
            <pre key={blockIndex} className="overflow-x-auto rounded-md bg-background/70 p-2 font-mono text-xs">
              <code>{code}</code>
            </pre>
          );
        }

        return block
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .map((line, lineIndex) => {
            const key = `${blockIndex}-${lineIndex}`;
            const heading = line.match(/^(#{1,3})\s+(.+)$/);
            if (heading) {
              return (
                <p key={key} className="font-semibold text-foreground">
                  {inlineMarkdown(heading[2])}
                </p>
              );
            }

            const listItem = line.match(/^[-*]\s+(.+)$/) ?? line.match(/^\d+\.\s+(.+)$/);
            if (listItem) {
              return (
                <p key={key} className="pl-3 text-sm leading-relaxed before:mr-2 before:content-['•']">
                  {inlineMarkdown(listItem[1])}
                </p>
              );
            }

            return (
              <p key={key} className="text-sm leading-relaxed">
                {inlineMarkdown(line)}
              </p>
            );
          });
      })}
    </div>
  );
}