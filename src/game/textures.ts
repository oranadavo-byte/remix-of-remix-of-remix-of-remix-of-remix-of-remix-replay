import * as Phaser from "phaser";
import { PAL } from "./config";

type Ctx = CanvasRenderingContext2D;

function sheet(
  scene: Phaser.Scene,
  key: string,
  fw: number,
  fh: number,
  count: number,
  draw: (ctx: Ctx, i: number, n: number) => void,
) {
  if (scene.textures.exists(key)) return;
  const c = document.createElement("canvas");
  c.width = fw * count;
  c.height = fh;
  const ctx = c.getContext("2d")!;
  for (let i = 0; i < count; i++) {
    ctx.save();
    ctx.translate(i * fw, 0);
    ctx.beginPath();
    ctx.rect(0, 0, fw, fh);
    ctx.clip();
    draw(ctx, i, count);
    ctx.restore();
  }
  scene.textures.addSpriteSheet(key, c as unknown as HTMLImageElement, {
    frameWidth: fw,
    frameHeight: fh,
  });
}

function single(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  draw: (ctx: Ctx) => void,
) {
  if (scene.textures.exists(key)) return;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  scene.textures.addCanvas(key, c);
}

function glow(ctx: Ctx, x: number, y: number, r: number, color: string, a = 0.9) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function rnd(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

/* ---------------- PLAYER: THE LANTERN WARDEN ---------------- */

const PW = 72;
const PH = 72;
const GROUND_Y = 66;

interface Pose {
  legPhase?: number;
  legSpread?: number;
  bodyY?: number;
  lean?: number;
  crouch?: number;
  scarf?: number;
  armAngle?: number;
  slash?: number; // 0..1 progress, <0 = none
  slashType?: 0 | 1 | 2;
  alpha?: number;
  dashSquash?: number;
  tilt?: number;
  fade?: number;
}

function drawWarden(ctx: Ctx, p: Pose) {
  const bodyY = p.bodyY ?? 0;
  const crouch = p.crouch ?? 0;
  const lean = p.lean ?? 0;
  const scarf = p.scarf ?? 0;
  const legPhase = p.legPhase ?? 0;
  const spread = p.legSpread ?? 0;
  const alpha = p.alpha ?? 1;
  const sq = p.dashSquash ?? 0;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(PW / 2, GROUND_Y + bodyY + crouch);
  if (p.tilt) ctx.rotate(p.tilt);
  ctx.scale(1 + sq * 0.22, 1 - sq * 0.18 - crouch * 0.004);

  const hipY = -26;

  // rear leg
  const legs: Array<[number, number]> = [
    [Math.sin(legPhase) * spread, 0.55],
    [Math.sin(legPhase + Math.PI) * spread, 1],
  ];
  legs.forEach(([off, shade], i) => {
    ctx.save();
    ctx.fillStyle = i === 0 ? PAL.cloakDark : PAL.charcoal;
    ctx.globalAlpha = alpha * shade;
    const lift = Math.max(0, -off) * 0.35;
    ctx.beginPath();
    ctx.roundRect(-4 + off * 0.9, hipY + 2, 7, 22 - lift, 3);
    ctx.fill();
    // boot
    ctx.fillStyle = i === 0 ? "#1d1f27" : "#2a2d38";
    ctx.beginPath();
    ctx.roundRect(-6 + off * 1.15, hipY + 20 - lift, 12, 7, 3);
    ctx.fill();
    ctx.restore();
  });

  // flowing cloak tail behind (wind-caught)
  ctx.save();
  ctx.fillStyle = "#20242f";
  ctx.beginPath();
  ctx.moveTo(-2, hipY - 20);
  ctx.quadraticCurveTo(-18 - scarf * 14, hipY - 24 - scarf * 6, -26 - scarf * 22, hipY - 2 + scarf * 8);
  ctx.quadraticCurveTo(-20 - scarf * 10, hipY - 4, -14 - scarf * 6, hipY + 4);
  ctx.quadraticCurveTo(-10, hipY - 6, -2, hipY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#2c3244";
  ctx.beginPath();
  ctx.moveTo(-4, hipY - 16);
  ctx.quadraticCurveTo(-15 - scarf * 9, hipY - 16 - scarf * 3, -19 - scarf * 13, hipY - 1 + scarf * 4);
  ctx.quadraticCurveTo(-11, hipY - 6, -4, hipY - 4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // cloak body — narrow shoulders, tattered hem
  ctx.save();
  ctx.rotate(lean);
  ctx.fillStyle = PAL.cloak;
  ctx.beginPath();
  ctx.moveTo(-7, hipY - 20);
  ctx.quadraticCurveTo(0, hipY - 23, 7, hipY - 20);
  ctx.quadraticCurveTo(13, hipY - 4, 11, hipY + 7);
  ctx.lineTo(7, hipY + 3);
  ctx.lineTo(3, hipY + 8);
  ctx.lineTo(-1, hipY + 2);
  ctx.lineTo(-5, hipY + 8);
  ctx.lineTo(-9, hipY + 3);
  ctx.lineTo(-12, hipY + 7);
  ctx.quadraticCurveTo(-13, hipY - 4, -7, hipY - 20);
  ctx.closePath();
  ctx.fill();
  // shaded fold
  ctx.fillStyle = PAL.cloakDark;
  ctx.beginPath();
  ctx.moveTo(1, hipY - 21);
  ctx.quadraticCurveTo(9, hipY - 6, 10, hipY + 6);
  ctx.lineTo(4, hipY + 3);
  ctx.quadraticCurveTo(3, hipY - 8, 1, hipY - 21);
  ctx.closePath();
  ctx.fill();

  // lantern core at the chest
  glow(ctx, 1, hipY - 8, 13, "rgba(255,179,71,0.5)", alpha);
  ctx.fillStyle = PAL.amberBright;
  ctx.beginPath();
  ctx.arc(1, hipY - 8, 2.6, 0, Math.PI * 2);
  ctx.fill();

  // arm holding the nail
  const aa = p.armAngle ?? 0.3;
  ctx.save();
  ctx.translate(4, hipY - 14);
  ctx.rotate(aa);
  ctx.fillStyle = "#1e222c";
  ctx.beginPath();
  ctx.roundRect(0, -2.6, 13, 5.2, 2.6);
  ctx.fill();
  ctx.restore();

  // ---- head: pale carved mask with twin horns ----
  const hy = hipY - 30;
  // neck shadow
  ctx.fillStyle = "#171a22";
  ctx.beginPath();
  ctx.roundRect(-4, hy + 8, 9, 6, 3);
  ctx.fill();
  // horns
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.moveTo(-7, hy - 3);
  ctx.quadraticCurveTo(-15, hy - 14, -11, hy - 22);
  ctx.quadraticCurveTo(-7, hy - 13, -2, hy - 7);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(7, hy - 3);
  ctx.quadraticCurveTo(14, hy - 15, 11, hy - 24);
  ctx.quadraticCurveTo(6, hy - 13, 2, hy - 7);
  ctx.closePath();
  ctx.fill();
  // mask
  glow(ctx, 0, hy, 18, "rgba(232,226,212,0.16)", alpha);
  ctx.fillStyle = PAL.cream;
  ctx.beginPath();
  ctx.ellipse(0, hy, 9.5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // mask shading on the trailing side
  ctx.fillStyle = "rgba(160,158,150,0.35)";
  ctx.beginPath();
  ctx.ellipse(-4.5, hy + 1, 5, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  // hollow eyes
  ctx.fillStyle = "#0d0f16";
  ctx.beginPath();
  ctx.ellipse(-3.4, hy - 1, 2.5, 4.2, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(3.6, hy - 1, 2.7, 4.4, -0.12, 0, Math.PI * 2);
  ctx.fill();
  // faint amber ember inside the eyes
  glow(ctx, 3.6, hy - 1, 5, "rgba(255,196,110,0.45)", alpha);
  ctx.fillStyle = "rgba(255,216,155,0.75)";
  ctx.beginPath();
  ctx.arc(3.9, hy - 0.5, 0.9, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-3.2, hy - 0.5, 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();


  // blade slash arc
  if (p.slash !== undefined && p.slash >= 0) {
    const t = p.slash;
    const type = p.slashType ?? 0;
    const baseA = type === 0 ? -0.9 : type === 1 ? 0.9 : -1.3;
    const sweep = type === 1 ? -2.2 : 2.4;
    const a0 = baseA + sweep * t;
    ctx.save();
    ctx.translate(8, hipY - 12);
    ctx.rotate(a0);
    ctx.globalAlpha = alpha * (1 - t * 0.5);
    // arc trail
    ctx.strokeStyle = "rgba(255,216,155,0.55)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 22, -0.8, 0.8);
    ctx.stroke();
    // blade
    ctx.strokeStyle = PAL.ivory;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.arc(6, 0, 15, -0.55, 0.55);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export interface AnimSpec {
  key: string;
  frames: number;
  rate: number;
  repeat: number;
}

export const PLAYER_ANIMS = {
  idle: { key: "w_idle", frames: 6, rate: 8, repeat: -1 },
  run: { key: "w_run", frames: 8, rate: 15, repeat: -1 },
  rise: { key: "w_rise", frames: 3, rate: 10, repeat: 0 },
  fall: { key: "w_fall", frames: 3, rate: 10, repeat: 0 },
  land: { key: "w_land", frames: 3, rate: 18, repeat: 0 },
  atk1: { key: "w_atk1", frames: 6, rate: 22, repeat: 0 },
  atk2: { key: "w_atk2", frames: 6, rate: 22, repeat: 0 },
  atk3: { key: "w_atk3", frames: 7, rate: 20, repeat: 0 },
  dash: { key: "w_dash", frames: 4, rate: 20, repeat: 0 },
  hurt: { key: "w_hurt", frames: 3, rate: 12, repeat: 0 },
  death: { key: "w_death", frames: 8, rate: 9, repeat: 0 },
} satisfies Record<string, AnimSpec>;

function buildPlayer(scene: Phaser.Scene) {
  sheet(scene, "w_idle", PW, PH, 6, (ctx, i, n) => {
    const t = i / n;
    drawWarden(ctx, {
      bodyY: Math.sin(t * Math.PI * 2) * 1.2,
      scarf: 0.2 + Math.sin(t * Math.PI * 2) * 0.15,
      armAngle: 0.35 + Math.sin(t * Math.PI * 2) * 0.08,
      legSpread: 2,
    });
  });
  sheet(scene, "w_run", PW, PH, 8, (ctx, i, n) => {
    const ph = (i / n) * Math.PI * 2;
    drawWarden(ctx, {
      legPhase: ph,
      legSpread: 8,
      bodyY: -Math.abs(Math.sin(ph)) * 2.5,
      lean: 0.14,
      scarf: 0.7 + Math.sin(ph) * 0.2,
      armAngle: 0.6 + Math.sin(ph + 1) * 0.3,
    });
  });
  sheet(scene, "w_rise", PW, PH, 3, (ctx, i) =>
    drawWarden(ctx, { legSpread: 6, legPhase: 0.6, bodyY: -2 - i, lean: 0.1, scarf: 0.9, armAngle: -0.4 }),
  );
  sheet(scene, "w_fall", PW, PH, 3, (ctx, i) =>
    drawWarden(ctx, { legSpread: 5, legPhase: -0.7, bodyY: i, lean: -0.06, scarf: 1.0, armAngle: 0.9 }),
  );
  sheet(scene, "w_land", PW, PH, 3, (ctx, i) =>
    drawWarden(ctx, { crouch: [7, 4, 1][i] ?? 0, legSpread: 4, scarf: 0.3, armAngle: 0.8 }),
  );
  const atk = (key: string, n: number, type: 0 | 1 | 2) =>
    sheet(scene, key, PW, PH, n, (ctx, i) => {
      const t = i / (n - 1);
      drawWarden(ctx, {
        legSpread: 4,
        lean: 0.1 + t * 0.08,
        scarf: 0.5,
        armAngle: -0.3 + t * 1.2,
        slash: i === 0 ? -1 : t,
        slashType: type,
        crouch: t < 0.3 ? 2 : 0,
      });
    });
  atk("w_atk1", 6, 0);
  atk("w_atk2", 6, 1);
  atk("w_atk3", 7, 2);
  sheet(scene, "w_dash", PW, PH, 4, (ctx, i) =>
    drawWarden(ctx, {
      dashSquash: 1 - i * 0.12,
      lean: 0.3,
      scarf: 1.6,
      legSpread: 3,
      legPhase: 1,
      armAngle: -0.9,
      bodyY: -2,
    }),
  );
  sheet(scene, "w_hurt", PW, PH, 3, (ctx, i) =>
    drawWarden(ctx, { lean: -0.25 + i * 0.06, scarf: 1.1, armAngle: -0.8, bodyY: -3 + i, legSpread: 6 }),
  );
  sheet(scene, "w_death", PW, PH, 8, (ctx, i, n) => {
    const t = i / (n - 1);
    drawWarden(ctx, {
      tilt: -t * 1.2,
      crouch: t * 12,
      alpha: 1 - t * 0.7,
      scarf: 1.2 - t,
      legSpread: 3,
      armAngle: 1.2,
    });
    const r = rnd(7);
    for (let k = 0; k < 10; k++) {
      const a = r() * Math.PI * 2;
      const d = t * 26 * (0.4 + r());
      glow(ctx, PW / 2 + Math.cos(a) * d, GROUND_Y - 28 + Math.sin(a) * d, 5, "rgba(255,190,110,0.8)", 1 - t);
    }
  });
}

/* ---------------- ENEMIES ---------------- */

const CW = 72;
const CH = 48;

function drawCrawler(ctx: Ctx, legPh: number, lunge: number, hurt: number, dead: number) {
  ctx.save();
  ctx.globalAlpha = 1 - dead * 0.9;
  ctx.translate(CW / 2, 42 + dead * 4);
  ctx.scale(1 + lunge * 0.15, 1 - lunge * 0.1 - dead * 0.3);
  // legs
  ctx.strokeStyle = "#1a1e24";
  ctx.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const x = -16 + i * 11;
    const a = Math.sin(legPh + i * 1.4) * 4;
    ctx.beginPath();
    ctx.moveTo(x, -8);
    ctx.lineTo(x + a, 0);
    ctx.stroke();
  }
  // body plates
  ctx.fillStyle = hurt > 0 ? "#ffffff" : "#181c22";
  ctx.beginPath();
  ctx.moveTo(-22, -8);
  ctx.quadraticCurveTo(-18, -24, 0, -22);
  ctx.quadraticCurveTo(16, -21, 22, -10);
  ctx.lineTo(22, -7);
  ctx.lineTo(-22, -7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = hurt > 0 ? "#ffffff" : "#2b323b";
  ctx.beginPath();
  ctx.moveTo(-10, -20);
  ctx.lineTo(4, -21);
  ctx.lineTo(2, -10);
  ctx.lineTo(-12, -10);
  ctx.closePath();
  ctx.fill();
  // shovel head
  ctx.fillStyle = hurt > 0 ? "#ffffff" : "#232830";
  ctx.beginPath();
  ctx.moveTo(20, -18);
  ctx.lineTo(34 + lunge * 5, -12);
  ctx.lineTo(20, -6);
  ctx.closePath();
  ctx.fill();
  // fungal specks
  if (hurt <= 0) {
    for (let i = 0; i < 5; i++) {
      glow(ctx, -16 + i * 9, -16 - (i % 2) * 3, 4, "rgba(143,216,210,0.7)", 0.9);
    }
  }
  ctx.restore();
}

const WW = 64;
const WH = 72;
function drawWisp(ctx: Ctx, t: number, charge: number, hurt: number, dead: number) {
  ctx.save();
  ctx.translate(WW / 2, 30);
  ctx.globalAlpha = 1 - dead;
  const s = 1 - charge * 0.15 + Math.sin(t * Math.PI * 2) * 0.04;
  ctx.scale(s, 1 / s);
  glow(ctx, 0, 0, 26 + charge * 10, charge > 0 ? "rgba(242,233,216,0.55)" : "rgba(168,155,196,0.35)");
  ctx.fillStyle = hurt > 0 ? "#ffffff" : "rgba(168,155,196,0.85)";
  ctx.beginPath();
  ctx.ellipse(0, 0, 17, 14, 0, Math.PI, 0);
  ctx.quadraticCurveTo(0, 6, -17, 0);
  ctx.fill();
  ctx.fillStyle = hurt > 0 ? "#ffffff" : "rgba(111,179,173,0.6)";
  ctx.beginPath();
  ctx.ellipse(0, -3, 11, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  glow(ctx, 0, -2, 9, "rgba(242,233,216,0.9)");
  // tendrils
  ctx.strokeStyle = "rgba(140,130,165,0.8)";
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 3; i++) {
    const x = -9 + i * 9;
    ctx.beginPath();
    ctx.moveTo(x, 2);
    ctx.quadraticCurveTo(x + Math.sin(t * 6 + i) * 7, 16, x + Math.sin(t * 6 + i) * 10, 30 - dead * 10);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    const a = t * Math.PI * 2 + i * 1.6;
    glow(ctx, Math.cos(a) * 22, Math.sin(a) * 12 - 4, 4, "rgba(200,220,215,0.8)");
  }
  ctx.restore();
}

const SW = 96;
const SH = 108;
function drawSentinel(ctx: Ctx, walk: number, arm: number, hurt: number, dead: number) {
  ctx.save();
  ctx.translate(SW / 2, 100);
  ctx.globalAlpha = 1 - dead * 0.85;
  ctx.translate(0, dead * 18);
  const body = hurt > 0 ? "#ffffff" : "#4c5a4e";
  const dark = hurt > 0 ? "#ffffff" : "#333d36";
  // legs
  ctx.fillStyle = dark;
  [-10, 10].forEach((x, i) => {
    const off = Math.sin(walk + i * Math.PI) * 5;
    ctx.beginPath();
    ctx.roundRect(x - 7 + off, -30, 14, 30, 4);
    ctx.fill();
  });
  // torso
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-20, -32);
  ctx.lineTo(-24, -70);
  ctx.lineTo(24, -72);
  ctx.lineTo(20, -32);
  ctx.closePath();
  ctx.fill();
  // shoulders
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(-32, -78, 22, 16, 5);
  ctx.roundRect(12, -80, 24, 18, 5);
  ctx.fill();
  // head
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(-9, -94, 20, 18, 5);
  ctx.fill();
  // rune core
  glow(ctx, 0, -52, 16, "rgba(255,179,71,0.6)");
  ctx.fillStyle = PAL.amberBright;
  ctx.beginPath();
  ctx.roundRect(-2.5, -62, 5, 20, 2);
  ctx.fill();
  // roots
  ctx.strokeStyle = "#241c14";
  ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-20 + i * 12, -34);
    ctx.quadraticCurveTo(-16 + i * 12, -50, -22 + i * 12, -70);
    ctx.stroke();
  }
  // shield arm (left)
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(-30, -56, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.arc(-30, -56, 9, 0.4, Math.PI * 1.7);
  ctx.fill();
  // weapon arm (right)
  ctx.save();
  ctx.translate(24, -66);
  ctx.rotate(arm);
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(0, -5, 22, 10, 4);
  ctx.fill();
  ctx.fillStyle = hurt > 0 ? "#ffffff" : "#8a8f86";
  ctx.beginPath();
  ctx.moveTo(20, -6);
  ctx.lineTo(50, -3);
  ctx.lineTo(50, 4);
  ctx.lineTo(20, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.restore();
}

export const ENEMY_ANIMS = {
  crawler: {
    idle: { key: "c_idle", frames: 4, rate: 5, repeat: -1 },
    crawl: { key: "c_crawl", frames: 6, rate: 12, repeat: -1 },
    lunge: { key: "c_lunge", frames: 4, rate: 14, repeat: 0 },
    hurt: { key: "c_hurt", frames: 2, rate: 14, repeat: 0 },
    death: { key: "c_death", frames: 5, rate: 12, repeat: 0 },
  },
  wisp: {
    float: { key: "s_float", frames: 6, rate: 9, repeat: -1 },
    charge: { key: "s_charge", frames: 4, rate: 12, repeat: 0 },
    lunge: { key: "s_lunge", frames: 3, rate: 14, repeat: 0 },
    hurt: { key: "s_hurt", frames: 2, rate: 14, repeat: 0 },
    death: { key: "s_death", frames: 5, rate: 12, repeat: 0 },
  },
  sentinel: {
    idle: { key: "n_idle", frames: 4, rate: 5, repeat: -1 },
    walk: { key: "n_walk", frames: 6, rate: 9, repeat: -1 },
    windup: { key: "n_windup", frames: 4, rate: 9, repeat: 0 },
    strike: { key: "n_strike", frames: 3, rate: 18, repeat: 0 },
    recover: { key: "n_recover", frames: 3, rate: 7, repeat: 0 },
    hurt: { key: "n_hurt", frames: 2, rate: 14, repeat: 0 },
    death: { key: "n_death", frames: 6, rate: 9, repeat: 0 },
  },
} as const;

function buildEnemies(scene: Phaser.Scene) {
  sheet(scene, "c_idle", CW, CH, 4, (ctx, i, n) => drawCrawler(ctx, (i / n) * 6.28, 0, 0, 0));
  sheet(scene, "c_crawl", CW, CH, 6, (ctx, i, n) => drawCrawler(ctx, (i / n) * 6.28, 0, 0, 0));
  sheet(scene, "c_lunge", CW, CH, 4, (ctx, i, n) => drawCrawler(ctx, 0, i / (n - 1), 0, 0));
  sheet(scene, "c_hurt", CW, CH, 2, (ctx) => drawCrawler(ctx, 0, 0, 1, 0));
  sheet(scene, "c_death", CW, CH, 5, (ctx, i, n) => drawCrawler(ctx, 0, 0, 0, i / (n - 1)));

  sheet(scene, "s_float", WW, WH, 6, (ctx, i, n) => drawWisp(ctx, i / n, 0, 0, 0));
  sheet(scene, "s_charge", WW, WH, 4, (ctx, i, n) => drawWisp(ctx, i / n, i / (n - 1), 0, 0));
  sheet(scene, "s_lunge", WW, WH, 3, (ctx, i, n) => drawWisp(ctx, i / n, 1, 0, 0));
  sheet(scene, "s_hurt", WW, WH, 2, (ctx, i) => drawWisp(ctx, i / 2, 0, 1, 0));
  sheet(scene, "s_death", WW, WH, 5, (ctx, i, n) => drawWisp(ctx, i / n, 0, 0, i / (n - 1)));

  sheet(scene, "n_idle", SW, SH, 4, (ctx, i, n) => drawSentinel(ctx, Math.sin((i / n) * 6.28) * 0.2, 0.6, 0, 0));
  sheet(scene, "n_walk", SW, SH, 6, (ctx, i, n) => drawSentinel(ctx, (i / n) * 6.28, 0.5, 0, 0));
  sheet(scene, "n_windup", SW, SH, 4, (ctx, i, n) => drawSentinel(ctx, 0, 0.5 - (i / (n - 1)) * 2.1, 0, 0));
  sheet(scene, "n_strike", SW, SH, 3, (ctx, i, n) => drawSentinel(ctx, 0, -1.6 + (i / (n - 1)) * 2.4, 0, 0));
  sheet(scene, "n_recover", SW, SH, 3, (ctx, i, n) => drawSentinel(ctx, 0, 0.8 - (i / (n - 1)) * 0.2, 0, 0));
  sheet(scene, "n_hurt", SW, SH, 2, (ctx) => drawSentinel(ctx, 0, 0.6, 1, 0));
  sheet(scene, "n_death", SW, SH, 6, (ctx, i, n) => drawSentinel(ctx, 0, 0.6 + i * 0.2, 0, i / (n - 1)));
}

/* ---------------- BOSS: ROOTBOUND GUARDIAN ---------------- */

const BW = 260;
const BH = 240;

function drawBoss(
  ctx: Ctx,
  o: { arm?: number; awake?: number; crouch?: number; phase2?: boolean; hurt?: number; dead?: number; rootT?: number },
) {
  const arm = o.arm ?? 0;
  const awake = o.awake ?? 1;
  const crouch = o.crouch ?? 0;
  const dead = o.dead ?? 0;
  const hurt = o.hurt ?? 0;
  const rootT = o.rootT ?? 0;
  ctx.save();
  ctx.translate(BW / 2, 226);
  ctx.globalAlpha = 1 - dead * 0.35;
  ctx.translate(0, crouch + dead * 40);
  const stone = hurt > 0 ? "#ffffff" : "#5a5f57";
  const dark = hurt > 0 ? "#ffffff" : "#3c4039";

  // trailing roots on ground
  ctx.strokeStyle = "#241c14";
  ctx.lineWidth = 5;
  for (let i = 0; i < 6; i++) {
    const x = -90 + i * 36;
    ctx.beginPath();
    ctx.moveTo(x * 0.4, -10);
    ctx.quadraticCurveTo(x * 0.8, 0 + Math.sin(rootT + i) * 4, x, 2);
    ctx.stroke();
  }

  // legs / base
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(-52, -66, 42, 66, 8);
  ctx.roundRect(12, -60, 44, 60, 8);
  ctx.fill();

  // torso circular stone
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.arc(0, -110, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(0, -110, 58, 0.6, 2.2);
  ctx.fill();

  // chest cracks + core
  const coreR = o.phase2 ? 34 : 24;
  glow(ctx, 0, -110, coreR + 22 * awake, o.phase2 ? "rgba(255,200,110,0.75)" : "rgba(255,179,71,0.5)", awake);
  ctx.fillStyle = PAL.amberBright;
  ctx.beginPath();
  ctx.arc(0, -110, coreR * 0.42 * (0.6 + awake * 0.4), 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,190,110,0.8)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = i * 1.05;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 14, -110 + Math.sin(a) * 14);
    ctx.lineTo(Math.cos(a) * (o.phase2 ? 52 : 40), -110 + Math.sin(a) * (o.phase2 ? 52 : 40));
    ctx.stroke();
  }

  // shoulders / moss
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(-92, -168, 56, 44, 12);
  ctx.roundRect(40, -172, 60, 46, 12);
  ctx.fill();
  ctx.fillStyle = "#3f5340";
  ctx.beginPath();
  ctx.roundRect(-90, -170, 52, 12, 6);
  ctx.roundRect(42, -174, 54, 12, 6);
  ctx.fill();

  // head: broken lantern shrine
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.moveTo(-26, -176);
  ctx.lineTo(26, -180);
  ctx.lineTo(18, -224);
  ctx.lineTo(-14, -220);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#20242a";
  ctx.beginPath();
  ctx.roundRect(-14, -212, 30, 26, 4);
  ctx.fill();
  glow(ctx, 0, -200, 26 * awake + 6, "rgba(255,179,71,0.6)", awake);
  ctx.fillStyle = "#ffcf8d";
  ctx.beginPath();
  ctx.arc(1, -199, 6 * awake + 1, 0, Math.PI * 2);
  ctx.fill();

  // arms (big slabs) - right arm animates
  ctx.save();
  ctx.translate(70, -150);
  ctx.rotate(arm);
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.roundRect(-8, -14, 34, 96, 10);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(-14, 70, 52, 44, 12);
  ctx.fill();
  ctx.strokeStyle = "#241c14";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(26, 40, 10, 90);
  ctx.stroke();
  ctx.restore();

  // left arm static
  ctx.fillStyle = stone;
  ctx.beginPath();
  ctx.roundRect(-96, -158, 32, 92, 10);
  ctx.fill();
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.roundRect(-104, -76, 48, 40, 12);
  ctx.fill();
  ctx.restore();
}

export const BOSS_ANIMS = {
  dormant: { key: "b_dormant", frames: 2, rate: 2, repeat: -1 },
  awaken: { key: "b_awaken", frames: 6, rate: 6, repeat: 0 },
  idle: { key: "b_idle", frames: 4, rate: 5, repeat: -1 },
  move: { key: "b_move", frames: 6, rate: 7, repeat: -1 },
  windup: { key: "b_windup", frames: 4, rate: 7, repeat: 0 },
  slam: { key: "b_slam", frames: 3, rate: 20, repeat: 0 },
  root: { key: "b_root", frames: 4, rate: 8, repeat: 0 },
  hurt: { key: "b_hurt", frames: 2, rate: 14, repeat: 0 },
  death: { key: "b_death", frames: 8, rate: 6, repeat: 0 },
} as const;

function buildBoss(scene: Phaser.Scene) {
  const mk = (key: string, n: number, f: (i: number, n: number) => Parameters<typeof drawBoss>[1], p2 = false) =>
    sheet(scene, key, BW, BH, n, (ctx, i, cnt) => drawBoss(ctx, { ...f(i, cnt), phase2: p2 }));
  mk("b_dormant", 2, (i) => ({ awake: 0.08 + i * 0.03, arm: 0.5, crouch: 16 }));
  mk("b_awaken", 6, (i, n) => ({ awake: i / (n - 1), arm: 0.5 - (i / (n - 1)) * 0.3, crouch: 16 - (i / (n - 1)) * 16 }));
  mk("b_idle", 4, (i, n) => ({ arm: 0.2 + Math.sin((i / n) * 6.28) * 0.08, crouch: Math.sin((i / n) * 6.28) * 3, rootT: i }));
  mk("b_move", 6, (i, n) => ({ arm: 0.2 + Math.sin((i / n) * 6.28) * 0.35, crouch: Math.abs(Math.sin((i / n) * 6.28)) * 6, rootT: i }));
  mk("b_windup", 4, (i, n) => ({ arm: 0.2 - (i / (n - 1)) * 1.9, crouch: -(i / (n - 1)) * 6 }));
  mk("b_slam", 3, (i, n) => ({ arm: -1.7 + (i / (n - 1)) * 3.0, crouch: 6 }));
  mk("b_root", 4, (i, n) => ({ arm: 0.2 - Math.sin((i / (n - 1)) * 3.14) * 1.2, crouch: 4, rootT: i }));
  mk("b_hurt", 2, () => ({ arm: 0.3, hurt: 1 }));
  mk("b_death", 8, (i, n) => ({ arm: 0.4 + (i / (n - 1)) * 0.8, dead: i / (n - 1), awake: 1 - i / (n - 1), crouch: (i / (n - 1)) * 20 }));
}

/* ---------------- WORLD / PROPS / UI ---------------- */

function buildWorld(scene: Phaser.Scene) {
  // ground tile
  single(scene, "tile_ground", 64, 64, (ctx) => {
    const r = rnd(11);
    ctx.fillStyle = PAL.stone;
    ctx.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.05 + r() * 0.18})`;
      ctx.fillRect(r() * 64, r() * 64, 4 + r() * 14, 3 + r() * 10);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, 64, 64);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(64, 2);
    ctx.stroke();
    // roots
    ctx.strokeStyle = "rgba(40,30,20,0.85)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-2, 20);
    ctx.quadraticCurveTo(30, 34, 66, 16);
    ctx.stroke();
    // moss
    ctx.fillStyle = "rgba(104,135,104,0.65)";
    ctx.fillRect(0, 0, 64, 5);
  });

  single(scene, "tile_plat", 64, 28, (ctx) => {
    const r = rnd(23);
    ctx.fillStyle = PAL.stoneLight;
    ctx.fillRect(0, 0, 64, 8);
    ctx.fillStyle = PAL.stoneDark;
    ctx.fillRect(0, 8, 64, 20);
    for (let i = 0; i < 16; i++) {
      ctx.fillStyle = `rgba(0,0,0,${0.1 + r() * 0.2})`;
      ctx.fillRect(r() * 64, 8 + r() * 18, 5 + r() * 10, 3 + r() * 5);
    }
    ctx.fillStyle = "rgba(74,95,74,0.45)";
    ctx.fillRect(0, 0, 64, 3);
  });

  single(scene, "spark", 16, 16, (ctx) => glow(ctx, 8, 8, 8, "rgba(255,255,255,0.95)"));
  single(scene, "amber_dot", 16, 16, (ctx) => glow(ctx, 8, 8, 8, "rgba(255,190,110,0.95)"));
  single(scene, "dust", 16, 16, (ctx) => glow(ctx, 8, 8, 7, "rgba(190,190,200,0.6)"));
  single(scene, "spore", 16, 16, (ctx) => glow(ctx, 8, 8, 7, "rgba(150,220,210,0.8)"));
  single(scene, "stone_bit", 10, 10, (ctx) => {
    ctx.fillStyle = "#4a5048";
    ctx.fillRect(1, 1, 8, 8);
  });

  // thorn hazard
  single(scene, "thorns", 64, 32, (ctx) => {
    for (let i = 0; i < 5; i++) {
      const x = 4 + i * 13;
      ctx.fillStyle = "#7fa9c9";
      ctx.beginPath();
      ctx.moveTo(x, 32);
      ctx.lineTo(x + 6, 4 + (i % 2) * 8);
      ctx.lineTo(x + 12, 32);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(220,245,255,0.6)";
      ctx.beginPath();
      ctx.moveTo(x + 4, 32);
      ctx.lineTo(x + 6, 8);
      ctx.lineTo(x + 8, 32);
      ctx.closePath();
      ctx.fill();
    }
  });

  // shrine (2 frames)
  sheet(scene, "shrine", 96, 128, 4, (ctx, i, n) => {
    const on = i >= 2 ? 1 : 0;
    const fl = Math.sin(i * 2) * 2;
    ctx.fillStyle = "#3f444b";
    ctx.beginPath();
    ctx.roundRect(24, 96, 48, 30, 5);
    ctx.fill();
    ctx.fillStyle = "#2c3037";
    ctx.beginPath();
    ctx.roundRect(34, 56, 28, 44, 4);
    ctx.fill();
    ctx.strokeStyle = "#20242a";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(48, 56);
    ctx.lineTo(48, 34);
    ctx.quadraticCurveTo(48, 26, 62, 26);
    ctx.stroke();
    // lantern
    ctx.fillStyle = "#41474f";
    ctx.beginPath();
    ctx.roundRect(52, 30 + fl, 20, 26, 4);
    ctx.fill();
    if (on) {
      glow(ctx, 62, 43 + fl, 40, "rgba(255,179,71,0.75)");
      ctx.fillStyle = PAL.amberBright;
      ctx.beginPath();
      ctx.ellipse(62, 43 + fl, 5, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      glow(ctx, 48, 104, 46, "rgba(255,179,71,0.28)");
    } else {
      ctx.fillStyle = "#2a2e34";
      ctx.beginPath();
      ctx.ellipse(62, 43, 4, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    void n;
  });

  // props
  single(scene, "prop_mushroom", 64, 48, (ctx) => {
    for (let i = 0; i < 3; i++) {
      const x = 12 + i * 18;
      const h = 16 + i * 6;
      ctx.fillStyle = "#3c4a50";
      ctx.fillRect(x - 2, 48 - h, 4, h);
      glow(ctx, x, 48 - h, 16, "rgba(143,216,210,0.5)");
      ctx.fillStyle = "#7fd0c8";
      ctx.beginPath();
      ctx.ellipse(x, 48 - h, 9, 6, 0, Math.PI, 0);
      ctx.fill();
    }
  });
  single(scene, "prop_crystal", 72, 88, (ctx) => {
    glow(ctx, 36, 60, 40, "rgba(130,190,220,0.25)");
    const pts = [
      [36, 6, 14],
      [18, 34, 10],
      [54, 40, 8],
    ];
    pts.forEach(([x = 0, y = 0, w = 0]) => {
      ctx.fillStyle = "#5d7f96";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, 88);
      ctx.lineTo(x - w, 88);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "rgba(190,225,240,0.45)";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.35, 88);
      ctx.lineTo(x - w * 0.1, 88);
      ctx.closePath();
      ctx.fill();
    });
  });
  single(scene, "prop_lantern_post", 56, 160, (ctx) => {
    ctx.fillStyle = "#2b3037";
    ctx.fillRect(24, 20, 8, 140);
    ctx.strokeStyle = "#2b3037";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(28, 22);
    ctx.quadraticCurveTo(28, 8, 44, 10);
    ctx.stroke();
    ctx.fillStyle = "#3a4048";
    ctx.beginPath();
    ctx.roundRect(36, 12, 18, 22, 3);
    ctx.fill();
    glow(ctx, 45, 24, 30, "rgba(255,179,71,0.45)");
    ctx.fillStyle = "#ffd89b";
    ctx.beginPath();
    ctx.ellipse(45, 24, 4, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  single(scene, "prop_gear", 96, 96, (ctx) => {
    ctx.fillStyle = "#343a41";
    ctx.beginPath();
    ctx.arc(48, 48, 36, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ctx.save();
      ctx.translate(48 + Math.cos(a) * 40, 48 + Math.sin(a) * 40);
      ctx.rotate(a);
      ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    }
    ctx.fillStyle = "#1d2127";
    ctx.beginPath();
    ctx.arc(48, 48, 13, 0, Math.PI * 2);
    ctx.fill();
  });
  single(scene, "prop_statue", 90, 170, (ctx) => {
    ctx.fillStyle = "#40474a";
    ctx.beginPath();
    ctx.roundRect(20, 130, 50, 40, 4);
    ctx.roundRect(30, 50, 32, 84, 6);
    ctx.fill();
    ctx.fillStyle = "#4b5356";
    ctx.beginPath();
    ctx.moveTo(30, 60);
    ctx.lineTo(62, 52);
    ctx.lineTo(58, 30);
    ctx.lineTo(34, 34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#241c14";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(24, 168);
    ctx.quadraticCurveTo(46, 120, 34, 44);
    ctx.stroke();
  });
  single(scene, "root_spike", 40, 96, (ctx) => {
    ctx.fillStyle = "#2f2418";
    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.quadraticCurveTo(34, 50, 32, 96);
    ctx.lineTo(8, 96);
    ctx.quadraticCurveTo(8, 50, 20, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#453522";
    ctx.beginPath();
    ctx.moveTo(20, 6);
    ctx.quadraticCurveTo(26, 50, 24, 96);
    ctx.lineTo(16, 96);
    ctx.quadraticCurveTo(16, 50, 20, 6);
    ctx.closePath();
    ctx.fill();
  });
  single(scene, "debris_rock", 56, 56, (ctx) => {
    ctx.fillStyle = "#4a5048";
    ctx.beginPath();
    ctx.moveTo(6, 30);
    ctx.lineTo(20, 6);
    ctx.lineTo(48, 12);
    ctx.lineTo(52, 40);
    ctx.lineTo(28, 52);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.beginPath();
    ctx.moveTo(20, 8);
    ctx.lineTo(46, 14);
    ctx.lineTo(30, 26);
    ctx.closePath();
    ctx.fill();
  });
  single(scene, "portal", 160, 220, (ctx) => {
    glow(ctx, 80, 120, 100, "rgba(255,190,110,0.35)");
    ctx.strokeStyle = "#4a5048";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(20, 220);
    ctx.lineTo(20, 90);
    ctx.quadraticCurveTo(80, 10, 140, 90);
    ctx.lineTo(140, 220);
    ctx.stroke();
    const g = ctx.createLinearGradient(0, 220, 0, 40);
    g.addColorStop(0, "rgba(255,179,71,0.15)");
    g.addColorStop(1, "rgba(255,216,155,0.65)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(26, 220);
    ctx.lineTo(26, 92);
    ctx.quadraticCurveTo(80, 22, 134, 92);
    ctx.lineTo(134, 220);
    ctx.closePath();
    ctx.fill();
  });

  // parallax layers
  const W = 1280;
  const H = 720;
  single(scene, "bg_far", W, H, (ctx) => {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#141a26");
    g.addColorStop(0.6, "#1b2230");
    g.addColorStop(1, "#26303f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    const r = rnd(3);
    for (let i = 0; i < 5; i++) {
      const x = i * 280 + 60;
      ctx.fillStyle = "#1c2431";
      ctx.beginPath();
      ctx.moveTo(x - 100, H);
      ctx.lineTo(x - 100, 320);
      ctx.quadraticCurveTo(x, 140, x + 100, 320);
      ctx.lineTo(x + 100, H);
      ctx.closePath();
      ctx.fill();
      glow(ctx, x, 300, 160, "rgba(110,150,190,0.16)");
      void r;
    }
  });
  single(scene, "bg_mid", W, H, (ctx) => {
    const r = rnd(5);
    for (let i = 0; i < 9; i++) {
      const x = i * 150 + 20;
      ctx.fillStyle = "rgba(40,48,64,0.95)";
      ctx.fillRect(x, 260 + r() * 80, 46, H);
      ctx.fillStyle = "rgba(50,58,76,0.9)";
      ctx.fillRect(x - 14, 250 + r() * 60, 74, 22);
    }
    ctx.strokeStyle = "rgba(34,28,20,0.9)";
    ctx.lineWidth = 6;
    for (let i = 0; i < 14; i++) {
      const x = r() * W;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.quadraticCurveTo(x + 40, 120, x - 20, 260 + r() * 120);
      ctx.stroke();
    }
  });
  single(scene, "bg_near", W, H, (ctx) => {
    const r = rnd(9);
    for (let i = 0; i < 6; i++) {
      const x = i * 230 + 40;
      ctx.fillStyle = "rgba(52,60,76,0.95)";
      ctx.fillRect(x, 180, 66, H);
      ctx.fillStyle = "rgba(64,72,90,0.95)";
      ctx.fillRect(x - 10, 168, 86, 24);
      glow(ctx, x + 33, 240 + r() * 200, 90, "rgba(255,179,71,0.20)");
    }
    for (let i = 0; i < 22; i++) {
      glow(ctx, r() * W, 380 + r() * 300, 26, "rgba(143,216,210,0.30)");
    }
  });
  single(scene, "fg_layer", W, H, (ctx) => {
    const r = rnd(17);
    ctx.strokeStyle = "rgba(14,16,22,0.9)";
    ctx.lineWidth = 20;
    for (let i = 0; i < 5; i++) {
      const x = r() * W;
      ctx.beginPath();
      ctx.moveTo(x, -20);
      ctx.quadraticCurveTo(x + 90, 120, x - 40, 300);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(12,14,20,0.92)";
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, H - 60);
    ctx.quadraticCurveTo(160, H - 120, 320, H);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(W, H);
    ctx.lineTo(W, H - 80);
    ctx.quadraticCurveTo(W - 180, H - 130, W - 340, H);
    ctx.closePath();
    ctx.fill();
  });
}

/* ---------------- PICKUPS & SPELLS ---------------- */

function buildItems(scene: Phaser.Scene) {
  // life shard — amber crystal heart
  sheet(scene, "pickup_life", 32, 32, 4, (ctx, i, n) => {
    const t = i / n;
    const s = 1 + Math.sin(t * Math.PI * 2) * 0.08;
    ctx.save();
    ctx.translate(16, 16);
    ctx.scale(s, s);
    glow(ctx, 0, 0, 14, "rgba(255,179,71,0.55)");
    ctx.fillStyle = PAL.amber;
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, -1);
    ctx.lineTo(0, 9);
    ctx.lineTo(-6, -1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = PAL.amberBright;
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(3, -1);
    ctx.lineTo(0, 5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
  // soul mote — teal wisp
  sheet(scene, "pickup_soul", 32, 32, 4, (ctx, i, n) => {
    const t = i / n;
    ctx.save();
    ctx.translate(16, 16 + Math.sin(t * Math.PI * 2) * 1.5);
    glow(ctx, 0, 0, 13, "rgba(143,216,210,0.55)");
    ctx.fillStyle = PAL.fungus;
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(242,233,216,0.9)";
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
  // spirit blast projectile
  single(scene, "spell_orb", 48, 32, (ctx) => {
    glow(ctx, 24, 16, 22, "rgba(143,216,210,0.55)");
    ctx.fillStyle = "rgba(242,233,216,0.95)";
    ctx.beginPath();
    ctx.ellipse(24, 16, 13, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(111,179,173,0.9)";
    ctx.beginPath();
    ctx.ellipse(18, 16, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ---------------- HUD / UI ORNAMENT ASSETS ---------------- */

function lanternShell(ctx: Ctx, lit: boolean) {
  const cx = 24;
  const cy = 28;
  if (lit) glow(ctx, cx, cy, 21, "rgba(255,179,71,0.5)");
  // hanger ring
  ctx.strokeStyle = lit ? "#8a6a3a" : "#3a3f4c";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, 7, 4, Math.PI * 0.15, Math.PI * 0.85, true);
  ctx.stroke();
  // cap
  ctx.fillStyle = lit ? "#5b4526" : "#2b2f3a";
  ctx.beginPath();
  ctx.moveTo(cx - 10, 15);
  ctx.lineTo(cx + 10, 15);
  ctx.lineTo(cx + 6, 11);
  ctx.lineTo(cx - 6, 11);
  ctx.closePath();
  ctx.fill();
  // glass body
  ctx.beginPath();
  ctx.moveTo(cx - 9, 16);
  ctx.quadraticCurveTo(cx - 12, 28, cx - 7, 38);
  ctx.lineTo(cx + 7, 38);
  ctx.quadraticCurveTo(cx + 12, 28, cx + 9, 16);
  ctx.closePath();
  ctx.fillStyle = lit ? "rgba(255,196,110,0.30)" : "rgba(80,90,110,0.14)";
  ctx.fill();
  ctx.strokeStyle = lit ? "#c9964a" : "#39404f";
  ctx.lineWidth = 2;
  ctx.stroke();
  // base
  ctx.fillStyle = lit ? "#5b4526" : "#2b2f3a";
  ctx.beginPath();
  ctx.roundRect(cx - 9, 37, 18, 5, 2);
  ctx.fill();
  if (lit) {
    // flame core
    glow(ctx, cx, cy + 1, 10, "rgba(255,225,160,0.95)", 0.85);
    ctx.fillStyle = "#ffe9c4";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 3.2, 5.2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function buildHud(scene: Phaser.Scene) {
  single(scene, "hud_lantern_on", 48, 48, (ctx) => lanternShell(ctx, true));
  single(scene, "hud_lantern_off", 48, 48, (ctx) => lanternShell(ctx, false));

  // ember currency glyph
  single(scene, "hud_ember", 28, 28, (ctx) => {
    glow(ctx, 14, 14, 12, "rgba(255,179,71,0.6)");
    ctx.fillStyle = PAL.amber;
    ctx.beginPath();
    ctx.arc(14, 14, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff3d8";
    ctx.beginPath();
    ctx.arc(12.6, 12.6, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // warden emblem portrait ring
  single(scene, "hud_emblem", 60, 60, (ctx) => {
    ctx.fillStyle = "rgba(12,14,20,0.92)";
    ctx.beginPath();
    ctx.arc(30, 30, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8a6a3a";
    ctx.lineWidth = 2;
    ctx.stroke();
    // hooded silhouette
    ctx.fillStyle = "#232833";
    ctx.beginPath();
    ctx.moveTo(30, 12);
    ctx.quadraticCurveTo(45, 22, 43, 48);
    ctx.lineTo(17, 48);
    ctx.quadraticCurveTo(15, 22, 30, 12);
    ctx.closePath();
    ctx.fill();
    glow(ctx, 30, 30, 9, "rgba(255,179,71,0.55)");
    ctx.fillStyle = "#ffd89b";
    ctx.beginPath();
    ctx.ellipse(25.5, 29, 2.6, 2, -0.2, 0, Math.PI * 2);
    ctx.ellipse(34.5, 29, 2.6, 2, 0.2, 0, Math.PI * 2);
    ctx.fill();
  });

  // ornate boss bar frame (root / stone)
  single(scene, "boss_frame", 760, 64, (ctx) => {
    const w = 760;
    const midY = 34;
    ctx.strokeStyle = "#2a2018";
    ctx.lineCap = "round";
    // gnarled roots along both sides
    for (let s = -1; s <= 1; s += 2) {
      for (let k = 0; k < 5; k++) {
        ctx.beginPath();
        ctx.lineWidth = 5 - k * 0.7;
        const x0 = w / 2 + s * (90 + k * 14);
        ctx.moveTo(x0, midY);
        ctx.quadraticCurveTo(x0 + s * 90, midY - 18 - k * 4, x0 + s * (200 + k * 30), midY + (k % 2 ? 12 : -14));
        ctx.stroke();
      }
    }
    // stone rail
    ctx.fillStyle = "#1a1d26";
    ctx.beginPath();
    ctx.roundRect(90, midY - 13, w - 180, 26, 7);
    ctx.fill();
    ctx.strokeStyle = "#6a5330";
    ctx.lineWidth = 1.6;
    ctx.stroke();
    // centre lantern emblem
    glow(ctx, w / 2, midY, 16, "rgba(255,179,71,0.35)");
  });

  // boss bar end cap emblem
  single(scene, "boss_emblem", 44, 56, (ctx) => {
    glow(ctx, 22, 28, 18, "rgba(255,179,71,0.4)");
    ctx.fillStyle = "#1a1d26";
    ctx.beginPath();
    ctx.moveTo(22, 4);
    ctx.lineTo(38, 24);
    ctx.lineTo(22, 52);
    ctx.lineTo(6, 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#c9964a";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#ffd89b";
    ctx.beginPath();
    ctx.ellipse(22, 26, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function buildAllTextures(scene: Phaser.Scene) {
  buildPlayer(scene);
  buildEnemies(scene);
  buildBoss(scene);
  buildWorld(scene);
  buildItems(scene);
  buildHud(scene);
}


export const ITEM_ANIMS = {
  life: { key: "pickup_life", frames: 4, rate: 8, repeat: -1 },
  soul: { key: "pickup_soul", frames: 4, rate: 8, repeat: -1 },
} satisfies Record<string, AnimSpec>;


export function registerAnims(scene: Phaser.Scene) {
  const add = (key: string, spec: AnimSpec) => {
    if (scene.anims.exists(key)) return;
    scene.anims.create({
      key,
      frames: scene.anims.generateFrameNumbers(spec.key, { start: 0, end: spec.frames - 1 }),
      frameRate: spec.rate,
      repeat: spec.repeat,
    });
  };
  Object.values(PLAYER_ANIMS).forEach((s) => add(s.key, s));
  Object.values(ENEMY_ANIMS).forEach((grp) =>
    Object.values(grp as Record<string, AnimSpec>).forEach((s) => add(s.key, s)),
  );
  Object.values(BOSS_ANIMS).forEach((s) => add(s.key, s as AnimSpec));
  Object.values(ITEM_ANIMS).forEach((s) => add(s.key, s));

}
