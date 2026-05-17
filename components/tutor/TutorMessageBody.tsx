import type { ReactNode } from "react";

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="font-semibold text-foreground">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

function isBulletLine(line: string): boolean {
  return /^[-*•]\s+/.test(line.trim());
}

function isNumberedLine(line: string): boolean {
  return /^\d+[.)]\s+/.test(line.trim());
}

function stripBullet(line: string): string {
  return line.trim().replace(/^[-*•]\s+/, "");
}

function stripNumber(line: string): string {
  return line.trim().replace(/^\d+[.)]\s+/, "");
}

function isTipLine(line: string): boolean {
  return /^tip:/i.test(line.trim());
}

interface TutorMessageBodyProps {
  content: string;
}

export function TutorMessageBody({ content }: TutorMessageBodyProps) {
  const blocks = content.split(/\n\n+/).filter((b) => b.trim());

  if (blocks.length === 0) {
    return <p className="whitespace-pre-wrap text-sm">{content}</p>;
  }

  return (
    <div className="space-y-3 text-sm leading-relaxed">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").filter((l) => l.trim());

        if (lines.length > 1 && lines.every(isBulletLine)) {
          return (
            <ul
              key={blockIndex}
              className="list-disc space-y-1.5 pl-4 marker:text-indigo-400"
            >
              {lines.map((line, i) => (
                <li key={i}>{renderInline(stripBullet(line))}</li>
              ))}
            </ul>
          );
        }

        if (lines.length > 1 && lines.every(isNumberedLine)) {
          return (
            <ol
              key={blockIndex}
              className="list-decimal space-y-1.5 pl-4 marker:text-indigo-400"
            >
              {lines.map((line, i) => (
                <li key={i}>{renderInline(stripNumber(line))}</li>
              ))}
            </ol>
          );
        }

        if (lines.length === 1 && isTipLine(lines[0])) {
          return (
            <p
              key={blockIndex}
              className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-indigo-200"
            >
              {renderInline(lines[0])}
            </p>
          );
        }

        return (
          <div key={blockIndex} className="space-y-2">
            {lines.map((line, i) => {
              const trimmed = line.trim();
              if (isBulletLine(trimmed)) {
                return (
                  <ul
                    key={i}
                    className="list-disc pl-4 marker:text-indigo-400"
                  >
                    <li>{renderInline(stripBullet(trimmed))}</li>
                  </ul>
                );
              }
              if (isNumberedLine(trimmed)) {
                return (
                  <ol
                    key={i}
                    className="list-decimal pl-4 marker:text-indigo-400"
                  >
                    <li>{renderInline(stripNumber(trimmed))}</li>
                  </ol>
                );
              }
              if (isTipLine(trimmed)) {
                return (
                  <p
                    key={i}
                    className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1.5 text-indigo-200"
                  >
                    {renderInline(trimmed)}
                  </p>
                );
              }
              return <p key={i}>{renderInline(trimmed)}</p>;
            })}
          </div>
        );
      })}
    </div>
  );
}
