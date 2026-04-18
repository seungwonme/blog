"use client";

import dynamic from "next/dynamic";
import { memo, useEffect, useState } from "react";

const FaultyTerminal = dynamic(() => import("@/shared/ui/faulty-terminal"), {
  ssr: false,
});

const MOBILE_BREAKPOINT = "(max-width: 767px)";
const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

// WebGL 미지원 환경 (일부 headless 크롤러, 오래된 브라우저, GPU 블록 상태)에서
// FaultyTerminal이 throw하면 Next.js 에러 바운더리가 페이지 전체를 교체한다.
// 사전 감지 후 배경만 정적 그라디언트로 대체한다.
function supportsWebGL(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function shouldDisableBackground(): boolean {
  if (typeof window === "undefined") return true;
  return (
    window.matchMedia(MOBILE_BREAKPOINT).matches ||
    window.matchMedia(REDUCED_MOTION).matches ||
    !supportsWebGL()
  );
}

export const TerminalBackground = memo(function TerminalBackground() {
  const [disabled, setDisabled] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_BREAKPOINT);
    const motionQuery = window.matchMedia(REDUCED_MOTION);

    const update = () => setDisabled(shouldDisableBackground());
    update();

    mobileQuery.addEventListener("change", update);
    motionQuery.addEventListener("change", update);

    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      mobileQuery.removeEventListener("change", update);
      motionQuery.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  if (disabled) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-ctp-base via-ctp-mantle to-ctp-crust">
        <div className="absolute inset-0 bg-black/40" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-0">
      <FaultyTerminal
        scale={1.5}
        gridMul={[2, 1]}
        digitSize={1.2}
        timeScale={paused ? 0 : 0.5}
        scanlineIntensity={0.5}
        glitchAmount={1}
        flickerAmount={1}
        noiseAmp={1}
        chromaticAberration={0}
        dither={0}
        curvature={0.1}
        tint="#A7EF9E"
        mouseReact={false}
        mouseStrength={0.5}
        pageLoadAnimation
        brightness={0.6}
      />
      <div className="absolute inset-0 bg-black/60" />
    </div>
  );
});
