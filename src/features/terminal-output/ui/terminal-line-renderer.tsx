"use client";

import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { TerminalLine } from "@/entities/command";
import { TerminalPrompt } from "@/shared/ui";

interface TerminalLineRendererProps {
  line: TerminalLine;
  onCommand?: (command: string) => void;
}

export const TerminalLineRenderer = memo(function TerminalLineRenderer({
  line,
  onCommand,
}: TerminalLineRendererProps) {
  if (line.type === "banner") {
    return (
      <div className="text-ctp-mauve whitespace-pre font-mono text-xs leading-tight">
        {line.result?.content}
      </div>
    );
  }

  if (line.type === "input") {
    return (
      <div className="flex items-center">
        <TerminalPrompt
          path={line.prompt ?? "~"}
          variant={line.prompt === "ai" ? "ai" : "terminal"}
        />
        <span className="text-ctp-text">&nbsp;{line.command}</span>
      </div>
    );
  }

  // output
  const result = line.result;
  if (!result) return null;

  if (result.type === "banner") {
    return (
      <div className="text-ctp-mauve whitespace-pre font-mono text-xs leading-tight">
        {result.content}
      </div>
    );
  }

  if (result.type === "error") {
    return <div className="text-ctp-red">{result.content}</div>;
  }

  if (result.type === "markdown") {
    return (
      <div className="terminal-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith("#cmd:") && onCommand) {
                const cmd = decodeURIComponent(href.slice(5));
                return (
                  <button
                    type="button"
                    onClick={() => onCommand(cmd)}
                    className="text-ctp-sapphire underline hover:text-ctp-sky cursor-pointer"
                  >
                    {children}
                  </button>
                );
              }
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ctp-sapphire underline hover:text-ctp-sky cursor-pointer"
                >
                  {children}
                </a>
              );
            },
          }}
        >
          {result.content}
        </ReactMarkdown>
      </div>
    );
  }

  if (result.type === "posts") {
    return (
      <div className="text-ctp-text whitespace-pre font-mono text-sm">
        {result.content}
      </div>
    );
  }

  // text
  return (
    <div className="text-ctp-text whitespace-pre-wrap">{result.content}</div>
  );
});
