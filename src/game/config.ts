export const DEBUG = false;

export const GAME_W = 1280;
export const GAME_H = 720;

export const PAL = {
  charcoal: "#333744",
  cloak: "#414a63",
  cloakDark: "#2a3040",
  indigo: "#525a78",
  amber: "#ffb347",
  amberBright: "#ffd89b",
  ivory: "#e8e2d4",
  stone: "#525a63",
  stoneDark: "#333941",
  stoneLight: "#737c88",
  moss: "#4a5f4a",
  root: "#2a2018",
  fungus: "#8fd8d2",
  lavender: "#a89bc4",
  teal: "#6fb3ad",
  cream: "#f2e9d8",
  bgFar: "#0c0e14",
  bgMid: "#14171f",
  bgNear: "#1b1f29",
};

export const TUNE = {
  maxSpeed: 270,
  accel: 2400,
  decel: 2600,
  airAccel: 1700,
  gravity: 1750,
  jumpVel: 790,
  jumpHoldGravityMult: 0.58,
  airJumpVel: 700,
  jumpCutMultiplier: 0.42,
  terminalVel: 950,
  coyoteMs: 120,
  jumpBufferMs: 150,

  dashSpeed: 640,
  dashDurationMs: 180,
  dashCooldownMs: 340,


  attackStartupMs: 70,
  attackActiveMs: 110,
  attackRecoverMs: 130,
  comboWindowMs: 420,

  playerMaxHp: 5,
  invulnMs: 900,
  hitStopMs: 55,
};

export const DEPTH = {
  bg0: -50,
  bg1: -40,
  bg2: -30,
  bg3: -20,
  props: -10,
  terrain: 0,
  entities: 10,
  player: 12,
  fx: 20,
  fg: 30,
  ui: 100,
};
