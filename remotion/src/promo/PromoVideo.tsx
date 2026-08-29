import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { Grain, Vignette } from "./kit";
import { Spark } from "./scenes/Spark";
import { TitleCard } from "./scenes/TitleCard";
import { Moves } from "./scenes/Moves";
import { SkillTree } from "./scenes/SkillTree";
import { Guardian } from "./scenes/Guardian";
import { Lockup } from "./scenes/Lockup";

export const XFADE = 22;

const SCENES = {
  spark: Spark,
  title: TitleCard,
  moves: Moves,
  skills: SkillTree,
  guardian: Guardian,
  lockup: Lockup,
} as const;

export type SceneKey = keyof typeof SCENES;
export type Beat = { key: SceneKey; frames: number };

const transitionFor = (i: number) =>
  i % 2 === 0 ? (
    <TransitionSeries.Transition
      presentation={fade()}
      timing={linearTiming({ durationInFrames: XFADE })}
    />
  ) : (
    <TransitionSeries.Transition
      presentation={wipe({ direction: i % 4 === 1 ? "from-right" : "from-bottom" })}
      timing={springTiming({ config: { damping: 200 }, durationInFrames: XFADE })}
    />
  );

export const totalFrames = (beats: Beat[]) =>
  beats.reduce((n, b) => n + b.frames, 0) - XFADE * (beats.length - 1);

/** Full cut — the original ~21s cinematic. */
export const FULL_BEATS: Beat[] = [
  { key: "spark", frames: 90 },
  { key: "title", frames: 110 },
  { key: "moves", frames: 120 },
  { key: "skills", frames: 120 },
  { key: "guardian", frames: 150 },
  { key: "lockup", frames: 145 },
];

/** 15s social cut — drops the skill-tree beat and tightens every scene. */
export const SHORT_BEATS: Beat[] = [
  { key: "spark", frames: 80 },
  { key: "title", frames: 108 },
  { key: "moves", frames: 110 },
  { key: "guardian", frames: 130 },
  { key: "lockup", frames: 110 },
];

/** 30s cut — every beat, with room to breathe. */
export const LONG_BEATS: Beat[] = [
  { key: "spark", frames: 120 },
  { key: "title", frames: 165 },
  { key: "moves", frames: 180 },
  { key: "skills", frames: 175 },
  { key: "guardian", frames: 200 },
  { key: "lockup", frames: 170 },
];

export const PROMO_FRAMES = totalFrames(FULL_BEATS);
export const PROMO_15_FRAMES = totalFrames(SHORT_BEATS);
export const PROMO_30_FRAMES = totalFrames(LONG_BEATS);

export const PromoVideo: React.FC<{ beats?: Beat[] }> = ({ beats = FULL_BEATS }) => (
  <AbsoluteFill style={{ background: "#04060d" }}>
    <TransitionSeries>
      {beats.flatMap((beat, i) => {
        const Scene = SCENES[beat.key];
        const nodes: React.ReactNode[] = [];
        if (i > 0) nodes.push(<React.Fragment key={`t${i}`}>{transitionFor(i - 1)}</React.Fragment>);
        nodes.push(
          <TransitionSeries.Sequence key={beat.key} durationInFrames={beat.frames}>
            <Scene />
          </TransitionSeries.Sequence>,
        );
        return nodes;
      })}
    </TransitionSeries>
    <Grain />
    <Vignette />
  </AbsoluteFill>
);
