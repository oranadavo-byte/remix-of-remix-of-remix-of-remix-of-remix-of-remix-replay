import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { buildAllTextures, registerAnims } from "../textures";
import { sfx, startAmbience, unlockAudio, applyVolumes } from "../audio";
import { formatPlayTime, getSave, hasSave } from "../save";

type Panel = "none" | "controls" | "abilities";

type MenuItem = {
  key: string;
  label: string;
  hint: string;
  action: () => void;
};

export class MenuScene extends Phaser.Scene {
  private panel: Panel = "none";
  private panelC: Phaser.GameObjects.Container | undefined;
  private items: MenuItem[] = [];
  private icons: Phaser.GameObjects.Image[] = [];
  private captions: Phaser.GameObjects.Text[] = [];
  private cursor = 0;
  private hintText!: Phaser.GameObjects.Text;
  private selector!: Phaser.GameObjects.Graphics;

  constructor() {
    super("Menu");
  }

  create() {
    buildAllTextures(this);
    registerAnims(this);
    applyVolumes();
    this.panel = "none";
    this.panelC = undefined;
    this.icons = [];
    this.captions = [];
    this.cursor = 0;

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

    // hero warden, framed by lantern glow
    this.add
      .image(GAME_W / 2, GAME_H / 2 + 34, "amber_dot")
      .setScale(58)
      .setAlpha(0.12)
      .setBlendMode(Phaser.BlendModes.ADD);
    const warden = this.add.sprite(GAME_W / 2, GAME_H / 2 + 92, "w_idle").setScale(3.4);
    warden.play("w_idle");
    this.tweens.add({ targets: warden, y: warden.y - 6, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.add.image(GAME_W / 2 - 300, GAME_H / 2 + 126, "prop_lantern_post").setOrigin(0.5, 1).setScale(1.4);
    this.add.image(GAME_W / 2 + 320, GAME_H / 2 + 126, "prop_crystal").setOrigin(0.5, 1).setScale(1.3);

    // ---- title lockup ----
    const title = this.add
      .text(GAME_W / 2, 128, "NOCTILUME", {
        fontFamily: "monospace",
        fontSize: "84px",
        color: "#ffe8c2",
        stroke: "#2a1a0a",
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: { from: 0.74, to: 1 }, duration: 2200, yoyo: true, repeat: -1 });

    const rule = this.add.graphics();
    rule.lineStyle(1, 0xffb347, 0.45).lineBetween(GAME_W / 2 - 230, 176, GAME_W / 2 - 14, 176);
    rule.lineStyle(1, 0xffb347, 0.45).lineBetween(GAME_W / 2 + 14, 176, GAME_W / 2 + 230, 176);
    rule.fillStyle(0xffd89b, 0.9).fillCircle(GAME_W / 2, 176, 4);
    rule.lineStyle(1, 0xffb347, 0.5).strokeCircle(GAME_W / 2, 176, 8);

    this.add
      .text(GAME_W / 2, 202, "a lantern in the rootbound dark", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#c4b8e0",
        stroke: "#1a1225",
        strokeThickness: 4,
      })
      .setOrigin(0.5);

    // ---- save summary ----
    const save = getSave();
    const resumed = hasSave();
    if (resumed) {
      const strip = this.add.container(GAME_W / 2, GAME_H - 196);
      const lantern = this.add.image(-192, 0, "hud_lantern_on").setScale(0.62);
      const ember = this.add.image(-46, 0, "hud_ember").setScale(0.8);
      const info = this.add
        .text(
          -168,
          0,
          `masks ${save.maxHp}`,
          { fontFamily: "monospace", fontSize: "14px", color: "#e8e2d4" },
        )
        .setOrigin(0, 0.5);
      const info2 = this.add
        .text(-30, 0, `${save.points} embers   ·   felled ${save.kills}   ·   ${formatPlayTime(save.playMs)}`, {
          fontFamily: "monospace",
          fontSize: "14px",
          color: "#6fb3ad",
        })
        .setOrigin(0, 0.5);
      strip.add([lantern, info, ember, info2]);
    }

    // ---- horizontal icon menu ----
    const begin = () => {
      unlockAudio();
      startAmbience();
      sfx("ui");
      this.cameras.main.fadeOut(500);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("Game"));
    };

    this.items = [
      {
        key: "descend",
        label: resumed ? "CONTINUE" : "DESCEND",
        hint: resumed ? "return to the chamber where your lantern last burned" : "take the lantern and step into the roots",
        action: begin,
      },
      { key: "tree", label: "EMBER TREE", hint: "spend embers on lasting boons", action: () => this.openOverlay("Skills") },
      { key: "settings", label: "SETTINGS", hint: "audio levels and preferences", action: () => this.openOverlay("Settings") },
      { key: "controls", label: "CONTROLS", hint: "keys, buttons and bindings", action: () => this.togglePanel("controls") },
      { key: "abilities", label: "ABILITIES", hint: "what the warden can do", action: () => this.togglePanel("abilities") },
    ];

    const rowY = GAME_H - 122;
    const gap = 132;
    const startX = GAME_W / 2 - ((this.items.length - 1) * gap) / 2;

    this.selector = this.add.graphics().setDepth(4);

    this.items.forEach((item, i) => {
      const x = startX + i * gap;
      const icon = this.add
        .image(x, rowY, `icon_${item.key}_off`)
        .setScale(0.86)
        .setDepth(5)
        .setInteractive({ useHandCursor: true });
      const cap = this.add
        .text(x, rowY + 54, item.label, {
          fontFamily: "monospace",
          fontSize: "13px",
          color: "#7e849a",
          stroke: "#0a0c12",
          strokeThickness: 3,
        })
        .setOrigin(0.5)
        .setDepth(5);
      icon.on("pointerover", () => this.select(i));
      icon.on("pointerdown", () => {
        this.select(i);
        item.action();
      });
      this.icons.push(icon);
      this.captions.push(cap);
    });

    this.hintText = this.add
      .text(GAME_W / 2, GAME_H - 44, "", { fontFamily: "monospace", fontSize: "14px", color: "#a89bc4" })
      .setOrigin(0.5);

    this.add
      .text(GAME_W / 2, GAME_H - 20, "← →  choose   ·   ENTER  confirm   ·   ESC  close", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#4a5170",
      })
      .setOrigin(0.5);

    this.select(0);

    this.input.keyboard?.on("keydown-LEFT", () => this.step(-1));
    this.input.keyboard?.on("keydown-A", () => this.step(-1));
    this.input.keyboard?.on("keydown-RIGHT", () => this.step(1));
    this.input.keyboard?.on("keydown-D", () => this.step(1));
    this.input.keyboard?.on("keydown-ENTER", () => this.items[this.cursor]?.action());
    this.input.keyboard?.on("keydown-SPACE", () => this.items[this.cursor]?.action());
    this.input.keyboard?.on("keydown-C", () => this.togglePanel("controls"));
    this.input.keyboard?.on("keydown-I", () => this.togglePanel("abilities"));
    this.input.keyboard?.on("keydown-ESC", () => this.togglePanel("none"));
    this.cameras.main.fadeIn(800);
  }

  private step(dir: number) {
    sfx("ui");
    this.select(Phaser.Math.Wrap(this.cursor + dir, 0, this.items.length));
  }

  private select(i: number) {
    this.cursor = i;
    this.items.forEach((item, k) => {
      const on = k === i;
      this.icons[k]?.setTexture(`icon_${item.key}_${on ? "on" : "off"}`);
      this.tweens.add({ targets: this.icons[k], scale: on ? 1 : 0.86, duration: 160, ease: "Back.easeOut" });
      this.captions[k]?.setColor(on ? "#ffd89b" : "#7e849a");
    });
    const icon = this.icons[i];
    if (icon) {
      this.selector.clear();
      this.selector
        .lineStyle(1, 0xffb347, 0.5)
        .strokeRoundedRect(icon.x - 52, icon.y - 52, 104, 122, 12)
        .fillStyle(0xffb347, 0.06)
        .fillRoundedRect(icon.x - 52, icon.y - 52, 104, 122, 12);
    }
    this.hintText.setText(this.items[i]?.hint ?? "");
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
    const h = lines.length * 30 + 90;
    const g = this.add
      .graphics()
      .fillStyle(0x0c0e14, 0.95)
      .fillRoundedRect(-w / 2, -h / 2, w, h, 16)
      .lineStyle(1, 0xffb347, 0.5)
      .strokeRoundedRect(-w / 2, -h / 2, w, h, 16)
      .lineStyle(1, 0xffb347, 0.22)
      .strokeRoundedRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14, 12);
    const head = this.add
      .text(0, -h / 2 + 28, next === "controls" ? "CONTROLS" : "ABILITIES", {
        fontFamily: "monospace",
        fontSize: "20px",
        color: "#ffd89b",
      })
      .setOrigin(0.5);
    const hr = this.add.graphics();
    hr.lineStyle(1, 0xffb347, 0.3).lineBetween(-w / 2 + 28, -h / 2 + 48, w / 2 - 28, -h / 2 + 48);
    const body = lines.map((l, i) =>
      this.add
        .text(-w / 2 + 36, -h / 2 + 74 + i * 30, l, {
          fontFamily: "monospace",
          fontSize: "15px",
          color: "#e8e2d4",
        })
        .setOrigin(0, 0.5),
    );
    this.panelC = this.add.container(GAME_W / 2, GAME_H / 2 - 40, [g, head, hr, ...body]).setDepth(200).setAlpha(0);
    this.tweens.add({ targets: this.panelC, alpha: 1, duration: 220 });
  }
}
