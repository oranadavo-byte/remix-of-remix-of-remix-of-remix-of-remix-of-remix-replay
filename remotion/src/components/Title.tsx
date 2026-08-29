import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";
import { C } from "../theme";

const cinzel = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] });
const manrope = loadManrope("normal", { weights: ["400", "600"], subsets: ["latin"] });

export const displayFont = cinzel.fontFamily;
export const bodyFont = manrope.fontFamily;

const WORD = "NOCTILUME".split("");

export const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
        {WORD.map((ch, i) => {
          const s = spring({ frame: frame - 10 - i * 3, fps, config: { damping: 16, stiffness: 120 } });
          return (
            <span
              key={i}
              style={{
                fontFamily: displayFont,
                fontWeight: 700,
                fontSize: 92,
                letterSpacing: 8,
                color: C.parchment,
                display: "inline-block",
                opacity: s,
                filter: `blur(${interpolate(s, [0, 1], [10, 0])}px)`,
                transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px) scale(${interpolate(s, [0, 1], [0.9, 1])})`,
                textShadow: `0 0 26px ${C.teal}66, 0 6px 30px rgba(0,0,0,0.7)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 14,
          fontFamily: bodyFont,
          fontSize: 22,
          letterSpacing: 13,
          textTransform: "uppercase",
          color: C.muted,
          opacity: interpolate(frame, [42, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        Kindling the Hollow
      </div>
    </div>
  );
};
