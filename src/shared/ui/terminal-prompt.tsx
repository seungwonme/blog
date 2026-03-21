export function TerminalPrompt({ path }: { path: string }) {
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
