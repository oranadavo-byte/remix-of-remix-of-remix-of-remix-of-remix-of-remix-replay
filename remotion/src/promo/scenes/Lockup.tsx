import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../theme";
import { body, display } from "../fonts";
import { Glow, SceneShell, Spores, breathe, enter, rise } from "../kit";

export const Lockup: React.FC = () => {
  const frame = useCurrentFrame();
  const line = rise(frame, 34, 40);
  const flicker = 0.8 + 0.2 * Math.sin(frame * 0.3) * Math.sin(frame * 0.09);
  const out = interpolate(frame, [110, 140], [1, 0.25], { extrapolateLeft: "clamp" });
  return (
    <SceneShell tone="#0b1424">
      <AbsoluteFill style={{ opacity: out }}>
        <Glow x={960} y={520 + breathe(frame, 12, 0.02)} r={520} opacity={0.3 * flicker} />
        <Glow x={960} y={520} r={110} color={C.parchment} opacity={0.55 * flicker} />
        <Spores count={26} seed={57} />
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 200,
              letterSpacing: 10,
              color: C.parchment,
              ...enter(frame, 4, 34, 40),
            }}
          >
            NOCTILUME
          </div>
          <div
            style={{
              height: 2,
              width: 700 * line,
              background: `linear-gradient(90deg, rgba(0,0,0,0), ${C.ember}, rgba(0,0,0,0))`,
              marginTop: 10,
            }}
          />
          <div
            style={{
              marginTop: 30,
              fontFamily: body,
              fontSize: 32,
              letterSpacing: 9,
              textTransform: "uppercase",
              color: C.muted,
              ...enter(frame, 46, 30, 22),
            }}
          >
            Carry the light down
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </SceneShell>
  );
};
