import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../../theme";
import { body, display } from "../fonts";
import { Glow, Roots, SceneShell, Spores, breathe, enter, rise } from "../kit";

const MOVES = [
  { name: "Leap", note: "Coyote time, double wings", tint: C.ember },
  { name: "Dash", note: "Invulnerable through the gap", tint: C.teal },
  { name: "Strike", note: "Chain the nail, keep tempo", tint: C.violet },
];

const Glyph: React.FC<{ index: number; tint: string; frame: number }> = ({ index, tint, frame }) => {
  const t = frame * 0.06 + index * 1.7;
  if (index === 0) {
    const y = Math.abs(Math.sin(t)) * -46;
    return (
      <svg viewBox="0 0 120 120" width={120} height={120}>
        <circle cx="60" cy={70 + y} r="16" fill={tint} />
        <path d={`M32,${96 + y * 0.4} Q60,${64 + y} 88,${96 + y * 0.4}`} stroke={tint} strokeWidth="4" fill="none" opacity="0.55" />
      </svg>
    );
  }
  if (index === 1) {
    const x = ((frame * 6) % 120) - 20;
    return (
      <svg viewBox="0 0 120 120" width={120} height={120}>
        <rect x={x} y="52" width="34" height="16" rx="8" fill={tint} />
        <rect x={x - 34} y="56" width="30" height="8" rx="4" fill={tint} opacity="0.45" />
        <rect x={x - 66} y="58" width="24" height="5" rx="3" fill={tint} opacity="0.22" />
      </svg>
    );
  }
  const sweep = interpolate(Math.sin(t * 1.5), [-1, 1], [-40, 40]);
  return (
    <svg viewBox="0 0 120 120" width={120} height={120}>
      <path
        d="M20,90 Q60,20 100,52"
        stroke={tint}
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
        transform={`rotate(${sweep} 60 60)`}
      />
      <circle cx="100" cy="52" r="6" fill={C.parchment} opacity="0.8" transform={`rotate(${sweep} 60 60)`} />
    </svg>
  );
};

export const Moves: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <SceneShell tone="#0b1322">
      <AbsoluteFill>
        <Roots flip opacity={0.55} parallax={breathe(frame, 20, 0.009)} />
        <Spores count={22} seed={19} />
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 150,
            fontFamily: body,
            fontSize: 26,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: C.tealDim,
            ...enter(frame, 4, 22, 18),
          }}
        >
          Move like the dark
        </div>
        <div
          style={{
            position: "absolute",
            left: 150,
            top: 300,
            display: "flex",
            gap: 54,
          }}
        >
          {MOVES.map((m, i) => {
            const s = spring({ frame: frame - 14 - i * 11, fps, config: { damping: 18, stiffness: 170 } });
            const p = rise(frame, 14 + i * 11, 28);
            return (
              <div
                key={m.name}
                style={{
                  width: 480,
                  padding: "44px 40px 52px",
                  borderRadius: 4,
                  border: `1px solid ${m.tint}44`,
                  background: "linear-gradient(160deg, rgba(20,32,52,0.92), rgba(8,12,22,0.7))",
                  opacity: p,
                  filter: `blur(${(1 - p) * 10}px)`,
                  transform: `translateY(${interpolate(s, [0, 1], [70, 0]) + breathe(frame, 5, 0.02, i)}px)`,
                }}
              >
                <Glyph index={i} tint={m.tint} frame={frame} />
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 84, color: C.parchment, marginTop: 12 }}>
                  {m.name}
                </div>
                <div style={{ fontFamily: body, fontSize: 25, color: C.muted, marginTop: 8 }}>{m.note}</div>
              </div>
            );
          })}
        </div>
        <Glow x={430} y={620} r={340} opacity={0.16} />
      </AbsoluteFill>
    </SceneShell>
  );
};
