import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { sfx } from "../audio";

interface VictoryData {
  timeMs: number;
  kills: number;
  deaths: number;
}

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super("Victory");
  }

  create(data: VictoryData) {
    this.add.image(0, 0, "bg_far").setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H);
    this.add.image(0, 0, "bg_near").setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H).setAlpha(0.5);

    const em = this.add.particles(GAME_W / 2, GAME_H + 20, "amber_dot", {
      x: { min: 0, max: GAME_W },
      speedY: { min: -60, max: -20 },
      lifespan: 6000,
      scale: { start: 0.5, end: 0 },
      frequency: 90,
      alpha: { start: 0.8, end: 0 },
    });
    em.setDepth(1);

    this.add
      .text(GAME_W / 2, 200, "THE DARK RECEDES", {
        fontFamily: "monospace",
        fontSize: "62px",
        color: "#ffd89b",
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, 268, "The Rootbound Guardian sleeps. The lantern burns on.", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#a89bc4",
      })
      .setOrigin(0.5);

    const mins = Math.floor(data.timeMs / 60000);
    const secs = Math.floor((data.timeMs % 60000) / 1000);
    const lines = [
      `TIME     ${mins}:${String(secs).padStart(2, "0")}`,
      `FELLED   ${data.kills}`,
      `FALLS    ${data.deaths}`,
    ];
    lines.forEach((l, i) => {
      this.add
        .text(GAME_W / 2, 380 + i * 42, l, { fontFamily: "monospace", fontSize: "24px", color: "#e8e2d4" })
        .setOrigin(0.5);
    });

    const again = this.add
      .text(GAME_W / 2, GAME_H - 140, "PRESS  ENTER  TO  PLAY  AGAIN", {
        fontFamily: "monospace",
        fontSize: "24px",
        color: "#6fb3ad",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    this.tweens.add({ targets: again, alpha: { from: 0.4, to: 1 }, duration: 1100, yoyo: true, repeat: -1 });

    const restart = () => {
      sfx("ui");
      this.scene.start("Menu");
    };
    this.input.keyboard?.on("keydown-ENTER", restart);
    again.on("pointerdown", restart);
    this.cameras.main.fadeIn(900);
  }
}
