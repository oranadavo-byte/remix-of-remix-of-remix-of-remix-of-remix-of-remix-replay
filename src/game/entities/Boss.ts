import * as Phaser from "phaser";
import { DEPTH } from "../config";
import { BOSS_ANIMS } from "../textures";
import { sfx } from "../audio";

export interface BossHost extends Phaser.Scene {
  playerRef: Phaser.Physics.Arcade.Sprite & { isDead: boolean; takeDamage: (n: number, x: number) => void };
  shake(intensity: number, dur: number): void;
  hitStop(ms: number): void;
  onBossHpChanged(pct: number): void;
  onBossPhase2(): void;
  onBossDefeated(): void;
}

type BossState = "dormant" | "awaken" | "idle" | "move" | "windup" | "slam" | "roots" | "hurt" | "dead";

export interface Boss {
  body: Phaser.Physics.Arcade.Body;
}

export class Boss extends Phaser.Physics.Arcade.Sprite {
  maxHp = 40;
  hp = 40;
  phase2 = false;
  awake = false;
  bossState: BossState = "dormant";
  private stateUntil = 0;
  private nextActionAt = 0;
  private dir = -1;
  private hurtFlashUntil = 0;
  private defeated = false;
  private host: BossHost;

  constructor(host: BossHost, x: number, y: number) {
    super(host, x, y, "b_dormant", 0);
    this.host = host;
    host.add.existing(this);
    host.physics.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(DEPTH.entities + 1);
    this.body.setSize(120, 190);
    this.body.setOffset(70, 46);
    this.setGravityY(1700);
    this.play(BOSS_ANIMS.dormant.key, true);
  }

  wake() {
    if (this.awake) return;
    this.awake = true;
    this.bossState = "awaken";
    this.stateUntil = this.scene.time.now + 1100;
    this.nextActionAt = this.stateUntil + 500;
    this.play(BOSS_ANIMS.awaken.key, true);
    sfx("bossWake");
    this.host.shake(0.02, 1200);
  }

  takeDamage(amount: number, fromX: number) {
    if (!this.awake || this.defeated) return;
    this.hp = Math.max(0, this.hp - amount);
    this.hurtFlashUntil = this.scene.time.now + 110;
    sfx("enemyHit");
    this.host.hitStop(60);
    this.host.shake(0.007, 120);
    this.host.onBossHpChanged(this.hp / this.maxHp);
    const em = this.scene.add.particles(fromX < this.x ? this.x - 50 : this.x + 50, this.y - 110, "stone_bit", {
      speed: { min: 90, max: 240 },
      lifespan: 600,
      gravityY: 500,
      scale: { start: 1, end: 0.2 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(9);
    this.scene.time.delayedCall(800, () => em.destroy());

    if (!this.phase2 && this.hp <= this.maxHp * 0.5) {
      this.phase2 = true;
      sfx("bossPhase");
      this.host.onBossPhase2();
      this.host.shake(0.02, 900);
      this.bossState = "idle";
      this.nextActionAt = this.scene.time.now + 700;
    }
    if (this.hp <= 0) this.die();
  }

  private die() {
    this.defeated = true;
    this.bossState = "dead";
    this.body.enable = false;
    this.play(BOSS_ANIMS.death.key, true);
    this.host.shake(0.03, 1600);
    const em = this.scene.add.particles(this.x, this.y - 120, "amber_dot", {
      speed: { min: 60, max: 260 },
      lifespan: 1800,
      scale: { start: 1.2, end: 0 },
      frequency: 40,
    });
    em.setDepth(DEPTH.fx);
    this.scene.time.delayedCall(2200, () => em.stop());
    this.scene.time.delayedCall(1600, () => this.host.onBossDefeated());
  }

  private slamAttack() {
    const p = this.host.playerRef;
    sfx("bossSlam");
    this.host.shake(0.022, 380);
    const gx = this.x + this.dir * 130;
    const em = this.scene.add.particles(gx, this.y, "stone_bit", {
      speed: { min: 120, max: 420 },
      angle: { min: 200, max: 340 },
      lifespan: 900,
      gravityY: 900,
      scale: { start: 1.4, end: 0.2 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(24);
    this.scene.time.delayedCall(1200, () => em.destroy());
    if (p && !p.isDead && Math.abs(p.x - gx) < 150 && Math.abs(p.y - this.y) < 160) {
      p.takeDamage(2, gx);
    }
  }

  private rootAttack() {
    const p = this.host.playerRef;
    if (!p) return;
    const count = this.phase2 ? 4 : 3;
    for (let i = 0; i < count; i++) {
      const tx = p.x + (i - (count - 1) / 2) * 130 + Phaser.Math.Between(-30, 30);
      const ty = this.y;
      const warn = this.scene.add
        .ellipse(tx, ty - 4, 60, 14, 0xffb347, 0.45)
        .setDepth(DEPTH.fx);
      this.scene.tweens.add({ targets: warn, alpha: 0.9, duration: 200, yoyo: true, repeat: 1 });
      this.scene.time.delayedCall(560, () => {
        warn.destroy();
        const spike = this.scene.add.image(tx, ty + 90, "root_spike").setOrigin(0.5, 1).setDepth(DEPTH.fx);
        this.scene.tweens.add({
          targets: spike,
          y: ty + 6,
          duration: 130,
          ease: "Back.easeOut",
          onComplete: () => {
            if (!p.isDead && Math.abs(p.x - tx) < 40 && Math.abs(p.y - ty) < 110) p.takeDamage(1, tx);
            this.scene.tweens.add({ targets: spike, y: ty + 90, alpha: 0, delay: 420, duration: 260, onComplete: () => spike.destroy() });
          },
        });
      });
    }
    sfx("bossSlam");
  }

  override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.defeated) return;
    if (time < this.hurtFlashUntil) this.setTintFill(0xffffff);
    else this.clearTint();

    if (!this.awake) return;
    const p = this.host.playerRef;
    const dx = p ? p.x - this.x : 0;
    const dist = Math.abs(dx);
    const speedMul = this.phase2 ? 1.5 : 1;

    switch (this.bossState) {
      case "awaken":
        this.setVelocityX(0);
        if (time >= this.stateUntil) this.bossState = "idle";
        break;
      case "idle":
      case "move": {
        if (p && !p.isDead) this.dir = Math.sign(dx) || this.dir;
        this.setFlipX(this.dir > 0);
        if (dist > 190) {
          this.setVelocityX(this.dir * 90 * speedMul);
          if (this.anims.currentAnim?.key !== BOSS_ANIMS.move.key) this.play(BOSS_ANIMS.move.key, true);
        } else {
          this.setVelocityX(0);
          if (this.anims.currentAnim?.key !== BOSS_ANIMS.idle.key) this.play(BOSS_ANIMS.idle.key, true);
        }
        if (time > this.nextActionAt && p && !p.isDead) {
          const useRoots = dist > 230 || (this.phase2 && Math.random() < 0.5);
          if (useRoots) {
            this.bossState = "roots";
            this.stateUntil = time + 900;
            this.nextActionAt = time + (this.phase2 ? 1500 : 2300);
            this.play(BOSS_ANIMS.root.key, true);
            this.rootAttack();
          } else {
            this.bossState = "windup";
            this.stateUntil = time + (this.phase2 ? 420 : 620);
            this.play(BOSS_ANIMS.windup.key, true);
          }
        }
        break;
      }
      case "windup":
        this.setVelocityX(0);
        if (time >= this.stateUntil) {
          this.bossState = "slam";
          this.stateUntil = time + 320;
          this.nextActionAt = time + (this.phase2 ? 1100 : 1900);
          this.play(BOSS_ANIMS.slam.key, true);
          this.slamAttack();
        }
        break;
      case "slam":
      case "roots":
        this.setVelocityX(0);
        if (time >= this.stateUntil) this.bossState = "idle";
        break;
      default:
        break;
    }
  }
}
