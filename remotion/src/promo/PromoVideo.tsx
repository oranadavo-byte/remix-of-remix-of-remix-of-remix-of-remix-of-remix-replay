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

export const PROMO_FRAMES = 90 + 110 + 120 + 120 + 150 + 145 - 5 * 22;

export const PromoVideo: React.FC = () => (
  <AbsoluteFill style={{ background: "#04060d" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={90}>
        <Spark />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 22 })}
      />
      <TransitionSeries.Sequence durationInFrames={110}>
        <TitleCard />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-right" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })}
      />
      <TransitionSeries.Sequence durationInFrames={120}>
        <Moves />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 22 })}
      />
      <TransitionSeries.Sequence durationInFrames={120}>
        <SkillTree />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={wipe({ direction: "from-bottom" })}
        timing={springTiming({ config: { damping: 200 }, durationInFrames: 22 })}
      />
      <TransitionSeries.Sequence durationInFrames={150}>
        <Guardian />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 22 })}
      />
      <TransitionSeries.Sequence durationInFrames={145}>
        <Lockup />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    <Grain />
    <Vignette />
  </AbsoluteFill>
);
