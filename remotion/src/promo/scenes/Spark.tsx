import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../theme";
import { display } from "../fonts";
import { Glow, Roots, SceneShell, Spores, breathe, enter } from "../kit";

export const Spark: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ignite = spring({ frame: frame - 12, fps, config: { damping: 14, stiffness: 90, mass: 1.4 } });
  const glowR = interpolate(ignite, [0, 1], [10, 520]);
  const flicker = 0.72 + 0.28 * Math.sin(frame * 0.34) * Math.sin(frame * 0.11);
  const push = interpolate(frame, [0, 90], [1.12, 1], { extrapolateRight: "clamp" });

  return (
    <SceneShell tone="#0a1120">
      <AbsoluteFill style={{ transform: `scale(${push})` }}>
        <Roots opacity={0.9} parallax={breathe(frame, 14, 0.01)} />
        <Roots flip opacity={0.8} parallax={breathe(frame, -18, 0.008, 1)} />
        <Glow x={1290} y={470 + breathe(frame, 10, 0.02)} r={glowR} opacity={0.55 * flicker} />
        <Glow x={1290} y={470 + breathe(frame, 10, 0.02)} r={glowR * 0.28} color={C.parchment} opacity={0.8 * flicker} />
        <Spores count={26} seed={3} />
        <div
          style={{
            position: "absolute",
            left: 170,
            bottom: 300,
            width: 760,
            ...enter(frame, 34, 34, 30),
          }}
        >
          <div
            style={{
              fontFamily: display,
              fontSize: 74,
              lineHeight: 1.06,
              fontWeight: 600,
              color: C.parchment,
              letterSpacing: -1,
            }}
          >
            Nine chambers deep,
            <br />
            the light went out.
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
