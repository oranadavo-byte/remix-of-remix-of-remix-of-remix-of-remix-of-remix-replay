import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { makeItems } from "../rand";

const spores = makeItems(90, 5, (r) => ({
  x: r() * 1920,
  y: r() * 1080,
  size: 2 + r() * 7,
  rise: 0.25 + r() * 1.1,
  amp: 12 + r() * 60,
  phase: r() * Math.PI * 2,
  warm: r() > 0.7,
  op: 0.25 + r() * 0.6,
}));

export const Spores: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {spores.map((s, i) => {
        const y = ((s.y - frame * s.rise) % 1180 + 1180) % 1180 - 50;
        const x = s.x + Math.sin(frame * 0.017 + s.phase) * s.amp;
        const twinkle = 0.55 + 0.45 * Math.sin(frame * 0.11 + s.phase * 3);
        const color = s.warm ? C.ember : C.teal;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: color,
              opacity: s.op * twinkle * interpolate(frame, [0, 30], [0, 1], { extrapolateRight: "clamp" }),
              boxShadow: `0 0 ${s.size * 4}px ${s.size * 1.4}px ${color}55`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
