import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig, Easing } from "remotion";
import { Backdrop } from "./components/Backdrop";
import { Forest } from "./components/Forest";
import { Spores } from "./components/Spores";
import { Sigil } from "./components/Sigil";
import { Title, bodyFont } from "./components/Title";
import { Progress } from "./components/Progress";
import { Tips } from "./components/Tips";
import { C } from "./theme";

// staged loading curve with believable plateaus
const PROGRESS_KEYS = [
  [20, 0],
  [55, 0.18],
  [80, 0.22],
  [120, 0.46],
  [150, 0.5],
  [190, 0.72],
  [215, 0.76],
  [265, 0.97],
  [292, 1],
] as const;

const useProgress = (frame: number) =>
  interpolate(
    frame,
    PROGRESS_KEYS.map((k) => k[0]),
    PROGRESS_KEYS.map((k) => k[1]),
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.ease) }
  );

export const LoadingVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = useProgress(frame);
  const done = progress >= 0.999;

  const flash = interpolate(frame, [292, 300, 322], [0, 0.55, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const readyPop = spring({ frame: frame - 298, fps, config: { damping: 12, stiffness: 140 } });
  const outro = interpolate(frame, [durationInFrames - 22, durationInFrames], [0, 1], {
    extrapolateLeft: "clamp",
  });
  const camera = Math.sin(frame * 0.014) * 8;

  return (
    <AbsoluteFill style={{ backgroundColor: C.bgDeep }}>
      <AbsoluteFill style={{ transform: `scale(1.04) translateY(${camera}px)` }}>
        <Backdrop />
        <Forest />
        <Spores />
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 40,
          gap: 6,
        }}
      >
        <Sigil progress={progress} />
        <div style={{ marginTop: -18 }}>
          <Title />
        </div>
        <div style={{ height: 46 }} />
        <Progress progress={progress} />
        <div style={{ height: 26 }} />
        <div style={{ height: 44 }}>
          {done ? (
            <div
              style={{
                fontFamily: bodyFont,
                fontWeight: 600,
                fontSize: 26,
                letterSpacing: 8,
                color: C.teal,
                opacity: readyPop * (0.62 + 0.38 * Math.sin(frame * 0.16)),
                transform: `scale(${interpolate(readyPop, [0, 1], [0.86, 1])})`,
                textShadow: `0 0 24px ${C.teal}88`,
              }}
            >
              PRESS ENTER TO DESCEND
            </div>
          ) : (
            <Tips />
          )}
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at 50% 40%, ${C.teal} 0%, transparent 60%)`,
          opacity: flash,
          mixBlendMode: "screen",
        }}
      />
      <AbsoluteFill style={{ backgroundColor: "#03060d", opacity: outro }} />
    </AbsoluteFill>
  );
};
