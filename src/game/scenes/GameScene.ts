import * as Phaser from "phaser";
import { DEPTH, GAME_H, GAME_W, TUNE } from "../config";
import { buildAllTextures, registerAnims } from "../textures";
import { Player } from "../entities/Player";
import { Enemy } from "../entities/Enemy";
import { Boss } from "../entities/Boss";
import { sfx, startAmbience, unlockAudio, applyVolumes } from "../audio";
import { Pickup, type PickupKind } from "../entities/Pickup";
import { getSave, getSettings, writeSave } from "../save";
import { track } from "../analytics";
import { KILLS_PER_POINT } from "../skills";
import {
  ARENA,
  BOSS_POS,
  DEATH_Y,
  ENEMIES,
  HAZARDS,
  HINTS,
  PORTAL,
  PROPS,
  ROOM_LABELS,
  SHRINE,
  SOLIDS,
  START,
  WORLD_H,
  WORLD_W,
} from "../level";

type KeyName =
  | "A" | "D" | "LEFT" | "RIGHT" | "W" | "UP" | "SPACE"
  | "J" | "K" | "L" | "S" | "SHIFT" | "ESC" | "P";

export class GameScene extends Phaser.Scene {
  player!: Player;
  playerRef!: Player;
  boss!: Boss;
  private solids!: Phaser.Physics.Arcade.StaticGroup;
  private enemies!: Phaser.Physics.Arcade.Group;
  private hazards!: Phaser.Physics.Arcade.StaticGroup;
  private hitboxes!: Phaser.Physics.Arcade.Group;
  private bg: Phaser.GameObjects.TileSprite[] = [];
  private fg!: Phaser.GameObjects.TileSprite;
  private keys!: Record<KeyName, Phaser.Input.Keyboard.Key>;
  private checkpoint = { x: START.x, y: START.y };
  private shrineSprite!: Phaser.GameObjects.Sprite;
  private shrineLit = false;
  private portalSprite!: Phaser.GameObjects.Image;
  private bossTriggered = false;
  private gateWall: Phaser.GameObjects.Rectangle | undefined;
  private hintTexts: Array<{ obj: Phaser.GameObjects.Container; x: number }> = [];
  private roomLabel!: Phaser.GameObjects.Text;
  private currentRoom = -1;
  private lantern!: Phaser.GameObjects.Image;
  private paused = false;
  private ended = false;
  kills = 0;
  deaths = 0;
  startedAt = 0;
  private pickups!: Phaser.Physics.Arcade.Group;
  private spells!: Phaser.Physics.Arcade.Group;
  private killBank = 0;

  constructor() {
    super("Game");
  }

  create() {
    unlockAudio();
    startAmbience();
    buildAllTextures(this);
    registerAnims(this);
    this.ended = false;
    this.paused = false;
    this.kills = 0;
    this.deaths = 0;
    this.startedAt = this.time.now;
    track("session_start");
    this.checkpoint = { ...START };
    applyVolumes();
    const save = getSave();
    this.kills = save.kills;
    this.deaths = save.deaths;
    this.shrineLit = save.shrineLit;
    if (save.shrineLit && save.checkpoint) this.checkpoint = { ...save.checkpoint };

    this.physics.world.setBounds(-60, -400, WORLD_W + 60, WORLD_H + 400);
    this.cameras.main.setBounds(-60, -400, WORLD_W + 60, WORLD_H + 400);
    this.cameras.main.setBackgroundColor("#0a0c12");

    // parallax
    const mk = (key: string, depth: number, alpha = 1) => {
      const t = this.add
        .tileSprite(0, 0, GAME_W, GAME_H, key)
        .setOrigin(0, 0)
        .setScrollFactor(0)
        .setDepth(depth)
        .setAlpha(alpha);
      this.bg.push(t);
      return t;
    };
    mk("bg_far", DEPTH.bg0);
    mk("bg_mid", DEPTH.bg1, 0.9);
    mk("bg_near", DEPTH.bg2, 0.85);
    this.fg = this.add
      .tileSprite(0, 0, GAME_W, GAME_H, "fg_layer")
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(DEPTH.fg)
      .setAlpha(0.9);

    // terrain
    this.solids = this.physics.add.staticGroup();
    SOLIDS.forEach((r) => {
      const tex = r.kind === "ground" ? "tile_ground" : "tile_plat";
      const ts = this.add.tileSprite(r.x, r.y, r.w, r.h, tex).setOrigin(0, 0).setDepth(DEPTH.terrain);
      const body = this.add.rectangle(r.x + r.w / 2, r.y + r.h / 2, r.w, r.h);
      this.solids.add(body);
      (body.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      body.setVisible(false);
      void ts;
    });

    // props
    PROPS.forEach((p) => {
      this.add
        .image(p.x, p.y, p.key)
        .setOrigin(0.5, 1)
        .setScale(p.scale ?? 1)
        .setDepth(DEPTH.props)
        .setAlpha(p.alpha ?? 1);
    });

    // hazards
    this.hazards = this.physics.add.staticGroup();
    HAZARDS.forEach((h) => {
      this.add.tileSprite(h.x, h.y, h.w, h.h, "thorns").setOrigin(0, 0).setDepth(DEPTH.terrain + 1);
      const r = this.add.rectangle(h.x + h.w / 2, h.y + h.h / 2, h.w, h.h).setVisible(false);
      this.hazards.add(r);
      (r.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
    });

    // shrine + portal
    this.shrineSprite = this.add.sprite(SHRINE.x, SHRINE.y, "shrine", 0).setOrigin(0.5, 1).setDepth(DEPTH.props + 1);
    this.portalSprite = this.add.image(PORTAL.x, PORTAL.y, "portal").setOrigin(0.5, 1).setDepth(DEPTH.props + 1).setAlpha(0.25);

    // hints — small floating plaques
    HINTS.forEach((h) => {
      const label = this.add
        .text(0, 0, h.text, { fontFamily: "monospace", fontSize: "17px", color: "#f2e9d8" })
        .setOrigin(0.5);
      const pad = 14;
      const bg = this.add
        .graphics()
        .fillStyle(0x11141c, 0.82)
        .fillRoundedRect(-label.width / 2 - pad, -18, label.width + pad * 2, 36, 10)
        .lineStyle(1, 0xffb347, 0.5)
        .strokeRoundedRect(-label.width / 2 - pad, -18, label.width + pad * 2, 36, 10);
      const c = this.add.container(h.x, h.y, [bg, label]).setDepth(DEPTH.fx).setAlpha(0);
      this.tweens.add({ targets: c, y: h.y - 6, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      this.hintTexts.push({ obj: c, x: h.x });
    });


    this.roomLabel = this.add
      .text(GAME_W / 2, 96, "", {
        fontFamily: "monospace",
        fontSize: "26px",
        color: "#ffd89b",
        stroke: "#0c0e14",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(DEPTH.ui)
      .setAlpha(0);

    // entities
    this.player = new Player(this, this.checkpoint.x, this.checkpoint.y);
    this.player.setScale(1.15);
    this.playerRef = this.player;
    this.lantern = this.add
      .image(this.player.x, this.player.y, "amber_dot")
      .setScale(34)
      .setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.player - 2);
    this.enemies = this.physics.add.group();
    ENEMIES.forEach((e) => this.enemies.add(new Enemy(this, e.type, e.x, e.y, e.range)));
    this.boss = new Boss(this, BOSS_POS.x, BOSS_POS.y);
    this.hitboxes = this.physics.add.group({ allowGravity: false });
    this.pickups = this.physics.add.group();
    this.spells = this.physics.add.group({ allowGravity: false });

    // colliders
    this.physics.add.collider(this.pickups, this.solids);
    this.physics.add.overlap(this.spells, this.enemies, (sp, e) => {
      const en = e as Enemy;
      const orb = sp as Phaser.GameObjects.Image;
      if (en.dead || !orb.active) return;
      en.takeDamage(3 + this.player.mods.attackDamage, this.player.x);
      orb.destroy();
    });
    this.physics.add.overlap(this.spells, this.boss, (sp) => {
      const orb = sp as Phaser.GameObjects.Image;
      if (!this.boss.awake || !orb.active) return;
      this.boss.takeDamage(3 + this.player.mods.attackDamage, this.player.x);
      orb.destroy();
    });
    this.physics.add.collider(this.player, this.solids);
    this.physics.add.collider(this.enemies, this.solids);
    this.physics.add.collider(this.boss, this.solids);
    this.physics.add.overlap(this.player, this.hazards, () => this.player.takeDamage(1, this.player.x + 1));
    this.physics.add.overlap(this.player, this.enemies, (_p, e) => {
      const en = e as Enemy;
      if (!en.dead) this.player.takeDamage(en.contactDamage, en.x);
    });
    this.physics.add.overlap(this.player, this.boss, () => {
      if (this.boss.awake) this.player.takeDamage(1, this.boss.x);
    });
    this.physics.add.overlap(this.hitboxes, this.enemies, (hb, e) => {
      const en = e as Enemy;
      const box = hb as Phaser.GameObjects.Rectangle & { hitList?: Set<Enemy>; dmg: number };
      if (en.dead || box.hitList?.has(en)) return;
      box.hitList?.add(en);
      en.takeDamage(box.dmg, this.player.x);
    });
    this.physics.add.overlap(this.hitboxes, this.boss, (hb) => {
      const box = hb as Phaser.GameObjects.Rectangle & { bossHit?: boolean; dmg: number };
      if (box.bossHit || !this.boss.awake) return;
      box.bossHit = true;
      this.boss.takeDamage(box.dmg, this.player.x);
    });

    // camera
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12, 0, 60);
    this.cameras.main.setDeadzone(120, 90);
    this.cameras.main.fadeIn(700);

    // input
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys("A,D,LEFT,RIGHT,W,UP,SPACE,J,K,L,S,SHIFT,ESC,P") as Record<KeyName, Phaser.Input.Keyboard.Key>;
    kb.on("keydown-SPACE", () => this.player.bufferJump());
    kb.on("keyup-SPACE", () => this.player.setJumpHeld(false));
    kb.on("keydown-W", () => this.player.bufferJump());
    kb.on("keydown-UP", () => this.player.bufferJump());
    kb.on("keydown-J", () => this.player.tryAttack());
    kb.on("keydown-K", () => this.player.tryDash());
    kb.on("keydown-SHIFT", () => this.player.tryDash());
    kb.on("keydown-L", () => this.player.castSpell());
    kb.on("keydown-ESC", () => this.togglePause());
    kb.on("keydown-P", () => this.togglePause());
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (p.rightButtonDown()) this.player.tryDash();
      else this.player.tryAttack();
    });
    this.input.mouse?.disableContextMenu();

    this.scene.launch("UI");
    this.events.emit("hp", this.player.hp, TUNE.playerMaxHp);
  }

  togglePause() {
    if (this.ended) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.persist();
      this.scene.launch("Pause");
      this.scene.bringToTop("Pause");
    } else {
      this.physics.resume();
      this.scene.stop("Pause");
    }
    this.game.events.emit("pause-toggle", this.paused);
    sfx("ui");
  }

  /** Write current run progress to the save slot. */
  persist() {
    writeSave({
      kills: this.kills,
      deaths: this.deaths,
      soul: this.player?.soul ?? 0,
      maxHp: this.player?.maxHp ?? TUNE.playerMaxHp,
      shrineLit: this.shrineLit,
      bossDefeated: this.boss ? this.boss.hp <= 0 : false,
      room: Math.max(0, this.currentRoom),
      checkpoint: { ...this.checkpoint },
      playMs: getSave().playMs + Math.max(0, this.time.now - this.startedAt),
    });
    this.startedAt = this.time.now;
  }

  /* ---- soul, spells, drops ---- */

  spawnSpell(x: number, y: number, dir: number) {
    const orb = this.physics.add.image(x, y, "spell_orb").setDepth(DEPTH.fx).setFlipX(dir < 0);
    orb.setBlendMode(Phaser.BlendModes.ADD);
    this.spells.add(orb);
    (orb.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    orb.setVelocityX(dir * 700);
    this.tweens.add({ targets: orb, scaleY: 1.25, duration: 120, yoyo: true, repeat: -1 });
    this.time.delayedCall(900, () => orb.destroy());
  }

  onSoulChanged(soul: number) {
    this.events.emit("soul", soul, this.player.maxSoul);
  }

  onFocusProgress(pct: number) {
    this.events.emit("focus", pct);
  }

  private spawnDrops(x: number, y: number, tier: number) {
    const mods = this.player.mods;
    const soulCount = tier + mods.dropBonus;
    for (let i = 0; i < soulCount; i++) {
      this.pickups.add(new Pickup(this, "soul", x + Phaser.Math.Between(-10, 10), y - 10));
    }
    if (Math.random() < 0.25 + tier * 0.06) {
      this.pickups.add(new Pickup(this, "life", x, y - 14));
    }
    if (Math.random() < mods.shardChance) {
      this.pickups.add(new Pickup(this, "shard", x, y - 20));
    }
  }

  private collect(kind: PickupKind) {
    if (kind === "soul") {
      this.player.addSoul(11);
    } else if (kind === "life") {
      if (!this.player.heal(1)) this.player.addSoul(14);
    } else {
      this.player.raiseMaxHp();
      writeSave({ maxHp: this.player.maxHp });
      this.game.events.emit("toast", "Mask fragment bound — max life up");
    }
  }

  setPaused(v: boolean) {
    if (this.paused !== v) this.togglePause();
  }

  /* --- host API --- */
  shake(intensity: number, dur: number) {
    this.cameras.main.shake(dur, intensity);
  }

  hitStop(ms: number) {
    if (this.paused) return;
    this.time.timeScale = 0.001;
    this.physics.world.timeScale = 8;
    this.time.delayedCall(1, () => undefined);
    window.setTimeout(() => {
      this.time.timeScale = 1;
      this.physics.world.timeScale = 1;
    }, ms);
  }

  spawnAttackHitbox(p: { x: number; y: number; w: number; h: number; damage: number; dir: number; durationMs: number }) {
    const box = this.add.rectangle(p.x, p.y, p.w, p.h, 0xffffff, 0) as Phaser.GameObjects.Rectangle & {
      hitList: Set<Enemy>;
      dmg: number;
    };
    box.hitList = new Set();
    box.dmg = p.damage;
    this.physics.add.existing(box);
    (box.body as Phaser.Physics.Arcade.Body).setAllowGravity(false);
    this.hitboxes.add(box);
    // slash fx
    const fx = this.add
      .image(p.x, p.y, "spark")
      .setDepth(DEPTH.fx)
      .setScale(p.w / 30, p.h / 24)
      .setAlpha(0.7)
      .setAngle(p.dir * 18)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setTint(0xffd89b);
    this.tweens.add({
      targets: fx,
      alpha: 0,
      scaleX: fx.scaleX * 1.6,
      angle: p.dir * -14,
      duration: 190,
      ease: "Cubic.easeOut",
      onComplete: () => fx.destroy(),
    });
    const em = this.add.particles(p.x, p.y, "spark", {
      speed: { min: 80, max: 220 },
      angle: p.dir > 0 ? { min: -45, max: 45 } : { min: 135, max: 225 },
      lifespan: 260,
      scale: { start: 0.35, end: 0 },
      tint: 0xffe9c4,
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(6);
    this.time.delayedCall(400, () => em.destroy());
    this.time.delayedCall(p.durationMs, () => box.destroy());
  }

  onPlayerDamaged(hp: number) {
    this.events.emit("hp", hp, TUNE.playerMaxHp);
    this.cameras.main.flash(120, 120, 20, 20);
  }

  onPlayerDied() {
    this.deaths++;
    track("death", { room: Math.max(0, this.currentRoom), ms: this.time.now - this.startedAt });
    const inBossFight = this.boss?.awake === true && this.boss.hp > 0;
    this.cameras.main.fadeOut(500);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      // A boss death is the one moment a revive is worth an ad to the player.
      if (inBossFight && canShowRewarded()) {
        this.physics.pause();
        this.game.events.emit("revive-offer");
        this.game.events.once("revive-result", (revived: boolean) => {
          this.physics.resume();
          if (revived) {
            this.player.respawnAt(ARENA.x1 + 120, GROUND_TOP - 80);
            this.player.hp = this.player.maxHp;
            this.events.emit("hp", this.player.hp, this.player.maxHp);
            this.cameras.main.fadeIn(500);
            return;
          }
          this.completeRespawn();
        });
        return;
      }
      void requestMidgameAd();
      this.completeRespawn();
    });
  }

  private completeRespawn() {
    this.player.respawnAt(this.checkpoint.x, this.checkpoint.y);
    this.events.emit("hp", this.player.hp, TUNE.playerMaxHp);
    if (this.boss.awake && !this.bossReset()) return;
    this.cameras.main.fadeIn(500);
  }



  private bossReset() {
    if (this.boss.active && this.boss.hp > 0) {
      this.boss.hp = this.boss.maxHp;
      this.boss.phase2 = false;
      this.boss.awake = false;
      this.boss.bossState = "dormant";
      this.boss.play("b_dormant", true);
      this.bossTriggered = false;
      this.gateWall?.destroy();
      this.gateWall = undefined;
      this.game.events.emit("boss-hide");
    }
    this.cameras.main.fadeIn(500);
    return true;
  }

  onEnemyKilled(e: Enemy) {
    this.kills++;
    this.killBank++;
    const tier = e.kind === "sentinel" ? 3 : e.kind === "crawler" ? 2 : 1;
    this.spawnDrops(e.x, e.y, tier);
    if (this.killBank >= KILLS_PER_POINT) {
      this.killBank -= KILLS_PER_POINT;
      const save = getSave();
      writeSave({ points: save.points + 1 });
      this.game.events.emit("toast", "Ember earned — spend it in the skill tree (ESC)");
    }
  }

  onBossHpChanged(pct: number) {
    this.game.events.emit("boss-hp", pct);
  }

  onBossPhase2() {
    this.game.events.emit("boss-phase", 2);
    this.cameras.main.flash(400, 255, 190, 110);
  }

  onBossDefeated() {
    this.game.events.emit("boss-hide");
    this.gateWall?.destroy();
    this.gateWall = undefined;
    this.portalSprite.setAlpha(1);
    this.tweens.add({ targets: this.portalSprite, alpha: { from: 0.7, to: 1 }, duration: 900, yoyo: true, repeat: -1 });
    sfx("victory");
  }

  private lightShrine() {
    if (this.shrineLit) return;
    this.shrineLit = true;
    this.shrineSprite.setFrame(2);
    this.checkpoint = { x: SHRINE.x - 60, y: SHRINE.y - 60 };
    this.player.hp = TUNE.playerMaxHp;
    this.events.emit("hp", this.player.hp, TUNE.playerMaxHp);
    this.game.events.emit("toast", "Shrine lit — checkpoint saved");
    this.persist();
    sfx("checkpoint");
    const em = this.add.particles(SHRINE.x, SHRINE.y - 90, "amber_dot", {
      speed: { min: 20, max: 90 },
      lifespan: 1400,
      scale: { start: 0.7, end: 0 },
      frequency: 120,
    });
    em.setDepth(DEPTH.fx);
  }

  private triggerBoss() {
    if (this.bossTriggered) return;
    this.bossTriggered = true;
    track("boss_engage", { room: Math.max(0, this.currentRoom) });
    this.checkpoint = { x: ARENA.x1 + 60, y: 900 };
    this.boss.wake();
    this.game.events.emit("boss-show");
    this.gateWall = this.add.rectangle(ARENA.x1, 700, 24, 400, 0x1a1c24, 0);
    this.physics.add.existing(this.gateWall, true);
    this.physics.add.collider(this.player, this.gateWall);
    this.cameras.main.flash(600, 255, 190, 110);
  }

  override update(time: number, delta: number) {
    if (this.paused || this.ended) return;
    const k = this.keys;
    const left = k.A.isDown || k.LEFT.isDown;
    const right = k.D.isDown || k.RIGHT.isDown;
    this.player.setJumpHeld(k.SPACE.isDown || k.W.isDown || k.UP.isDown);
    this.player.updateFocus(k.S.isDown, time);
    this.player.update(time, delta, { left, right });

    this.pickups.getChildren().forEach((o) => {
      (o as Pickup).tick(this.player.x, this.player.y, (kind) => this.collect(kind));
    });

    this.lantern.setPosition(this.player.x, this.player.y - 6);
    this.lantern.setAlpha(0.14 + Math.sin(time / 500) * 0.02);

    // parallax scroll
    const sx = this.cameras.main.scrollX;
    const sy = this.cameras.main.scrollY;
    const factors = [0.08, 0.2, 0.4];
    this.bg.forEach((t, i) => {
      t.tilePositionX = sx * factors[i]!;
      t.tilePositionY = sy * factors[i]! * 0.5;
    });
    this.fg.tilePositionX = sx * 1.25;

    // hints
    this.hintTexts.forEach((h) => {
      const d = Math.abs(this.player.x - h.x);
      const target = d < 220 ? 1 : 0;
      h.obj.setAlpha(Phaser.Math.Linear(h.obj.alpha, target, 0.08));
    });

    // room labels
    let room = 0;
    ROOM_LABELS.forEach((r, i) => {
      if (this.player.x >= r.x) room = i;
    });
    if (room !== this.currentRoom) {
      this.currentRoom = room;
      track("room_enter", { room, ms: this.time.now - this.startedAt });
      this.roomLabel.setText(ROOM_LABELS[room]!.text).setAlpha(0);
      this.tweens.add({ targets: this.roomLabel, alpha: 1, duration: 500, yoyo: true, hold: 1400 });
    }

    // triggers
    if (!this.shrineLit && Math.abs(this.player.x - SHRINE.x) < 70 && Math.abs(this.player.y - SHRINE.y) < 140) {
      this.lightShrine();
    }
    if (!this.bossTriggered && this.player.x > ARENA.x1 + 40) this.triggerBoss();

    if (this.boss.hp <= 0 && !this.ended && Math.abs(this.player.x - PORTAL.x) < 70 && this.player.y > PORTAL.y - 220) {
      this.finish();
    }

    if (this.player.y > DEATH_Y && !this.player.isDead) {
      this.player.takeDamage(99, this.player.x);
    }
  }

  private finish() {
    this.ended = true;
    this.persist();
    writeSave({ bossDefeated: true });
    track("boss_defeat", { ms: this.time.now - this.startedAt });
    track("victory", { ms: this.time.now - this.startedAt, room: Math.max(0, this.currentRoom) });
    this.player.lockControl(true);
    this.cameras.main.fadeOut(1200);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop("UI");
      this.scene.start("Victory", {
        timeMs: this.time.now - this.startedAt,
        kills: this.kills,
        deaths: this.deaths,
      });
    });
  }
}
