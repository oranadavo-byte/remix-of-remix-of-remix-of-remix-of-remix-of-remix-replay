import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../theme";
import { body, display } from "../fonts";
import { Glow, Roots, SceneShell, Spores, breathe, enter, rise } from "../kit";

export const Guardian: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const slam = spring({ frame: frame - 40, fps, config: { damping: 9, stiffness: 130, mass: 1.6 } });
  const shake = frame > 40 && frame < 60 ? Math.sin(frame * 2.4) * (60 - frame) * 0.5 : 0;
  const rings = [0, 1, 2].map((i) => rise(frame, 44 + i * 6, 44));
  const zoom = interpolate(frame, [0, 140], [1, 1.08], { extrapolateRight: "clamp" });

  return (
    <SceneShell tone="#120c14">
      <AbsoluteFill style={{ transform: `scale(${zoom}) translate(${shake}px, ${shake * 0.4}px)` }}>
        <Roots opacity={1} parallax={breathe(frame, 8, 0.01)} />
        <Roots flip opacity={0.95} parallax={breathe(frame, -12, 0.012, 2)} />
        <Glow x={960} y={520} r={560} color={C.emberDeep} opacity={0.28} />
        {/* Guardian silhouette */}
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <g transform={`translate(0, ${interpolate(slam, [0, 1], [-200, 0])})`} opacity={rise(frame, 6, 30)}>
            <path
              d="M700,1080 C700,780 780,600 960,540 C1140,600 1220,780 1220,1080 Z"
              fill="#0a0d14"
            />
            <path d="M840,700 C880,640 1040,640 1080,700 C1040,760 880,760 840,700 Z" fill={C.ember} opacity={0.9} />
            <circle cx="915" cy="700" r="14" fill="#04060d" />
            <circle cx="1005" cy="700" r="14" fill="#04060d" />
            <path d="M960,540 C930,470 880,430 820,410 M960,540 C990,470 1040,430 1100,410" stroke="#0a0d14" strokeWidth="26" fill="none" />
          </g>
        </svg>
        {rings.map((p, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 960 - 400 * p,
              top: 900 - 120 * p,
              width: 800 * p,
              height: 240 * p,
              borderRadius: "50%",
              border: `2px solid ${C.ember}`,
              opacity: (1 - p) * 0.55,
            }}
          />
        ))}
        <Spores count={18} seed={41} tint={C.ember} />
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 170,
            ...enter(frame, 66, 34, 30),
          }}
        >
          <div style={{ fontFamily: body, fontSize: 24, letterSpacing: 10, textTransform: "uppercase", color: C.tealDim }}>
            Final chamber
          </div>
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 120, color: C.parchment, lineHeight: 1 }}>
            The Rootbound
            <br />
            Guardian
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
