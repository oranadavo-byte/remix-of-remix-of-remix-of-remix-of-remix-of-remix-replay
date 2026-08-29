import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { makeItems } from "../rand";

const blobs = makeItems(7, 91, (r) => ({
  x: r() * 100,
  y: 20 + r() * 70,
  size: 500 + r() * 900,
  speed: 0.06 + r() * 0.16,
  phase: r() * Math.PI * 2,
  hue: r() > 0.55 ? C.tealDim : C.violet,
  op: 0.1 + r() * 0.16,
}));

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(120% 90% at 50% 78%, ${C.bgHaze} 0%, ${C.bgMid} 38%, ${C.bgDeep} 100%)`,
      }}
    >
      {blobs.map((b, i) => {
        const drift = Math.sin(frame * b.speed * 0.05 + b.phase);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${b.x}%`,
              top: `${b.y}%`,
              width: b.size,
              height: b.size * 0.62,
              marginLeft: -b.size / 2,
              marginTop: -b.size * 0.31,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${b.hue} 0%, transparent 68%)`,
              opacity: b.op * (0.7 + 0.3 * drift),
              transform: `translate(${drift * 40}px, ${Math.cos(frame * 0.012 + b.phase) * 26}px)`,
              filter: "blur(28px)",
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 60% at 50% 50%, transparent 42%, rgba(3,5,12,0.86) 100%)`,
          opacity: interpolate(frame, [0, 40], [1, 0.86], { extrapolateRight: "clamp" }),
        }}
      />
    </AbsoluteFill>
  );
};
