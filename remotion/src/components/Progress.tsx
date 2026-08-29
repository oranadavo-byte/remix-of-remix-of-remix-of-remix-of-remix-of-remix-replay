import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { bodyFont, displayFont } from "./Title";

export const STEPS = [
  "Waking the hollow",
  "Weaving root and stone",
  "Stirring the rootlings",
  "Lighting the shrines",
  "Binding the Guardian",
  "Ready",
];

export const Progress: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const idx = Math.min(STEPS.length - 1, Math.floor(progress * (STEPS.length - 1) + 0.0001));
  const w = 760;
  const fill = w * progress;
  const done = progress >= 0.999;

  return (
    <div style={{ width: w, fontFamily: bodyFont }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 12,
          color: done ? C.teal : "#cfe0ee",
          fontSize: 19,
          letterSpacing: 4,
          textTransform: "uppercase",
        }}
      >
        <span style={{ opacity: 0.55 + 0.45 * Math.sin(frame * 0.12) }}>
          {STEPS[idx]}
          {done ? "" : "…"}
        </span>
        <span style={{ fontFamily: displayFont, fontSize: 22, color: C.parchment, letterSpacing: 2 }}>
          {Math.round(progress * 100)}%
        </span>
      </div>

      <div
        style={{
          height: 14,
          borderRadius: 8,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: fill,
            background: `linear-gradient(90deg, ${C.tealDim}, ${C.teal} 70%, #ffffff)`,
            boxShadow: `0 0 22px ${C.teal}aa`,
          }}
        />
        {/* travelling sheen */}
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 140,
            left: ((frame * 9) % (w + 140)) - 140,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.28), transparent)",
            opacity: done ? 0.2 : 0.9,
          }}
        />
      </div>

      {/* leading ember */}
      <div
        style={{
          position: "relative",
          height: 0,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: fill - 5,
            top: -19,
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: C.ember,
            boxShadow: `0 0 18px 6px ${C.ember}88`,
            opacity: interpolate(progress, [0, 0.03], [0, 1], { extrapolateRight: "clamp" }),
          }}
        />
      </div>
    </div>
  );
};
