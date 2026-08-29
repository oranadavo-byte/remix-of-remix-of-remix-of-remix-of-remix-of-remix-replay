import { XFADE, type Beat, type SceneKey } from "./PromoVideo";

/** One caption line per scene beat, matching the on-screen key text. */
export const CAPTION_LINES: Record<SceneKey, string> = {
  spark: "One lantern against the dark.",
  title: "Noctilume",
  moves: "Dash. Strike. Leap.",
  skills: "Spend echoes. Grow your light.",
  guardian: "Face the guardians of the deep.",
  lockup: "Noctilume — play free in your browser.",
};

export type CaptionCue = {
  key: SceneKey;
  text: string;
  from: number;
  durationInFrames: number;
};

/** Caption cues aligned to the transition-overlapped scene timeline. */
export const captionTrack = (beats: Beat[]): CaptionCue[] => {
  let cursor = 0;
  return beats.map((beat, i) => {
    const from = i === 0 ? 0 : cursor - XFADE;
    cursor = from + beat.frames;
    const pad = Math.min(8, Math.floor(beat.frames * 0.08));
    return {
      key: beat.key,
      text: CAPTION_LINES[beat.key],
      from: from + pad,
      durationInFrames: Math.max(12, beat.frames - pad * 2),
    };
  });
};

const srtTime = (frames: number, fps: number) => {
  const ms = Math.round((frames / fps) * 1000);
  const h = String(Math.floor(ms / 3600000)).padStart(2, "0");
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((ms % 60000) / 1000)).padStart(2, "0");
  const mmm = String(ms % 1000).padStart(3, "0");
  return `${h}:${m}:${s},${mmm}`;
};

export const toSrt = (beats: Beat[], fps = 30) =>
  captionTrack(beats)
    .map(
      (cue, i) =>
        `${i + 1}\n${srtTime(cue.from, fps)} --> ${srtTime(
          cue.from + cue.durationInFrames,
          fps,
        )}\n${cue.text}\n`,
    )
    .join("\n");
