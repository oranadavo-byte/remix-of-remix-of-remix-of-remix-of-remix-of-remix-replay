import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { makeItems } from "../rand";

type LayerCfg = { seed: number; count: number; color: string; base: number; h: number; speed: number; blur: number; op: number };

const layers: LayerCfg[] = [
  { seed: 11, count: 16, color: "#0b1626", base: 1080, h: 520, speed: 0.22, blur: 6, op: 0.85 },
  { seed: 23, count: 13, color: "#070f1c", base: 1110, h: 700, speed: 0.5, blur: 3, op: 0.92 },
  { seed: 37, count: 9, color: "#03070f", base: 1150, h: 900, speed: 0.95, blur: 0, op: 1 },
];

const Layer: React.FC<{ cfg: LayerCfg; frame: number }> = ({ cfg, frame }) => {
  const trees = makeItems(cfg.count, cfg.seed, (r) => ({
    x: r() * 2200 - 100,
    w: 40 + r() * 120,
    hh: cfg.h * (0.6 + r() * 0.7),
    lean: (r() - 0.5) * 40,
    glow: r() > 0.72,
    gy: r(),
  }));
  const shift = -((frame * cfg.speed) % 2200);
  return (
    <AbsoluteFill style={{ opacity: cfg.op, filter: cfg.blur ? `blur(${cfg.blur}px)` : undefined }}>
      {[0, 1].map((k) => (
        <svg key={k} width={2200} height={1080} style={{ position: "absolute", left: shift + k * 2200, top: 0 }}>
          {trees.map((t, i) => {
            const sway = Math.sin(frame * 0.02 + i) * 6;
            const topY = cfg.base - t.hh;
            return (
              <g key={i}>
                <path
                  d={`M ${t.x} ${cfg.base} L ${t.x + t.w * 0.5 + t.lean + sway} ${topY} L ${t.x + t.w} ${cfg.base} Z`}
                  fill={cfg.color}
                />
                {t.glow && (
                  <circle
                    cx={t.x + t.w * 0.5 + t.lean * 0.6 + sway}
                    cy={topY + t.hh * (0.25 + t.gy * 0.4)}
                    r={5 + 3 * Math.sin(frame * 0.09 + i * 2)}
                    fill={C.teal}
                    opacity={0.55}
                  />
                )}
              </g>
            );
          })}
        </svg>
      ))}
    </AbsoluteFill>
  );
};

export const Forest: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {layers.map((cfg, i) => (
        <Layer key={i} cfg={cfg} frame={frame} />
      ))}
    </AbsoluteFill>
  );
};
