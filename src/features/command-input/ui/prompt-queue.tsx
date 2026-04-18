import { memo } from "react";

interface PromptQueueProps {
  items: string[];
}

export const PromptQueue = memo(function PromptQueue({
  items,
}: PromptQueueProps) {
  if (items.length === 0) return null;

  const count = items.length;

  return (
    <div className="text-ctp-overlay1 font-mono text-sm mb-1">
      <div className="mb-0.5">
        • {count} {count === 1 ? "message" : "messages"} queued · esc to cancel
        last
      </div>
      <ul aria-label="Queued prompts">
        {items.map((item, i) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: items are ephemeral queue snapshots, not persistent entities
            key={i}
            className="truncate list-none pl-2"
          >
            <span className="inline-block w-4">↳</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
});
