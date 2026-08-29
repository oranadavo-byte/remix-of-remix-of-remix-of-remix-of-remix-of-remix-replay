import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { panel, textButton, FONT } from "../ui/kit";
import { formatPlayTime, getSave } from "../save";

export class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "Pause" });
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05070c, 0.72).setOrigin(0, 0);

    const w = 520;
    const h = 430;
    const p = panel(this, GAME_W / 2, GAME_H / 2, w, h, "PAUSED");

    const save = getSave();
    const stats = [
      `masks ${save.maxHp}`,
      `soul ${save.soul}`,
      `embers ${save.points}`,
      `felled ${save.kills}`,
      `time ${formatPlayTime(save.playMs)}`,
    ].join("   ·   ");
    p.add(
      this.add
        .text(0, -h / 2 + 82, stats, { fontFamily: FONT, fontSize: "14px", color: "#6fb3ad" })
        .setOrigin(0.5),
    );

    const items: Array<[string, () => void]> = [
      ["RESUME", () => this.resume()],
      ["SKILL TREE", () => this.openOverlay("Skills")],
      ["SETTINGS", () => this.openOverlay("Settings")],
      ["SAVE & RETURN TO TITLE", () => this.quit()],
    ];
    const buttons: Phaser.GameObjects.Text[] = [];
    items.forEach(([label, fn], i) => {
      const b = textButton(this, 0, -66 + i * 52, label, fn, { size: i === 0 ? 24 : 19 });
      p.add(b);
      buttons.push(b);
    });

    let selected = 0;
    const highlight = (idx: number) => {
      buttons.forEach((b, i) => b.setColor(i === idx ? "#ffd89b" : i === 0 ? "#e8e2d4" : "#6fb3ad"));
    };
    highlight(0);
    this.input.keyboard?.on("keydown-UP", () => {
      selected = (selected - 1 + buttons.length) % buttons.length;
      highlight(selected);
    });
    this.input.keyboard?.on("keydown-DOWN", () => {
      selected = (selected + 1) % buttons.length;
      highlight(selected);
    });
    this.input.keyboard?.on("keydown-ENTER", () => items[selected]?.[1]());
    this.input.keyboard?.on("keydown-SPACE", () => items[selected]?.[1]());
    buttons.forEach((b, i) => {
      b.on("pointerover", () => {
        selected = i;
        highlight(i);
      });
    });

    p.add(
      this.add
        .text(0, h / 2 - 34, "progress saves automatically at shrines and on quit", {
          fontFamily: FONT,
          fontSize: "13px",
          color: "#525a78",
        })
        .setOrigin(0.5),
    );

    p.setScale(0.94).setAlpha(0);
    this.tweens.add({ targets: p, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });

    this.input.keyboard?.on("keydown-ESC", () => this.resume());
    this.input.keyboard?.on("keydown-P", () => this.resume());
  }

  private openOverlay(key: string) {
    this.scene.launch(key, { from: "Pause" });
    this.scene.pause();
  }

  private resume() {
    const game = this.scene.get("Game") as Phaser.Scene & { setPaused?: (v: boolean) => void };
    this.scene.stop();
    game.setPaused?.(false);
  }

  private quit() {
    const game = this.scene.get("Game") as Phaser.Scene & { persist?: () => void };
    game.persist?.();
    this.scene.stop();
    this.scene.stop("UI");
    this.scene.stop("Game");
    this.scene.start("Menu");
  }
}
