"use client";

import { useEffect, useState } from "react";

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  children: (displayText: string, isDone: boolean) => React.ReactNode;
}

export function TypingEffect({
  text,
  speed = 5,
  onComplete,
  children,
}: TypingEffectProps) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const isDone = displayedLength >= text.length;

  useEffect(() => {
    if (isDone) {
      onComplete?.();
      return;
    }

    // Type faster for longer content
    const adjustedSpeed = text.length > 500 ? Math.max(1, speed / 2) : speed;

    const timer = setTimeout(() => {
      // Type multiple characters at once for speed
      const charsPerTick = text.length > 1000 ? 5 : text.length > 500 ? 3 : 1;
      setDisplayedLength((prev) => Math.min(prev + charsPerTick, text.length));
    }, adjustedSpeed);

    return () => clearTimeout(timer);
  }, [displayedLength, text.length, speed, isDone, onComplete, text]);

  return <>{children(text.slice(0, displayedLength), isDone)}</>;
}
