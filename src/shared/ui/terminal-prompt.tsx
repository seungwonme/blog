interface TerminalPromptProps {
  path: string;
  variant?: "terminal" | "ai";
}

export function TerminalPrompt({
  path,
  variant = "terminal",
}: TerminalPromptProps) {
  if (variant === "ai") {
    return (
      <span className="whitespace-nowrap">
        <span className="text-ctp-mauve font-bold">ai</span>
        <span className="text-ctp-text">@</span>
        <span className="text-ctp-mauve font-bold">seunan.dev</span>
        <span className="text-ctp-text">{" >"}</span>
      </span>
    );
  }

  return (
    <span className="whitespace-nowrap">
      <span className="text-ctp-green font-bold">visitor</span>
      <span className="text-ctp-text">@</span>
      <span className="text-ctp-green font-bold">seunan.dev</span>
      <span className="text-ctp-text">:</span>
      <span className="text-ctp-blue font-bold">{path}</span>
      <span className="text-ctp-text">{" $"}</span>
    </span>
  );
}
