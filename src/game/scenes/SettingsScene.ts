import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { FONT, panel, slider, textButton } from "../ui/kit";
import { getSettings, saveSettings, clearSave } from "../save";
import { applyVolumes } from "../audio";

export class SettingsScene extends Phaser.Scene {
  private from = "Menu";

  constructor() {
    super({ key: "Settings" });
  }

  init(data: { from?: string }) {
    this.from = data?.from ?? "Menu";
  }

  create() {
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05070c, 0.8).setOrigin(0, 0);
    const w = 560;
    const h = 480;
    const p = panel(this, GAME_W / 2, GAME_H / 2, w, h, "SETTINGS");
    const s = getSettings();
    const left = -w / 2 + 60;
    const barW = w - 120;

    p.add(
      slider(this, left, -h / 2 + 120, barW, "master volume", s.master, (v) => {
        saveSettings({ master: v });
        applyVolumes();
      }),
    );
    p.add(
      slider(this, left, -h / 2 + 190, barW, "music", s.music, (v) => {
        saveSettings({ music: v });
        applyVolumes();
      }),
    );
    p.add(
      slider(this, left, -h / 2 + 260, barW, "sound effects", s.sfx, (v) => {
        saveSettings({ sfx: v });
        applyVolumes();
      }),
    );
    p.add(
      slider(this, left, -h / 2 + 330, barW, "screen shake", s.screenShake, (v) => {
        saveSettings({ screenShake: v });
      }),
    );

    const wipe = this.add
      .text(0, h / 2 - 96, "ERASE SAVED PROGRESS", { fontFamily: FONT, fontSize: "16px", color: "#a89bc4" })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    let armed = false;
    wipe.on("pointerdown", () => {
      if (!armed) {
        armed = true;
        wipe.setText("CLICK AGAIN TO CONFIRM").setColor("#ffb347");
        return;
      }
      clearSave();
      wipe.setText("PROGRESS ERASED").setColor("#6fb3ad");
      armed = false;
    });
    p.add(wipe);

    p.add(textButton(this, 0, h / 2 - 46, "CLOSE", () => this.close(), { size: 20 }));
    p.setScale(0.95).setAlpha(0);
    this.tweens.add({ targets: p, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.input.keyboard?.on("keydown-ESC", () => this.close());
  }

  private close() {
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
