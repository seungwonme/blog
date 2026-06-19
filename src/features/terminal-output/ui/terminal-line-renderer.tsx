"use client";

import { Globe, Mail } from "lucide-react";
import { type ComponentType, memo, type SVGProps } from "react";
import {
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaThreads,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import type { TerminalLine } from "@/entities/command";
import { TerminalPrompt } from "@/shared/ui";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
type LinkMeta = { Icon: IconComponent; label: string };

// 호스트명 → 브랜드 아이콘 매핑. about Contact & Links 및 외부 링크에 적용된다.
const SOCIAL_HOSTS: Record<string, LinkMeta> = {
  "github.com": { Icon: FaGithub, label: "GitHub" },
  "linkedin.com": { Icon: FaLinkedinIn, label: "LinkedIn" },
  "youtube.com": { Icon: FaYoutube, label: "YouTube" },
  "x.com": { Icon: FaXTwitter, label: "X" },
  "twitter.com": { Icon: FaXTwitter, label: "X" },
  "instagram.com": { Icon: FaInstagram, label: "Instagram" },
  "threads.com": { Icon: FaThreads, label: "Threads" },
  "threads.net": { Icon: FaThreads, label: "Threads" },
  "aidenahn.com": { Icon: Globe, label: "Blog" },
};

function getLinkMeta(href: string): LinkMeta | null {
  if (href.startsWith("mailto:")) return { Icon: Mail, label: "Email" };
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return SOCIAL_HOSTS[host] ?? null;
  } catch {
    return null;
  }
}

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

  if (line.isPending) {
    return (
      <div className="flex items-center">
        <span
          className="motion-safe:animate-[loading-shimmer_1.6s_ease-in-out_infinite] motion-safe:bg-[linear-gradient(90deg,var(--color-ctp-overlay0)_0%,var(--color-ctp-text)_50%,var(--color-ctp-overlay0)_100%)] motion-safe:bg-[length:200%_100%] motion-safe:bg-clip-text motion-safe:text-transparent text-ctp-subtext0 [will-change:background-position]"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {result.content}
        </span>
      </div>
    );
  }

  const linkComponents: Components = {
    a: ({ href, children }) => {
      // #cmd: 링크 → 클릭 시 해당 터미널 명령 실행 (ls 항목/about 등)
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
      const meta = href ? getLinkMeta(href) : null;
      const Icon = meta?.Icon;
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-ctp-sapphire underline hover:text-ctp-sky cursor-pointer"
        >
          {Icon && (
            <>
              <Icon
                className="mr-1.5 inline-block size-[1em] align-[-0.125em]"
                aria-hidden="true"
              />
              <span className="sr-only">{meta?.label}: </span>
            </>
          )}
          {children}
        </a>
      );
    },
  };

  if (result.type === "markdown") {
    return (
      <div className="terminal-markdown">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkBreaks]}
          components={linkComponents}
        >
          {result.content}
        </ReactMarkdown>
      </div>
    );
  }

  // ls 출력: 등폭·정렬 유지(whitespace-pre-wrap이 개행/공백 처리) + #cmd 링크 클릭 가능.
  // remark-breaks는 제외 — pre-wrap이 줄바꿈을 처리하므로 중복 방지.
  if (result.type === "listing") {
    return (
      <div className="terminal-markdown whitespace-pre-wrap font-mono text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={linkComponents}>
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
