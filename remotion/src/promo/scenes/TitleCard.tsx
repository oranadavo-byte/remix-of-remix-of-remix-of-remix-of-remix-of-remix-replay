import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../theme";
import { body, display } from "../fonts";
import { Glow, Roots, SceneShell, Spores, breathe, enter, rise } from "../kit";

const WORD = "NOCTILUME";

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const line = rise(frame, 44, 40);
  return (
    <SceneShell tone="#0c1526">
      <AbsoluteFill>
        <Roots opacity={0.7} parallax={breathe(frame, -10, 0.01)} />
        <Glow x={960} y={470} r={620} opacity={0.24} />
        <Spores count={30} seed={11} />
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 150,
          }}
        >
          <div style={{ display: "flex", perspective: 900 }}>
            {WORD.split("").map((ch, i) => {
              const p = rise(frame, 4 + i * 3.5, 30);
              return (
                <span
                  key={i}
                  style={{
                    fontFamily: display,
                    fontWeight: 700,
                    fontSize: 178,
                    letterSpacing: 6,
                    color: i % 2 ? C.parchment : C.ember,
                    opacity: p,
                    filter: `blur(${(1 - p) * 18}px)`,
                    transform: `translateY(${(1 - p) * 70}px) rotateX(${(1 - p) * 55}deg) scale(${interpolate(p, [0, 1], [0.86, 1])})`,
                    transformOrigin: "bottom",
                    display: "inline-block",
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
          <div
            style={{
              height: 2,
              width: 880 * line,
              marginTop: 18,
              background: `linear-gradient(90deg, ${C.ember}, rgba(0,0,0,0))`,
            }}
          />
          <div
            style={{
              marginTop: 26,
              fontFamily: body,
              fontWeight: 400,
              fontSize: 34,
              letterSpacing: 8,
              textTransform: "uppercase",
              color: C.muted,
              ...enter(frame, 58, 30, 24),
            }}
          >
            A lantern in the rootbound dark
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
