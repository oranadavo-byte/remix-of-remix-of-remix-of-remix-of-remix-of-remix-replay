import { getSettings, saveSettings } from "./save";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicTimer: number | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    const s = getSettings();
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = s.master;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = s.music * 0.5;
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.gain.value = s.sfx;
    sfxGain.connect(master);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** Bus every sound effect goes through, so the sfx slider is independent. */
function out(): GainNode | null {
  ac();
  return sfxGain;
}

export function applyVolumes() {
  const s = getSettings();
  ac();
  if (master) master.gain.value = s.master;
  if (musicGain) musicGain.gain.value = s.music * 0.5;
  if (sfxGain) sfxGain.gain.value = s.sfx;
}

export function setMasterVolume(v: number) {
  saveSettings({ master: v });
  applyVolumes();
}

export function setMusicVolume(v: number) {
  saveSettings({ music: v });
  applyVolumes();
}

export function setSfxVolume(v: number) {
  saveSettings({ sfx: v });
  applyVolumes();
}

export function getVolume() {
  return getSettings().master;
}

export function unlockAudio() {
  ac();
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  vol: number,
  slideTo?: number,
  delay = 0,
) {
  const c = ac();
  const bus = out();
  if (!c || !bus) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(bus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur: number, vol: number, filterFreq: number, delay = 0, sweep = 0) {
  const c = ac();
  const bus = out();
  if (!c || !bus) return;
  const t0 = c.currentTime + delay;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const f = c.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(filterFreq, t0);
  if (sweep) f.frequency.exponentialRampToValueAtTime(Math.max(60, sweep), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(g);
  g.connect(bus);
  src.start(t0);
}

export type Sfx =
  | "jump"
  | "land"
  | "dash"
  | "swing"
  | "enemyHit"
  | "playerHit"
  | "enemyDeath"
  | "checkpoint"
  | "bossWake"
  | "bossSlam"
  | "bossPhase"
  | "victory"
  | "death"
  | "pickup"
  | "heal"
  | "spell"
  | "ui";


export function sfx(name: Sfx) {
  switch (name) {
    case "jump":
      tone(320, 0.16, "triangle", 0.18, 620);
      break;
    case "land":
      noise(0.14, 0.16, 900, 0, 200);
      break;
    case "dash":
      noise(0.2, 0.2, 2600, 0, 400);
      tone(180, 0.18, "sawtooth", 0.06, 420);
      break;
    case "swing":
      noise(0.13, 0.16, 4200, 0, 900);
      break;
    case "enemyHit":
      tone(420, 0.1, "square", 0.12, 180);
      noise(0.1, 0.16, 2400, 0, 500);
      break;
    case "playerHit":
      tone(200, 0.22, "sawtooth", 0.2, 90);
      noise(0.2, 0.16, 1200, 0, 200);
      break;
    case "enemyDeath":
      tone(300, 0.3, "triangle", 0.14, 70);
      noise(0.3, 0.14, 1600, 0, 200);
      break;
    case "checkpoint":
      [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, "sine", 0.14, undefined, i * 0.09));
      break;
    case "bossWake":
      tone(70, 1.6, "sawtooth", 0.22, 44);
      noise(1.4, 0.2, 700, 0, 120);
      break;
    case "bossSlam":
      tone(90, 0.5, "square", 0.24, 34);
      noise(0.55, 0.3, 800, 0, 90);
      break;
    case "bossPhase":
      [220, 277, 330].forEach((f, i) => tone(f, 1.0, "sawtooth", 0.14, f * 2, i * 0.05));
      noise(1.0, 0.2, 1800, 0, 300);
      break;
    case "victory":
      [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.9, "sine", 0.16, undefined, i * 0.14));
      break;
    case "death":
      [330, 262, 196, 147].forEach((f, i) => tone(f, 0.6, "triangle", 0.15, undefined, i * 0.12));
      break;
    case "pickup":
      tone(880, 0.16, "sine", 0.12, 1320);
      break;
    case "heal":
      [523, 784, 1046].forEach((f, i) => tone(f, 0.45, "sine", 0.13, undefined, i * 0.1));
      break;
    case "spell":
      tone(520, 0.35, "triangle", 0.16, 160);
      noise(0.3, 0.14, 3000, 0, 600);
      break;
    case "ui":
      tone(660, 0.08, "sine", 0.1);
      break;

  }
}

/* ambient drone + sparse notes */
export function startAmbience() {
  const c = ac();
  if (!c || !musicGain || musicTimer !== null) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "sine";
  osc.frequency.value = 55;
  g.gain.value = 0.12;
  osc.connect(g);
  g.connect(musicGain);
  osc.start();

  const notes = [220, 261.6, 293.7, 349.2, 392];
  musicTimer = window.setInterval(() => {
    if (!ctx || !musicGain) return;
    const f = notes[Math.floor(Math.random() * notes.length)] ?? 220;
    const o = ctx.createOscillator();
    const gg = ctx.createGain();
    o.type = "sine";
    o.frequency.value = f;
    const t0 = ctx.currentTime;
    gg.gain.setValueAtTime(0.0001, t0);
    gg.gain.exponentialRampToValueAtTime(0.06, t0 + 0.8);
    gg.gain.exponentialRampToValueAtTime(0.0001, t0 + 3.4);
    o.connect(gg);
    gg.connect(musicGain);
    o.start(t0);
    o.stop(t0 + 3.6);
  }, 3800);
}
