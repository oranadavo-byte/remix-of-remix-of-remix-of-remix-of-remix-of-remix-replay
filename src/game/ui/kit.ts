import * as Phaser from "phaser";
import { sfx } from "../audio";

export const FONT = "monospace";

export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  title?: string,
) {
  const g = scene.add
    .graphics()
    .fillStyle(0x0b0d13, 0.95)
    .fillRoundedRect(-w / 2, -h / 2, w, h, 18)
    .lineStyle(1, 0xffb347, 0.45)
    .strokeRoundedRect(-w / 2, -h / 2, w, h, 18);
  const kids: Phaser.GameObjects.GameObject[] = [g];
  if (title) {
    kids.push(
      scene.add
        .text(0, -h / 2 + 30, title, { fontFamily: FONT, fontSize: "22px", color: "#ffd89b" })
        .setOrigin(0.5),
    );
    const rule = scene.add.graphics();
    rule.lineStyle(1, 0xffb347, 0.3).lineBetween(-w / 2 + 28, -h / 2 + 52, w / 2 - 28, -h / 2 + 52);
    kids.push(rule);
  }
  return scene.add.container(x, y, kids);
}

export function textButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: { size?: number; color?: string; hover?: string; origin?: number } = {},
) {
  const color = opts.color ?? "#e8e2d4";
  const hover = opts.hover ?? "#ffd89b";
  const t = scene.add
    .text(x, y, label, { fontFamily: FONT, fontSize: `${opts.size ?? 20}px`, color })
    .setOrigin(opts.origin ?? 0.5, 0.5)
    .setInteractive({ useHandCursor: true });
  t.on("pointerover", () => {
    t.setColor(hover);
    sfx("ui");
  });
  t.on("pointerout", () => t.setColor(color));
  t.on("pointerdown", () => {
    sfx("ui");
    onClick();
  });
  return t;
}

/** Draggable horizontal volume slider returning its container. */
export function slider(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  label: string,
  value: number,
  onChange: (v: number) => void,
) {
  const c = scene.add.container(x, y);
  const name = scene.add
    .text(0, -18, label, { fontFamily: FONT, fontSize: "15px", color: "#a89bc4" })
    .setOrigin(0, 0.5);
  const readout = scene.add
    .text(w, -18, `${Math.round(value * 100)}%`, { fontFamily: FONT, fontSize: "15px", color: "#6fb3ad" })
    .setOrigin(1, 0.5);
  const bar = scene.add.graphics();
  let v = value;

  const draw = () => {
    bar.clear();
    bar.fillStyle(0x22242c, 1).fillRoundedRect(0, 4, w, 10, 5);
    bar.fillStyle(0xffb347, 1).fillRoundedRect(0, 4, Math.max(10, w * v), 10, 5);
    bar.fillStyle(0xffe9c4, 1).fillCircle(w * v, 9, 9);
    bar.lineStyle(1, 0x0b0d13, 1).strokeCircle(w * v, 9, 9);
    readout.setText(`${Math.round(v * 100)}%`);
  };
  draw();

  const zone = scene.add.zone(0, 9, w, 34).setOrigin(0, 0.5).setInteractive({ useHandCursor: true, draggable: true });
  const set = (px: number) => {
    v = Phaser.Math.Clamp(px / w, 0, 1);
    draw();
    onChange(v);
  };
  zone.on("pointerdown", (p: Phaser.Input.Pointer) => set(p.x - c.x));
  zone.on("drag", (p: Phaser.Input.Pointer) => set(p.x - c.x));
  scene.input.setDraggable(zone);

  c.add([name, readout, bar, zone]);
  return c;
}
