"use client";

import { memo } from "react";

interface PromptQueueProps {
  items: string[];
}

export const PromptQueue = memo(function PromptQueue({
  items,
}: PromptQueueProps) {
  if (items.length === 0) return null;

  return (
    <ul
      className="text-ctp-overlay1 font-mono text-sm mb-1"
      aria-label="Queued prompts"
    >
      {items.map((item, i) => (
        <li
          // biome-ignore lint/suspicious/noArrayIndexKey: items are ephemeral queue snapshots, not persistent entities
          key={i}
          className="truncate list-none"
        >
          <span className="inline-block w-4">⏵</span>
          {item}
        </li>
      ))}
    </ul>
  );
});
