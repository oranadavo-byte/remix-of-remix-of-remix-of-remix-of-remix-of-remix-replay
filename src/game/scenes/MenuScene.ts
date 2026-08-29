import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { buildAllTextures, registerAnims } from "../textures";
import { sfx, startAmbience, unlockAudio, applyVolumes } from "../audio";
import { formatPlayTime, getSave, hasSave } from "../save";

type Panel = "none" | "controls" | "abilities";

export class MenuScene extends Phaser.Scene {
  private panel: Panel = "none";
  private panelC: Phaser.GameObjects.Container | undefined;

  constructor() {
    super("Menu");
  }

  create() {
    buildAllTextures(this);
    registerAnims(this);
    applyVolumes();

    this.add.image(0, 0, "bg_far").setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H);
    this.add.image(0, 0, "bg_mid").setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H).setAlpha(0.8);
    this.add.image(0, 40, "bg_near").setOrigin(0, 0).setDisplaySize(GAME_W, GAME_H).setAlpha(0.7);

    // drifting motes
    this.add.particles(0, GAME_H, "amber_dot", {
      x: { min: 0, max: GAME_W },
      speedY: { min: -26, max: -8 },
      speedX: { min: -12, max: 12 },
      lifespan: 9000,
      scale: { start: 0.28, end: 0 },
      alpha: { start: 0.5, end: 0 },
      frequency: 320,
    });

    const warden = this.add.sprite(GAME_W / 2, GAME_H / 2 + 96, "w_idle").setScale(3.4);
    warden.play("w_idle");
    this.add
      .image(GAME_W / 2, GAME_H / 2 + 40, "amber_dot")
      .setScale(52)
      .setAlpha(0.1)
      .setBlendMode(Phaser.BlendModes.ADD);

    this.add.image(GAME_W / 2 - 300, GAME_H / 2 + 130, "prop_lantern_post").setOrigin(0.5, 1).setScale(1.4);
    this.add.image(GAME_W / 2 + 320, GAME_H / 2 + 130, "prop_crystal").setOrigin(0.5, 1).setScale(1.3);

    const title = this.add
      .text(GAME_W / 2, 132, "NOCTILUME", {
        fontFamily: "monospace",
        fontSize: "84px",
        color: "#ffe8c2",
        stroke: "#2a1a0a",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: { from: 0.72, to: 1 }, duration: 2200, yoyo: true, repeat: -1 });

    const rule = this.add.graphics();
    rule.lineStyle(1, 0xffb347, 0.45).lineBetween(GAME_W / 2 - 210, 178, GAME_W / 2 + 210, 178);
    rule.fillStyle(0xffd89b, 0.9).fillCircle(GAME_W / 2, 178, 3);

    this.add
      .text(GAME_W / 2, 204, "a lantern in the rootbound dark", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#c4b8e0",
        stroke: "#1a1225",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    const begin = () => {
      unlockAudio();
      startAmbience();
      sfx("ui");
      this.cameras.main.fadeOut(500);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Game"));
    };

    const save = getSave();
    const resumed = hasSave();
    const items: Array<[string, () => void]> = [
      [resumed ? "CONTINUE  THE  DESCENT" : "BEGIN  THE  DESCENT", begin],
      ["EMBER TREE", () => this.openOverlay("Skills")],
      ["SETTINGS", () => this.openOverlay("Settings")],
      ["CONTROLS", () => this.togglePanel("controls")],
      ["ABILITIES", () => this.togglePanel("abilities")],
    ];
    if (resumed) {
      this.add
        .text(
          GAME_W / 2,
          GAME_H - 262,
          `masks ${save.maxHp}  ·  embers ${save.points}  ·  felled ${save.kills}  ·  ${formatPlayTime(save.playMs)}`,
          { fontFamily: "monospace", fontSize: "14px", color: "#6fb3ad" },
        )
        .setOrigin(0.5);
    }

    items.forEach(([text, fn], i) => {
      const y = GAME_H - 232 + i * 40;
      const baseColor = i === 0 ? "#fff5e0" : "#8fd8d2";
      const t = this.add
        .text(GAME_W / 2, y, text, {
          fontFamily: "monospace",
          fontSize: i === 0 ? "28px" : "20px",
          color: baseColor,
          stroke: "#0a0c12",
          strokeThickness: 4,
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      t.on("pointerover", () => t.setColor("#ffd89b").setScale(1.06));
      t.on("pointerout", () => t.setColor(baseColor).setScale(1));
      t.on("pointerdown", fn);
      if (i === 0) this.tweens.add({ targets: t, alpha: { from: 0.65, to: 1 }, duration: 1100, yoyo: true, repeat: -1 });
    });

    this.add
      .text(GAME_W / 2, GAME_H - 56, "ENTER begin   ·   C controls   ·   I abilities", {
        fontFamily: "monospace",
        fontSize: "15px",
        color: "#525a78",
      })
      .setOrigin(0.5);

    this.input.keyboard?.on("keydown-ENTER", begin);
    this.input.keyboard?.on("keydown-SPACE", begin);
    this.input.keyboard?.on("keydown-C", () => this.togglePanel("controls"));
    this.input.keyboard?.on("keydown-I", () => this.togglePanel("abilities"));
    this.input.keyboard?.on("keydown-ESC", () => this.togglePanel("none"));
    this.cameras.main.fadeIn(800);
  }

  private openOverlay(key: string) {
    sfx("ui");
    this.scene.launch(key, { from: "Menu" });
    this.scene.pause();
  }

  private togglePanel(p: Panel) {
    sfx("ui");
    const next = this.panel === p ? "none" : p;
    this.panel = next;
    this.panelC?.destroy();
    this.panelC = undefined;
    if (next === "none") return;

    const lines =
      next === "controls"
        ? [
            "A / D  or  ← →      move",
            "SPACE / W           jump  (tap again mid-air for the second wing)",
            "hold SPACE          rise higher",
            "J  or  LMB          strike  (3-hit combo)",
            "K / SHIFT / RMB     dash",
            "L                   spirit blast   (33 soul)",
            "hold S              focus — mend a mask   (33 soul)",
            "I                   satchel        ESC  pause",
          ]
        : [
            "NAIL COMBO   three chained strikes; the third hits wider and harder",
            "SHADE DASH   a burst of speed that slips through damage",
            "SECOND WING  one extra jump while airborne",
            "SOUL         gather motes from fallen creatures",
            "FOCUS        spend 33 soul on the ground to mend one mask",
            "SPIRIT BLAST spend 33 soul to hurl a soul projectile",
            "LIFE SHARDS  rare drops that raise your maximum masks",
          ];

    const w = 720;
    const h = lines.length * 30 + 76;
    const g = this.add
      .graphics()
      .fillStyle(0x0c0e14, 0.94)
      .fillRoundedRect(-w / 2, -h / 2, w, h, 16)
      .lineStyle(1, 0xffb347, 0.5)
      .strokeRoundedRect(-w / 2, -h / 2, w, h, 16);
    const head = this.add
      .text(0, -h / 2 + 26, next === "controls" ? "CONTROLS" : "ABILITIES", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffd89b",
      })
      .setOrigin(0.5);
    const body = lines.map((l, i) =>
      this.add
        .text(-w / 2 + 36, -h / 2 + 62 + i * 30, l, {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#e8e2d4",
        })
        .setOrigin(0, 0.5),
    );
    this.panelC = this.add.container(GAME_W / 2, GAME_H / 2 - 20, [g, head, ...body]).setDepth(200).setAlpha(0);
    this.tweens.add({ targets: this.panelC, alpha: 1, duration: 220 });
  }
}
