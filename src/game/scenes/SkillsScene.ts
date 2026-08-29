import * as Phaser from "phaser";
import { GAME_H, GAME_W } from "../config";
import { FONT, panel, textButton } from "../ui/kit";
import { SKILLS, canUnlock, rankOf, respec, unlock, type SkillDef } from "../skills";
import { getSave } from "../save";
import { sfx } from "../audio";

type Node = {
  def: SkillDef;
  plate: Phaser.GameObjects.Image;
  g: Phaser.GameObjects.Graphics;
  label: Phaser.GameObjects.Text;
  pips: Phaser.GameObjects.Graphics;
};

/** The ember tree: spend embers earned from fallen creatures on lasting upgrades. */
export class SkillsScene extends Phaser.Scene {
  private from = "Menu";
  private nodes: Node[] = [];
  private links!: Phaser.GameObjects.Graphics;
  private linkSpecs: Array<{ from: SkillDef; to: SkillDef }> = [];
  private emberText!: Phaser.GameObjects.Text;
  private detailName!: Phaser.GameObjects.Text;
  private detailBody!: Phaser.GameObjects.Text;
  private detailHint!: Phaser.GameObjects.Text;
  private root!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "Skills" });
  }

  init(data: { from?: string }) {
    this.from = data?.from ?? "Menu";
  }

  create() {
    this.nodes = [];
    this.linkSpecs = [];
    this.add.rectangle(0, 0, GAME_W, GAME_H, 0x05070c, 0.86).setOrigin(0, 0);

    const w = 940;
    const h = 580;
    this.root = panel(this, GAME_W / 2, GAME_H / 2, w, h, "EMBER TREE");

    // inner hairline frame
    const inner = this.add.graphics();
    inner.lineStyle(1, 0xffb347, 0.2).strokeRoundedRect(-w / 2 + 9, -h / 2 + 9, w - 18, h - 18, 14);
    this.root.add(inner);

    // ---- ember ledger header ----
    const ledger = this.add.container(0, -h / 2 + 76);
    const ember = this.add.image(-96, 0, "hud_ember").setScale(0.95);
    this.emberText = this.add.text(-78, 0, "", { fontFamily: FONT, fontSize: "16px", color: "#ffd89b" }).setOrigin(0, 0.5);
    ledger.add([ember, this.emberText]);
    this.root.add(ledger);

    // ---- detail plaque ----
    const dw = w - 120;
    const dh = 100;
    const dy = h / 2 - 106;
    const plaque = this.add
      .graphics()
      .fillStyle(0x11141c, 0.85)
      .fillRoundedRect(-dw / 2, dy - dh / 2, dw, dh, 12)
      .lineStyle(1, 0xffb347, 0.28)
      .strokeRoundedRect(-dw / 2, dy - dh / 2, dw, dh, 12);
    this.detailName = this.add
      .text(0, dy - 30, "", { fontFamily: FONT, fontSize: "17px", color: "#ffd89b" })
      .setOrigin(0.5);
    this.detailBody = this.add
      .text(0, dy - 2, "", {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#c8bede",
        align: "center",
        wordWrap: { width: dw - 40 },
      })
      .setOrigin(0.5);
    this.detailHint = this.add
      .text(0, dy + 32, "", { fontFamily: FONT, fontSize: "14px", color: "#6fb3ad" })
      .setOrigin(0.5);
    this.root.add([plaque, this.detailName, this.detailBody, this.detailHint]);

    const colW = 210;
    const rowH = 132;
    const ox = -((4 - 1) * colW) / 2;
    const oy = -46;

    // link lines (redrawn on refresh so unlocked paths brighten)
    this.links = this.add.graphics();
    this.root.add(this.links);
    SKILLS.forEach((def) => {
      if (!def.requires) return;
      const req = SKILLS.find((s) => s.id === def.requires);
      if (req) this.linkSpecs.push({ from: req, to: def });
    });
    const px = (d: SkillDef) => ({ x: ox + d.col * colW, y: oy + d.row * rowH });
    this.drawLinks = () => {
      this.links.clear();
      this.linkSpecs.forEach(({ from, to }) => {
        const a = px(from);
        const b = px(to);
        const live = rankOf(from.id) > 0;
        this.links
          .lineStyle(live ? 3 : 2, live ? 0xffb347 : 0x4a4232, live ? 0.55 : 0.3)
          .lineBetween(a.x, a.y, b.x, b.y);
        if (live) {
          this.links.fillStyle(0xffd89b, 0.7).fillCircle((a.x + b.x) / 2, (a.y + b.y) / 2, 3);
        }
      });
    };

    SKILLS.forEach((def) => {
      const { x, y } = px(def);
      const plate = this.add.image(x, y, "node_plate").setScale(0.74);
      const g = this.add.graphics({ x, y });
      const pips = this.add.graphics({ x, y });
      const label = this.add
        .text(x, y + 46, def.name, { fontFamily: FONT, fontSize: "14px", color: "#e8e2d4" })
        .setOrigin(0.5);
      const hit = this.add
        .zone(x, y, 110, 100)
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });
      hit.on("pointerover", () => {
        this.describe(def);
        this.tweens.add({ targets: plate, scale: 0.82, duration: 140, ease: "Back.easeOut" });
      });
      hit.on("pointerout", () => this.tweens.add({ targets: plate, scale: 0.74, duration: 140 }));
      hit.on("pointerdown", () => this.buy(def));
      this.root.add([plate, g, pips, label, hit]);
      this.nodes.push({ def, plate, g, label, pips });
    });

    this.root.add(
      textButton(
        this,
        -w / 2 + 110,
        h / 2 - 34,
        "RESPEC",
        () => {
          respec();
          this.refresh();
        },
        { size: 16, color: "#6fb3ad" },
      ),
    );
    this.root.add(textButton(this, w / 2 - 90, h / 2 - 34, "CLOSE", () => this.close(), { size: 18 }));

    this.refresh();
    this.detailName.setText("choose a boon");
    this.detailBody.setText("hover a node to read what the ember buys you");
    this.root.setScale(0.95).setAlpha(0);
    this.tweens.add({ targets: this.root, alpha: 1, scale: 1, duration: 180, ease: "Back.easeOut" });
    this.input.keyboard?.on("keydown-ESC", () => this.close());
  }

  private drawLinks: () => void = () => {};

  private describe(def: SkillDef) {
    const rank = rankOf(def.id);
    const next = Math.min(def.maxRank, rank + 1);
    const check = canUnlock(def);
    this.detailName.setText(`${def.name}   ·   rank ${rank}/${def.maxRank}`);
    this.detailBody.setText(`${def.blurb}\nnow ${rank ? def.effect(rank) : "—"}      next ${def.effect(next)}`);
    this.detailHint.setText(check.ok ? `click to spend ${def.cost} ember` : check.why).setColor(check.ok ? "#6fb3ad" : "#a8788a");
  }

  private buy(def: SkillDef) {
    if (unlock(def)) {
      sfx("checkpoint");
      this.refresh();
      this.describe(def);
      const n = this.nodes.find((x) => x.def.id === def.id);
      if (n) {
        this.tweens.add({ targets: n.label, scale: { from: 1.3, to: 1 }, duration: 260 });
        this.tweens.add({ targets: n.plate, scale: { from: 1.05, to: 0.74 }, duration: 320, ease: "Back.easeOut" });
      }
    } else {
      sfx("ui");
      this.describe(def);
    }
  }

  private refresh() {
    const save = getSave();
    this.emberText.setText(`${save.points} embers held   ·   ${save.spent} spent`);
    this.drawLinks();
    this.nodes.forEach(({ def, plate, g, label, pips }) => {
      const rank = rankOf(def.id);
      const locked = !!def.requires && rankOf(def.requires) < 1;
      const maxed = rank >= def.maxRank;
      plate.setTexture(rank > 0 ? "node_plate_lit" : "node_plate");
      plate.setAlpha(locked ? 0.4 : 1);

      // sigil core
      g.clear();
      const alpha = locked ? 0.3 : rank > 0 ? 1 : 0.62;
      g.fillStyle(def.tint, alpha * 0.22).fillCircle(0, -6, 18);
      g.fillStyle(def.tint, alpha).fillCircle(0, -6, 9);
      g.lineStyle(1.5, 0xffe9c4, maxed ? 0.9 : 0.25).strokeCircle(0, -6, 14);

      // rank pips
      pips.clear();
      for (let i = 0; i < def.maxRank; i++) {
        pips.fillStyle(i < rank ? def.tint : 0x2c2f3d, locked ? 0.4 : 1);
        pips.fillCircle(-((def.maxRank - 1) * 9) + i * 18, 22, 4);
      }

      label.setColor(locked ? "#525a78" : maxed ? "#ffe9c4" : rank > 0 ? "#ffd89b" : "#e8e2d4");
    });
  }

  private close() {
    this.scene.stop();
    this.scene.resume(this.from);
  }
}
