import * as Phaser from "phaser";
import { GAME_W, TUNE } from "../config";
import { getSave } from "../save";

export class UIScene extends Phaser.Scene {
  private hearts: Phaser.GameObjects.Graphics[] = [];
  private dashBar!: Phaser.GameObjects.Graphics;
  private bossBarBg!: Phaser.GameObjects.Graphics;
  private bossBar!: Phaser.GameObjects.Graphics;
  private bossLabel!: Phaser.GameObjects.Text;
  private bossPct = 1;
  private bossVisible = false;
  private toast!: Phaser.GameObjects.Text;
  private phase2 = false;
  private soulRing!: Phaser.GameObjects.Graphics;
  private soulText!: Phaser.GameObjects.Text;
  private focusRing!: Phaser.GameObjects.Graphics;
  private emberText!: Phaser.GameObjects.Text;
  private soul = 0;
  private maxSoul = 99;
  private focus = 0;
  private maxHp = TUNE.playerMaxHp;

  constructor() {
    super({ key: "UI", active: false });
  }

  create() {
    const game = this.scene.get("Game") as Phaser.Scene & { player: { dashCooldownPct: number } };

    // HUD backdrop
    this.add
      .graphics()
      .fillStyle(0x0c0e14, 0.55)
      .fillRoundedRect(14, 12, 260, 110, 12)
      .lineStyle(1, 0xffb347, 0.25)
      .strokeRoundedRect(14, 12, 260, 110, 12);

    this.maxHp = Math.max(TUNE.playerMaxHp, getSave().maxHp);
    for (let i = 0; i < this.maxHp; i++) {
      const g = this.add.graphics({ x: 32 + i * 34, y: 34 });
      this.hearts.push(g);
    }
    this.drawHearts(TUNE.playerMaxHp);

    this.add
      .text(32, 64, "LANTERN · DASH", { fontFamily: "monospace", fontSize: "11px", color: "#a89bc4" })
      .setAlpha(0.9);
    this.dashBar = this.add.graphics();

    // soul vessel + focus ring
    this.soulRing = this.add.graphics({ x: 232, y: 56 });
    this.focusRing = this.add.graphics({ x: 232, y: 56 });
    this.soulText = this.add
      .text(232, 56, "0", { fontFamily: "monospace", fontSize: "13px", color: "#8fd8d2" })
      .setOrigin(0.5);
    this.emberText = this.add
      .text(32, 100, "", { fontFamily: "monospace", fontSize: "11px", color: "#ffd89b" })
      .setAlpha(0.9);
    this.drawSoul();

    this.bossBarBg = this.add.graphics().setVisible(false);
    this.bossBar = this.add.graphics().setVisible(false);
    this.bossLabel = this.add
      .text(GAME_W / 2, 616, "THE ROOTBOUND GUARDIAN", {
        fontFamily: "monospace",
        fontSize: "16px",
        color: "#e8e2d4",
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.toast = this.add
      .text(GAME_W / 2, 160, "", { fontFamily: "monospace", fontSize: "20px", color: "#ffd89b" })
      .setOrigin(0.5)
      .setAlpha(0);

    game.events.on("hp", (hp: number) => this.drawHearts(hp));
    game.events.on("soul", (soul: number, max: number) => {
      this.soul = soul;
      this.maxSoul = max;
      this.drawSoul();
    });
    game.events.on("focus", (pct: number) => {
      this.focus = pct;
      this.drawSoul();
    });
    this.game.events.on("boss-show", () => this.showBoss(true));
    this.game.events.on("boss-hide", () => this.showBoss(false));
    this.game.events.on("boss-hp", (p: number) => (this.bossPct = p));
    this.game.events.on("boss-phase", () => {
      this.phase2 = true;
      this.bossLabel.setText("THE ROOTBOUND GUARDIAN · AWAKENED");
    });
    this.game.events.on("toast", (msg: string) => this.showToast(msg));

    this.events.on("shutdown", () => {
      this.game.events.off("boss-show");
      this.game.events.off("boss-hide");
      this.game.events.off("boss-hp");
      this.game.events.off("boss-phase");
      this.game.events.off("toast");
    });
  }

  private showToast(msg: string) {
    this.toast.setText(msg).setAlpha(0);
    this.tweens.add({ targets: this.toast, alpha: 1, duration: 400, yoyo: true, hold: 1600 });
  }

  private showBoss(v: boolean) {
    this.bossVisible = v;
    if (v) {
      this.bossPct = 1;
      this.phase2 = false;
      this.bossLabel.setText("THE ROOTBOUND GUARDIAN");
    }
    this.bossBarBg.setVisible(v);
    this.bossBar.setVisible(v);
    this.bossLabel.setVisible(v);
  }

  private drawSoul() {
    const pct = Phaser.Math.Clamp(this.soul / this.maxSoul, 0, 1);
    this.soulRing.clear();
    this.soulRing.fillStyle(0x11141c, 0.9).fillCircle(0, 0, 22);
    this.soulRing.lineStyle(3, 0x2c2f3d, 1).strokeCircle(0, 0, 22);
    this.soulRing.fillStyle(0x6fb3ad, 0.9).fillRect(-18, 18 - 36 * pct, 36, 36 * pct);
    this.soulRing.lineStyle(2, 0x8fd8d2, 0.8).strokeCircle(0, 0, 22);
    this.soulText.setText(String(Math.round(this.soul)));

    this.focusRing.clear();
    if (this.focus > 0) {
      this.focusRing.lineStyle(4, 0xffd89b, 0.95);
      this.focusRing.beginPath();
      this.focusRing.arc(0, 0, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.focus);
      this.focusRing.strokePath();
    }
    this.emberText.setText(`EMBERS ${getSave().points}   ·   ESC  menu`);
  }

  private drawHearts(hp: number) {
    this.hearts.forEach((g, i) => {
      g.clear();
      const filled = i < hp;
      g.fillStyle(filled ? 0xffb347 : 0x2c2f3d, 1);
      g.fillCircle(0, 0, 9);
      g.lineStyle(2, filled ? 0xffd89b : 0x3a3f55, 1);
      g.strokeCircle(0, 0, 12);
      if (filled) {
        g.fillStyle(0xffe9c4, 0.9);
        g.fillCircle(-3, -3, 3);
      }
    });
  }

  override update() {
    const game = this.scene.get("Game") as Phaser.Scene & { player?: { dashCooldownPct: number } };
    const pct = game?.player?.dashCooldownPct ?? 1;
    this.dashBar.clear();
    this.dashBar.fillStyle(0x22242c, 0.9);
    this.dashBar.fillRoundedRect(32, 80, 120, 8, 4);
    this.dashBar.fillStyle(pct >= 1 ? 0x6fb3ad : 0x3a3f55, 1);
    this.dashBar.fillRoundedRect(32, 80, 120 * pct, 8, 4);
    if (pct >= 1) {
      this.dashBar.fillStyle(0x8fd8d2, 0.35);
      this.dashBar.fillRoundedRect(30, 78, 124, 12, 6);
    }

    if (!this.bossVisible) return;
    const w = 640;
    const x = (GAME_W - w) / 2;
    this.bossBarBg.clear();
    this.bossBarBg.fillStyle(0x0c0e14, 0.85);
    this.bossBarBg.fillRoundedRect(x - 4, 632, w + 8, 24, 6);
    this.bossBar.clear();
    this.bossBar.fillStyle(0x2c2f3d, 1);
    this.bossBar.fillRect(x, 636, w, 16);
    this.bossBar.fillStyle(this.phase2 ? 0xffd89b : 0xffb347, 1);
    this.bossBar.fillRect(x, 636, w * Phaser.Math.Clamp(this.bossPct, 0, 1), 16);
    this.bossBar.lineStyle(2, 0x565d67, 1);
    this.bossBar.strokeRect(x, 636, w, 16);
  }
}
