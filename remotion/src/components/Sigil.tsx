import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C } from "../theme";

const R = 150;

export const Sigil: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pop = spring({ frame: frame - 4, fps, config: { damping: 14, stiffness: 90, mass: 1.1 } });
  const breathe = 1 + Math.sin(frame * 0.055) * 0.028;
  const circ = 2 * Math.PI * R;

  const runes = new Array(12).fill(0);

  return (
    <div
      style={{
        width: 420,
        height: 420,
        position: "relative",
        transform: `scale(${interpolate(pop, [0, 1], [0.55, 1]) * breathe})`,
        opacity: pop,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 40,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.teal}44 0%, ${C.violet}22 45%, transparent 72%)`,
          filter: "blur(14px)",
        }}
      />
      <svg width={420} height={420} style={{ position: "absolute", inset: 0 }}>
        <g transform="translate(210 210)">
          {/* outer slow ring */}
          <g transform={`rotate(${frame * 0.35})`}>
            <circle
              r={R + 34}
              fill="none"
              stroke={C.violet}
              strokeOpacity={0.45}
              strokeWidth={2}
              strokeDasharray="18 26"
            />
          </g>
          {/* counter ring */}
          <g transform={`rotate(${-frame * 0.62})`}>
            <circle r={R + 12} fill="none" stroke={C.tealDim} strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="4 14" />
          </g>
          {/* progress arc */}
          <g transform="rotate(-90)">
            <circle r={R} fill="none" stroke="#ffffff10" strokeWidth={7} />
            <circle
              r={R}
              fill="none"
              stroke={C.teal}
              strokeWidth={7}
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - progress)}
              style={{ filter: `drop-shadow(0 0 12px ${C.teal})` }}
            />
          </g>
          {/* rune ticks */}
          {runes.map((_, i) => {
            const a = (i / runes.length) * Math.PI * 2 + frame * 0.006;
            const lit = progress > i / runes.length;
            const rr = R - 30;
            return (
              <rect
                key={i}
                x={-3}
                y={-rr - 10}
                width={6}
                height={20}
                rx={3}
                fill={lit ? C.ember : "#ffffff22"}
                opacity={lit ? 0.85 + 0.15 * Math.sin(frame * 0.2 + i) : 0.5}
                transform={`rotate(${(a * 180) / Math.PI})`}
                style={lit ? { filter: `drop-shadow(0 0 8px ${C.emberDeep})` } : undefined}
              />
            );
          })}
          {/* core lantern */}
          <circle r={54 + Math.sin(frame * 0.09) * 4} fill={`${C.ember}22`} />
          <circle r={30 + Math.sin(frame * 0.09) * 3} fill={C.ember} opacity={0.9} style={{ filter: `drop-shadow(0 0 26px ${C.ember})` }} />
          <circle r={13} fill="#fff6e2" />
          {/* orbiting mote */}
          <g transform={`rotate(${frame * 1.6})`}>
            <circle cx={0} cy={-R - 34} r={7} fill={C.teal} style={{ filter: `drop-shadow(0 0 14px ${C.teal})` }} />
          </g>
        </g>
      </svg>
    </div>
  );
};
