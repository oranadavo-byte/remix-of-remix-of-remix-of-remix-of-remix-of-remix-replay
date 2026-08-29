import * as Phaser from "phaser";
import { GAME_W, TUNE } from "../config";
import { getSave } from "../save";

const DASH_SEGS = 5;

/** Diegetic HUD: lantern health, ember count, dash meter and the guardian's root-bound bar. */
export class UIScene extends Phaser.Scene {
  private lanterns: Phaser.GameObjects.Image[] = [];
  private dashSegs: Phaser.GameObjects.Graphics[] = [];
  private bossFrame!: Phaser.GameObjects.Image;
  private bossEmblem!: Phaser.GameObjects.Image;
  private bossFill!: Phaser.GameObjects.Graphics;
  private bossLabel!: Phaser.GameObjects.Text;
  private bossPct = 1;
  private bossShown = 1;
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
  private hp = TUNE.playerMaxHp;

  constructor() {
    super({ key: "UI", active: false });
  }

  create() {
    const game = this.scene.get("Game");

    this.maxHp = Math.max(TUNE.playerMaxHp, getSave().maxHp);
    this.hp = this.maxHp;

    /* ---- top left: emblem + lantern health + embers ---- */
    const emblem = this.add.image(44, 46, "hud_emblem").setScale(0.92);
    this.tweens.add({
      targets: emblem,
      scale: { from: 0.9, to: 0.96 },
      duration: 2400,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    for (let i = 0; i < this.maxHp; i++) {
      const img = this.add.image(88 + i * 30, 42, "hud_lantern_on").setScale(0.72).setOrigin(0, 0.5);
      this.lanterns.push(img);
    }

    this.add.image(80, 82, "hud_ember").setScale(0.8);
    this.emberText = this.add.text(96, 82, "0", {
      fontFamily: "monospace",
      fontSize: "15px",
      color: "#ffd89b",
    }).setOrigin(0, 0.5);

    /* ---- soul vessel ---- */
    this.soulRing = this.add.graphics({ x: 44, y: 108 });
    this.focusRing = this.add.graphics({ x: 44, y: 108 });
    this.soulText = this.add
      .text(44, 108, "0", { fontFamily: "monospace", fontSize: "12px", color: "#8fd8d2" })
      .setOrigin(0.5);

    /* ---- top right: dash meter ---- */
    this.add
      .text(GAME_W - 24, 30, "DASH", { fontFamily: "monospace", fontSize: "13px", color: "#8fd8d2" })
      .setOrigin(1, 0.5)
      .setAlpha(0.85);
    for (let i = 0; i < DASH_SEGS; i++) {
      this.dashSegs.push(this.add.graphics({ x: GAME_W - 24 - (DASH_SEGS - i) * 34, y: 50 }));
    }

    /* ---- centre top: boss bar ---- */
    const bx = GAME_W / 2;
    this.bossFrame = this.add.image(bx, 92, "boss_frame").setVisible(false);
    this.bossFill = this.add.graphics().setVisible(false);
    this.bossEmblem = this.add.image(bx - 300, 92, "boss_emblem").setScale(0.8).setVisible(false);
    this.bossLabel = this.add
      .text(bx, 58, "THE ROOTBOUND GUARDIAN", {
        fontFamily: "monospace",
        fontSize: "17px",
        color: "#e8e2d4",
        stroke: "#0a0c12",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setVisible(false);

    this.toast = this.add
      .text(GAME_W / 2, 180, "", { fontFamily: "monospace", fontSize: "20px", color: "#ffd89b" })
      .setOrigin(0.5)
      .setAlpha(0);

    this.drawHearts(this.maxHp);
    this.drawSoul();

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
    const parts = [this.bossFrame, this.bossFill, this.bossEmblem, this.bossLabel];
    if (v) {
      this.bossPct = 1;
      this.bossShown = 1;
      this.phase2 = false;
      this.bossLabel.setText("THE ROOTBOUND GUARDIAN");
      parts.forEach((p) => p.setVisible(true).setAlpha(0));
      this.tweens.add({ targets: parts, alpha: 1, duration: 600 });
    } else {
      this.tweens.add({
        targets: parts,
        alpha: 0,
        duration: 500,
        delay: 300,
        onComplete: () => parts.forEach((p) => p.setVisible(false)),
      });
    }
  }

  private drawSoul() {
    const pct = Phaser.Math.Clamp(this.soul / this.maxSoul, 0, 1);
    this.soulRing.clear();
    this.soulRing.fillStyle(0x0c0e14, 0.9).fillCircle(0, 0, 18);
    this.soulRing.lineStyle(2, 0x2c2f3d, 1).strokeCircle(0, 0, 18);
    this.soulRing.fillStyle(0x6fb3ad, 0.85).fillRect(-15, 15 - 30 * pct, 30, 30 * pct);
    this.soulRing.lineStyle(2, 0x8fd8d2, 0.75).strokeCircle(0, 0, 18);
    this.soulText.setText(String(Math.round(this.soul)));

    this.focusRing.clear();
    if (this.focus > 0) {
      this.focusRing.lineStyle(3, 0xffd89b, 0.95);
      this.focusRing.beginPath();
      this.focusRing.arc(0, 0, 23, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.focus);
      this.focusRing.strokePath();
    }
    this.emberText.setText(String(getSave().points));
  }

  /** Lantern health: lit lanterns snuff out one by one, with a flicker and a rising mote. */
  private drawHearts(hp: number) {
    const lost = hp < this.hp;
    this.lanterns.forEach((img, i) => {
      const lit = i < hp;
      const wasLit = i < this.hp;
      img.setTexture(lit ? "hud_lantern_on" : "hud_lantern_off");
      if (wasLit && !lit) {
        this.tweens.add({
          targets: img,
          scale: { from: 0.92, to: 0.72 },
          duration: 240,
          ease: "Quad.easeOut",
        });
        this.tweens.add({
          targets: img,
          x: img.x + 3,
          duration: 55,
          yoyo: true,
          repeat: 2,
        });
        const mote = this.add
          .image(img.x + 16, img.y - 4, "hud_ember")
          .setScale(0.5)
          .setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: mote,
          y: mote.y - 26,
          alpha: 0,
          scale: 0.1,
          duration: 700,
          onComplete: () => mote.destroy(),
        });
      } else if (!wasLit && lit) {
        this.tweens.add({ targets: img, scale: { from: 0.55, to: 0.72 }, duration: 300, ease: "Back.easeOut" });
      }
    });
    if (lost) this.cameras.main.shake(90, 0.002);
    this.hp = hp;
  }

  override update(_t: number, dt: number) {
    const game = this.scene.get("Game") as Phaser.Scene & { player?: { dashCooldownPct: number } };
    const pct = game?.player?.dashCooldownPct ?? 1;

    // segmented dash charge — fills left to right, glows when ready
    this.dashSegs.forEach((g, i) => {
      const segPct = Phaser.Math.Clamp(pct * DASH_SEGS - i, 0, 1);
      g.clear();
      g.fillStyle(0x11141c, 0.85).fillRoundedRect(0, 0, 28, 12, 4);
      if (segPct > 0) {
        g.fillStyle(pct >= 1 ? 0x8fd8d2 : 0x4a8f8a, 1);
        g.fillRoundedRect(0, 0, 28 * segPct, 12, 4);
      }
      g.lineStyle(1, pct >= 1 ? 0x8fd8d2 : 0x2c2f3d, pct >= 1 ? 0.9 : 0.6).strokeRoundedRect(0, 0, 28, 12, 4);
    });

    if (!this.bossVisible) return;
    // eased drain so chip damage reads clearly
    this.bossShown = Phaser.Math.Linear(this.bossShown, Phaser.Math.Clamp(this.bossPct, 0, 1), Math.min(1, dt / 120));
    const w = 560;
    const x = GAME_W / 2 - w / 2;
    const y = 84;
    this.bossFill.clear();
    this.bossFill.fillStyle(0x14100c, 1).fillRoundedRect(x, y, w, 16, 5);
    const fw = w * this.bossShown;
    if (fw > 2) {
      this.bossFill.fillStyle(this.phase2 ? 0xd9543a : 0xffb347, 1).fillRoundedRect(x, y, fw, 16, 5);
      this.bossFill.fillStyle(0xffe9c4, 0.35).fillRoundedRect(x, y + 2, fw, 5, 3);
    }
    this.bossFill.lineStyle(1, 0xc9964a, 0.7).strokeRoundedRect(x, y, w, 16, 5);
  }
}
