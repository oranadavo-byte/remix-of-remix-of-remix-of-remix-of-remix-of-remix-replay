import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../../theme";
import { body, display } from "../fonts";
import { Glow, SceneShell, Spores, breathe, enter, rise } from "../kit";

const NODES = [
  { x: 300, y: 300, label: "Lantern Leap", tint: C.ember },
  { x: 300, y: 620, label: "Updraft", tint: "#ffd89b" },
  { x: 760, y: 420, label: "Keen Edge", tint: C.teal },
  { x: 1180, y: 260, label: "Quickening", tint: C.violet },
  { x: 1180, y: 700, label: "Soulfire", tint: C.emberDeep },
];
const EDGES: [number, number][] = [
  [0, 1],
  [0, 2],
  [2, 3],
  [2, 4],
];

export const SkillTree: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <SceneShell tone="#0a1020">
      <AbsoluteFill>
        <Spores count={20} seed={31} tint={C.violet} />
        <Glow x={760} y={430} r={520} color={C.tealDim} opacity={0.2} />
        <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          {EDGES.map(([a, b], i) => {
            const A = NODES[a];
            const B = NODES[b];
            const len = Math.hypot(B.x - A.x, B.y - A.y);
            const p = rise(frame, 10 + i * 9, 30);
            return (
              <line
                key={i}
                x1={A.x}
                y1={A.y}
                x2={B.x}
                y2={B.y}
                stroke={C.tealDim}
                strokeWidth={3}
                strokeDasharray={len}
                strokeDashoffset={len * (1 - p)}
                opacity={0.75}
              />
            );
          })}
        </svg>
        {NODES.map((n, i) => {
          const p = rise(frame, 24 + i * 10, 26);
          const pulse = 1 + 0.06 * Math.sin(frame * 0.09 + i);
          return (
            <div
              key={n.label}
              style={{
                position: "absolute",
                left: n.x - 90,
                top: n.y - 90 + breathe(frame, 5, 0.02, i),
                width: 180,
                textAlign: "center",
                opacity: p,
                transform: `scale(${interpolate(p, [0, 1], [0.7, 1]) * pulse})`,
              }}
            >
              <div
                style={{
                  width: 96,
                  height: 96,
                  margin: "0 auto",
                  borderRadius: "50%",
                  border: `2px solid ${n.tint}`,
                  background: `radial-gradient(circle, ${n.tint}55 0%, rgba(6,10,18,0.9) 70%)`,
                }}
              />
              <div style={{ fontFamily: body, fontWeight: 600, fontSize: 24, color: C.parchment, marginTop: 14 }}>
                {n.label}
              </div>
            </div>
          );
        })}
        <div
          style={{
            position: "absolute",
            right: 130,
            bottom: 130,
            textAlign: "right",
            ...enter(frame, 52, 30, 26),
          }}
        >
          <div style={{ fontFamily: display, fontWeight: 700, fontSize: 92, color: C.parchment }}>
            Forge your embers
          </div>
          <div style={{ fontFamily: body, fontSize: 27, color: C.muted, marginTop: 6 }}>
            Every four kills feeds the tree
          </div>
        </div>
      </AbsoluteFill>
    </SceneShell>
  );
};
