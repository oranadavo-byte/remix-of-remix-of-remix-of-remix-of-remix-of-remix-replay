import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { buildAllTextures, registerAnims } from "../textures";

/** Loading scene: forges every procedural texture in steps while an animated sigil spins. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  create() {
    const cx = GAME_W / 2;
    const cy = GAME_H / 2;

    this.add
      .text(cx, cy - 120, "NOCTILUME", {
        fontFamily: "monospace",
        fontSize: "54px",
        color: "#ffd89b",
      })
      .setOrigin(0.5)
      .setAlpha(0.9);

    // spinning lantern sigil
    const ring = this.add.graphics({ x: cx, y: cy - 6 });
    ring.lineStyle(3, 0xffb347, 0.85).strokeCircle(0, 0, 34);
    ring.lineStyle(2, 0x6fb3ad, 0.6).strokeCircle(0, 0, 22);
    ring.fillStyle(0xffd89b, 1).fillCircle(0, -34, 4);
    ring.fillStyle(0x8fd8d2, 1).fillCircle(0, 22, 3);
    this.tweens.add({ targets: ring, angle: 360, duration: 2600, repeat: -1 });
    const core = this.add
      .text(cx, cy - 6, "·", { fontFamily: "monospace", fontSize: "34px", color: "#ffd89b" })
      .setOrigin(0.5);
    this.tweens.add({ targets: core, alpha: { from: 0.3, to: 1 }, duration: 700, yoyo: true, repeat: -1 });

    const barW = 420;
    const barX = cx - barW / 2;
    const barY = cy + 78;
    this.add
      .graphics()
      .fillStyle(0x11141c, 0.9)
      .fillRoundedRect(barX - 4, barY - 4, barW + 8, 18, 9)
      .lineStyle(1, 0xffb347, 0.35)
      .strokeRoundedRect(barX - 4, barY - 4, barW + 8, 18, 9);
    const fill = this.add.graphics();
    const label = this.add
      .text(cx, barY + 40, "waking the deep roots…", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#a89bc4",
      })
      .setOrigin(0.5);

    const steps: Array<[string, () => void]> = [
      ["carving the warden's mask…", () => buildAllTextures(this)],
      ["binding movement to bone…", () => registerAnims(this)],
      ["hanging lanterns in the dark…", () => undefined],
      ["listening for the guardian…", () => undefined],
    ];

    let i = 0;
    const run = () => {
      const step = steps[i];
      if (!step) {
        label.setText("ready");
        this.time.delayedCall(260, () => {
          this.cameras.main.fadeOut(320);
          this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Menu"));
        });
        return;
      }
      label.setText(step[0]);
      step[1]();
      i++;
      const pct = i / steps.length;
      fill.clear().fillStyle(0xffb347, 1).fillRoundedRect(barX, barY, barW * pct, 10, 5);
      fill.fillStyle(0xffd89b, 0.4).fillRoundedRect(barX, barY, barW * pct, 4, 2);
      this.time.delayedCall(220, run);
    };
    this.time.delayedCall(240, run);
    this.cameras.main.fadeIn(300);
  }
}
