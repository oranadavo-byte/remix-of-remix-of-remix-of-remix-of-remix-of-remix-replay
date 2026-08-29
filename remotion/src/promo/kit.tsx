import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { makeItems } from "../rand";

/** Shared motion system: everything enters with a blurred rise, exits as the inverse. */
export const rise = (frame: number, delay = 0, dur = 26) =>
  interpolate(frame, [delay, delay + dur], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

export const enter = (frame: number, delay = 0, dur = 26, travel = 46) => {
  const p = rise(frame, delay, dur);
  return {
    opacity: p,
    filter: `blur(${(1 - p) * 14}px)`,
    transform: `translateY(${(1 - p) * travel}px)`,
  } as React.CSSProperties;
};

/** Slow sinusoidal drift so nothing is ever frozen. */
export const breathe = (frame: number, amp = 6, speed = 0.018, phase = 0) =>
  Math.sin(frame * speed + phase) * amp;

export const SceneShell: React.FC<{
  children: React.ReactNode;
  tone?: string;
}> = ({ children, tone = C.bgMid }) => {
  const frame = useCurrentFrame();
  const drift = breathe(frame, 26, 0.008);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 90% at ${50 + drift * 0.4}% 40%, ${tone} 0%, ${C.bgDeep} 68%, #04060d 100%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};

/** Lantern glow blob — the film's recurring motif. */
export const Glow: React.FC<{
  x: number;
  y: number;
  r: number;
  color?: string;
  opacity?: number;
}> = ({ x, y, r, color = C.ember, opacity = 0.5 }) => (
  <div
    style={{
      position: "absolute",
      left: x - r,
      top: y - r,
      width: r * 2,
      height: r * 2,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, rgba(0,0,0,0) 70%)`,
      opacity,
      mixBlendMode: "screen",
    }}
  />
);

/** Drifting spore particles — motif #2, present in every scene. */
export const Spores: React.FC<{ count?: number; seed?: number; tint?: string }> = ({
  count = 34,
  seed = 7,
  tint = C.teal,
}) => {
  const frame = useCurrentFrame();
  const items = makeItems(count, seed, (r) => ({
    x: r() * 1920,
    y: r() * 1080,
    s: 1.5 + r() * 4,
    sp: 0.18 + r() * 0.5,
    ph: r() * Math.PI * 2,
    o: 0.16 + r() * 0.4,
  }));
  return (
    <>
      {items.map((p, i) => {
        const y = (p.y - frame * p.sp + 1200) % 1200 - 60;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x + Math.sin(frame * 0.02 + p.ph) * 22,
              top: y,
              width: p.s,
              height: p.s,
              borderRadius: "50%",
              background: i % 4 === 0 ? C.ember : tint,
              opacity: p.o * (0.6 + 0.4 * Math.sin(frame * 0.05 + p.ph)),
              filter: "blur(0.4px)",
            }}
          />
        );
      })}
    </>
  );
};

/** Motif #3: jagged root/cavern silhouettes framing the frame edges. */
export const Roots: React.FC<{ flip?: boolean; opacity?: number; parallax?: number }> = ({
  flip = false,
  opacity = 1,
  parallax = 0,
}) => (
  <svg
    viewBox="0 0 1920 1080"
    style={{
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      opacity,
      transform: `${flip ? "scaleX(-1) " : ""}translateX(${parallax}px)`,
    }}
  >
    <path
      d="M0,1080 L0,700 C160,760 220,880 300,900 C420,930 470,840 560,880 C640,915 660,1010 760,1035 L820,1080 Z"
      fill="#060910"
    />
    <path
      d="M0,0 L0,220 C180,250 240,120 340,150 C430,178 470,290 600,250 C700,220 720,110 830,60 L860,0 Z"
      fill="#070b14"
    />
  </svg>
);

export const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(70% 60% at 50% 50%, rgba(0,0,0,0) 40%, rgba(0,0,0,0.72) 100%)",
      pointerEvents: "none",
    }}
  />
);

export const Grain: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = makeItems(90, 21, (r) => ({ x: r() * 1920, y: r() * 1080, o: r() * 0.05 }));
  return (
    <>
      {dots.map((d, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: (d.x + frame * 3) % 1920,
            top: (d.y + frame * 1.7) % 1080,
            width: 2,
            height: 2,
            background: C.parchment,
            opacity: d.o,
          }}
        />
      ))}
    </>
  );
};
