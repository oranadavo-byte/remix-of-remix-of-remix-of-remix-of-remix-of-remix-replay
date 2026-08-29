import { interpolate, useCurrentFrame } from "remotion";
import { C, TIPS } from "../theme";
import { bodyFont } from "./Title";

const HOLD = 90; // frames per tip

export const Tips: React.FC = () => {
  const frame = useCurrentFrame();
  const start = 60;
  const t = Math.max(0, frame - start);
  const idx = Math.floor(t / HOLD) % TIPS.length;
  const local = t % HOLD;
  const opacity =
    interpolate(local, [0, 14], [0, 1], { extrapolateRight: "clamp" }) *
    interpolate(local, [HOLD - 16, HOLD], [1, 0], { extrapolateLeft: "clamp" }) *
    interpolate(frame, [start, start + 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(local, [0, 18], [16, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{ textAlign: "center", height: 40 }}>
      <div
        style={{
          fontFamily: bodyFont,
          fontSize: 24,
          color: C.parchment,
          opacity: opacity * 0.9,
          transform: `translateY(${y}px)`,
          textShadow: "0 2px 18px rgba(0,0,0,0.8)",
        }}
      >
        <span style={{ color: C.ember, letterSpacing: 3, fontSize: 18, marginRight: 14 }}>LORE</span>
        {TIPS[idx]}
      </div>
    </div>
  );
};
