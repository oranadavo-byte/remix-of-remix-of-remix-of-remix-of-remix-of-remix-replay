import * as Phaser from "phaser";
import { DEPTH } from "../config";
import { ENEMY_ANIMS } from "../textures";
import { sfx } from "../audio";

export type EnemyKind = "crawler" | "wisp" | "sentinel";

export interface EnemyHost extends Phaser.Scene {
  playerRef: Phaser.Physics.Arcade.Sprite & { isDead: boolean };
  shake(intensity: number, dur: number): void;
  hitStop(ms: number): void;
  onEnemyKilled(e: Enemy): void;
}

const STATS: Record<EnemyKind, { hp: number; speed: number; damage: number; w: number; h: number; ox: number; oy: number }> = {
  crawler: { hp: 3, speed: 90, damage: 1, w: 44, h: 22, ox: 14, oy: 22 },
  wisp: { hp: 2, speed: 70, damage: 1, w: 30, h: 28, ox: 17, oy: 16 },
  sentinel: { hp: 6, speed: 60, damage: 2, w: 44, h: 74, ox: 26, oy: 30 },
};

export interface Enemy {
  body: Phaser.Physics.Arcade.Body;
}

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  dead = false;
  private host: EnemyHost;
  private homeX: number;
  private homeY: number;
  private patrolRange: number;
  private dir = 1;
  private stateName = "patrol";
  private stateUntil = 0;
  private nextActionAt = 0;
  private hurtUntil = 0;
  private t = 0;

  constructor(host: EnemyHost, kind: EnemyKind, x: number, y: number, range = 160) {
    const first = kind === "crawler" ? "c_idle" : kind === "wisp" ? "s_float" : "n_idle";
    super(host, x, y, first, 0);
    this.kind = kind;
    this.host = host;
    this.homeX = x;
    this.homeY = y;
    this.patrolRange = range;
    const st = STATS[kind];
    this.hp = st.hp;
    this.maxHp = st.hp;
    host.add.existing(this);
    host.physics.add.existing(this);
    this.setDepth(DEPTH.entities);
    this.body.setSize(st.w, st.h);
    this.body.setOffset(st.ox, st.oy);
    if (kind === "wisp") {
      this.body.setAllowGravity(false);
    } else {
      this.setGravityY(1700);
    }
    this.play(this.anim("idle") ?? this.anim("float")!, true);
  }

  private anim(name: string): string | undefined {
    const grp = ENEMY_ANIMS[this.kind] as unknown as Record<string, { key: string }>;
    return grp[name]?.key;
  }

  private setAnim(name: string) {
    const k = this.anim(name);
    if (k && this.anims.currentAnim?.key !== k) this.play(k, true);
  }

  takeDamage(amount: number, fromX: number) {
    if (this.dead) return;
    this.hp -= amount;
    this.hurtUntil = this.scene.time.now + 130;
    sfx("enemyHit");
    this.host.hitStop(50);
    this.host.shake(0.006, 110);
    const dir = this.x < fromX ? -1 : 1;
    if (this.kind !== "sentinel") this.setVelocityX(dir * 170);
    this.burst(fromX);
    if (this.hp <= 0) {
      this.die();
    } else {
      this.setAnim("hurt");
      this.stateName = "hurt";
      this.stateUntil = this.scene.time.now + 220;
    }
  }

  private burst(fromX: number) {
    const em = this.scene.add.particles(this.x + (this.x < fromX ? 12 : -12), this.y - 8, "spark", {
      speed: { min: 90, max: 260 },
      lifespan: 320,
      scale: { start: 0.7, end: 0 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(10);
    this.scene.time.delayedCall(500, () => em.destroy());
  }

  private die() {
    this.dead = true;
    this.body.enable = false;
    sfx("enemyDeath");
    this.setAnim("death");
    this.host.onEnemyKilled(this);
    const em = this.scene.add.particles(this.x, this.y - 10, this.kind === "wisp" ? "spore" : "amber_dot", {
      speed: { min: 30, max: 150 },
      lifespan: 900,
      scale: { start: 0.8, end: 0 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(16);
    this.scene.tweens.add({ targets: this, alpha: 0, duration: 700, delay: 250 });
    this.scene.time.delayedCall(1100, () => {
      em.destroy();
      this.destroy();
    });
  }

  get contactDamage() {
    return STATS[this.kind].damage;
  }

  override preUpdate(time: number, delta: number) {
    super.preUpdate(time, delta);
    if (this.dead) return;
    this.t += delta;
    this.setTintFill(time < this.hurtUntil ? 0xffffff : 0);
    if (time >= this.hurtUntil) this.clearTint();

    if (this.stateName === "hurt") {
      if (time < this.stateUntil) return;
      this.stateName = "patrol";
    }

    const p = this.host.playerRef;
    const alive = p && !p.isDead;
    const dx = alive ? p.x - this.x : 9999;
    const dy = alive ? p.y - this.y : 9999;
    const dist = Math.hypot(dx, dy);

    switch (this.kind) {
      case "crawler":
        this.updateCrawler(time, dist, dx);
        break;
      case "wisp":
        this.updateWisp(time, dist, dx, dy);
        break;
      case "sentinel":
        this.updateSentinel(time, dist, dx);
        break;
    }
    if (this.kind !== "wisp") this.setFlipX(this.dir < 0);
    else this.setFlipX(this.dir < 0);
  }

  private updateCrawler(time: number, dist: number, dx: number) {
    const st = STATS.crawler;
    if (this.stateName === "lunge") {
      if (time >= this.stateUntil) this.stateName = "patrol";
      return;
    }
    if (dist < 300 && Math.abs(dx) > 6) {
      this.dir = Math.sign(dx);
      this.setVelocityX(this.dir * st.speed * 1.5);
      this.setAnim("crawl");
      if (dist < 110 && time > this.nextActionAt) {
        this.stateName = "lunge";
        this.stateUntil = time + 380;
        this.nextActionAt = time + 1200;
        this.setVelocityX(this.dir * 330);
        this.setVelocityY(-180);
        this.setAnim("lunge");
      }
    } else {
      if (this.x > this.homeX + this.patrolRange) this.dir = -1;
      if (this.x < this.homeX - this.patrolRange) this.dir = 1;
      this.setVelocityX(this.dir * st.speed);
      this.setAnim("crawl");
    }
  }

  private updateWisp(time: number, dist: number, dx: number, dy: number) {
    const bob = Math.sin(this.t / 420) * 22;
    if (this.stateName === "charge") {
      this.setVelocity(0, 0);
      this.setAnim("charge");
      if (time >= this.stateUntil) {
        this.stateName = "strike";
        this.stateUntil = time + 520;
        const a = Math.atan2(dy, dx);
        this.setVelocity(Math.cos(a) * 340, Math.sin(a) * 340);
        this.setAnim("lunge");
      }
      return;
    }
    if (this.stateName === "strike") {
      if (time >= this.stateUntil) {
        this.stateName = "patrol";
        this.nextActionAt = time + 1400;
      }
      return;
    }
    if (dist < 340) {
      this.dir = Math.sign(dx) || 1;
      const tx = this.host.playerRef.x - this.dir * 90;
      const ty = this.host.playerRef.y - 70;
      this.setVelocity(
        Phaser.Math.Clamp((tx - this.x) * 1.6, -120, 120),
        Phaser.Math.Clamp((ty - this.y) * 1.6, -110, 110),
      );
      this.setAnim("float");
      if (dist < 260 && time > this.nextActionAt) {
        this.stateName = "charge";
        this.stateUntil = time + 520;
      }
    } else {
      this.setVelocity(Math.sin(this.t / 900) * 40, (this.homeY + bob - this.y) * 1.2);
      this.setAnim("float");
    }
  }

  private updateSentinel(time: number, dist: number, dx: number) {
    const st = STATS.sentinel;
    if (this.stateName === "windup") {
      this.setVelocityX(0);
      if (time >= this.stateUntil) {
        this.stateName = "strike";
        this.stateUntil = time + 200;
        this.setAnim("strike");
        this.swing();
      }
      return;
    }
    if (this.stateName === "strike") {
      if (time >= this.stateUntil) {
        this.stateName = "recover";
        this.stateUntil = time + 520;
        this.setAnim("recover");
      }
      return;
    }
    if (this.stateName === "recover") {
      this.setVelocityX(0);
      if (time >= this.stateUntil) this.stateName = "patrol";
      return;
    }
    if (dist < 360 && Math.abs(dx) > 4) {
      this.dir = Math.sign(dx);
      if (dist > 120) {
        this.setVelocityX(this.dir * st.speed);
        this.setAnim("walk");
      } else {
        this.setVelocityX(0);
        this.setAnim("idle");
        if (time > this.nextActionAt) {
          this.stateName = "windup";
          this.stateUntil = time + 460;
          this.nextActionAt = time + 1900;
          this.setAnim("windup");
        }
      }
    } else {
      if (this.x > this.homeX + this.patrolRange) this.dir = -1;
      if (this.x < this.homeX - this.patrolRange) this.dir = 1;
      this.setVelocityX(this.dir * st.speed * 0.6);
      this.setAnim("walk");
    }
  }

  private swing() {
    const p = this.host.playerRef;
    const reach = 120;
    if (!p || p.isDead) return;
    if (Math.abs(p.x - this.x) < reach && Math.sign(p.x - this.x) === this.dir && Math.abs(p.y - this.y) < 80) {
      (p as unknown as { takeDamage: (n: number, x: number) => void }).takeDamage(2, this.x);
    }
    const em = this.scene.add.particles(this.x + this.dir * 80, this.y - 20, "dust", {
      speed: { min: 40, max: 140 },
      lifespan: 300,
      scale: { start: 0.6, end: 0 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(8);
    this.scene.time.delayedCall(400, () => em.destroy());
  }
}
