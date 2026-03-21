"use client";

import dynamic from "next/dynamic";
import { memo } from "react";

const FaultyTerminal = dynamic(() => import("@/shared/ui/faulty-terminal"), {
  ssr: false,
});

export const TerminalBackground = memo(function TerminalBackground() {
  return (
    <div className="absolute inset-0 z-0">
      <FaultyTerminal
        scale={1.5}
        gridMul={[2, 1]}
        digitSize={1.2}
        timeScale={0.5}
        scanlineIntensity={0.5}
        glitchAmount={1}
        flickerAmount={1}
        noiseAmp={1}
        chromaticAberration={0}
        dither={0}
        curvature={0.1}
        tint="#A7EF9E"
        mouseReact
        mouseStrength={0.5}
        pageLoadAnimation
        brightness={0.6}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
});
