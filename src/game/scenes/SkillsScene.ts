import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { FONT, panel, textButton } from "../ui/kit";
import { SKILLS, canUnlock, rankOf, respec, unlock, type SkillDef } from "../skills";
import { getSave } from "../save";
import { sfx } from "../audio";

/** The ember tree: spend embers earned from fallen creatures on lasting upgrades. */
export class SkillsScene extends Phaser.Scene {
  private from = "Menu";
  private nodes: Array<{ def: SkillDef; g: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text }> = [];
  private emberText!: Phaser.GameObjects.Text;
  private detail!: Phaser.GameObjects.Text;
  private root!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "Skills" });
  }

  init(data: { from?: string }) {
    this.from = data?.from ?? "Menu";
  }

  create() {
    this.nodes = [];
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05070c, 0.8).setOrigin(0, 0);

    const w = 940;
    const h = 560;
    this.root = panel(this, GAME_W / 2, GAME_H / 2, w, h, "EMBER TREE");

    this.emberText = this.add
      .text(0, -h / 2 + 78, "", { fontFamily: FONT, fontSize: "16px", color: "#ffd89b" })
      .setOrigin(0.5);
    this.detail = this.add
      .text(0, h / 2 - 96, "", {
        fontFamily: FONT,
        fontSize: "15px",
        color: "#a89bc4",
        align: "center",
        wordWrap: { width: w - 120 },
      })
      .setOrigin(0.5);
    this.root.add([this.emberText, this.detail]);

    const colW = 210;
    const rowH = 130;
    const ox = -((4 - 1) * colW) / 2;
    const oy = -60;

    // link lines
    const links = this.add.graphics();
    this.root.add(links);
    SKILLS.forEach((def) => {
      if (!def.requires) return;
      const req = SKILLS.find((s) => s.id === def.requires);
      if (!req) return;
      links
        .lineStyle(2, 0xffb347, 0.28)
        .lineBetween(ox + req.col * colW, oy + req.row * rowH, ox + def.col * colW, oy + def.row * rowH);
    });

    SKILLS.forEach((def) => {
      const x = ox + def.col * colW;
      const y = oy + def.row * rowH;
      const g = this.add.graphics({ x, y });
      const label = this.add
        .text(x, y + 44, def.name, { fontFamily: FONT, fontSize: "14px", color: "#e8e2d4" })
        .setOrigin(0.5);
      const hit = this.add
        .zone(x, y, 130, 96)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => this.describe(def));
      hit.on("pointerdown", () => this.buy(def));
      this.root.add([g, label, hit]);
      this.nodes.push({ def, g, label });
    });

    this.root.add(textButton(this, -w / 2 + 110, h / 2 - 42, "RESPEC", () => {
      respec();
      this.refresh();
    }, { size: 16, color: "#6fb3ad" }));
    this.root.add(textButton(this, w / 2 - 90, h / 2 - 42, "CLOSE", () => this.close(), { size: 18 }));

    this.refresh();
    this.root.setScale(0.95).setAlpha(0);
    this.tweens.add({ targets: this.root, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.input.keyboard?.on("keydown-ESC", () => this.close());
  }

  private describe(def: SkillDef) {
    const rank = rankOf(def.id);
    const next = Math.min(def.maxRank, rank + 1);
    const check = canUnlock(def);
    const line = check.ok ? `click to spend ${def.cost} ember` : check.why;
    this.detail.setText(
      `${def.name}  ·  rank ${rank}/${def.maxRank}\n${def.blurb}\nnow: ${rank ? def.effect(rank) : "—"}   next: ${def.effect(next)}\n${line}`,
    );
  }

  private buy(def: SkillDef) {
    if (unlock(def)) {
      sfx("checkpoint");
      this.refresh();
      this.describe(def);
      const n = this.nodes.find((x) => x.def.id === def.id);
      if (n) this.tweens.add({ targets: n.label, scale: { from: 1.3, to: 1 }, duration: 260 });
    } else {
      sfx("ui");
      this.describe(def);
    }
  }

  private refresh() {
    const save = getSave();
    this.emberText.setText(`embers ${save.points}   ·   spent ${save.spent}   ·   hover a node for details`);
    this.nodes.forEach(({ def, g, label }) => {
      const rank = rankOf(def.id);
      const locked = !!def.requires && rankOf(def.requires) < 1;
      g.clear();
      const alpha = locked ? 0.25 : rank > 0 ? 1 : 0.6;
      g.fillStyle(0x11141c, 0.95).fillRoundedRect(-58, -34, 116, 68, 12);
      g.lineStyle(2, def.tint, alpha).strokeRoundedRect(-58, -34, 116, 68, 12);
      g.fillStyle(def.tint, alpha).fillCircle(0, -8, 10);
      for (let i = 0; i < def.maxRank; i++) {
        g.fillStyle(i < rank ? def.tint : 0x2c2f3d, 1);
        g.fillCircle(-((def.maxRank - 1) * 9) + i * 18, 18, 4);
      }
      label.setColor(locked ? "#525a78" : rank > 0 ? "#ffd89b" : "#e8e2d4");
    });
  }

  private close() {
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
