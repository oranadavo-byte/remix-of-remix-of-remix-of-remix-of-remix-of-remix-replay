import React from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import { body } from "./fonts";
import { captionTrack } from "./captions";
import type { Beat } from "./PromoVideo";

const Line: React.FC<{ text: string; durationInFrames: number }> = ({
  text,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 8, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const rise = interpolate(frame, [0, 12], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 88,
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${rise}px)`,
          maxWidth: 1280,
          textAlign: "center",
          fontFamily: body,
          fontSize: 46,
          fontWeight: 600,
          letterSpacing: 0.4,
          lineHeight: 1.25,
          color: "#f6ead2",
          padding: "18px 40px",
          borderRadius: 18,
          background: "rgba(4, 6, 13, 0.52)",
          boxShadow: "0 0 60px rgba(0,0,0,0.5)",
          textShadow: "0 2px 18px rgba(0,0,0,0.85), 0 0 34px rgba(255,183,77,0.22)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

export const Captions: React.FC<{ beats: Beat[] }> = ({ beats }) => (
  <>
    {captionTrack(beats).map((cue, i) => (
      <Sequence
        key={`${cue.key}-${i}`}
        from={cue.from}
        durationInFrames={cue.durationInFrames}
      >
        <Line text={cue.text} durationInFrames={cue.durationInFrames} />
      </Sequence>
    ))}
  </>
);
