import * as Phaser from "phaser";
import { TUNE, DEPTH } from "../config";
import { PLAYER_ANIMS } from "../textures";
import { sfx } from "../audio";
import { computeMods, type Mods } from "../skills";

export type PlayerState =
  | "idle"
  | "run"
  | "rise"
  | "fall"
  | "land"
  | "attack"
  | "dash"
  | "hurt"
  | "dead";

export interface PlayerHost extends Phaser.Scene {
  spawnAttackHitbox(p: {
    x: number;
    y: number;
    w: number;
    h: number;
    damage: number;
    dir: number;
    durationMs: number;
  }): void;
  spawnSpell(x: number, y: number, dir: number): void;
  onPlayerDamaged(hp: number): void;
  onPlayerDied(): void;
  onSoulChanged(soul: number): void;
  onFocusProgress(pct: number): void;
  shake(intensity: number, dur: number): void;
}


export interface Player {
  body: Phaser.Physics.Arcade.Body;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  mods: Mods = computeMods();
  maxHp = TUNE.playerMaxHp;
  hp = TUNE.playerMaxHp;
  soul = 0;
  maxSoul = 99;
  focusPct = 0;
  private focusStartedAt = -1;
  private spellReadyAt = 0;
  pstate: PlayerState = "idle";
  facing = 1;

  private lastGroundedAt = 0;
  private jumpBufferedAt = -9999;
  private jumpHeld = false;
  private dashEndAt = 0;
  private dashReadyAt = 0;
  private airDashUsed = false;
  private airJumpUsed = false;

  private stateUntil = 0;
  private comboStep = 0;
  private comboExpires = 0;
  private attackSwung = false;
  private invulnUntil = 0;
  private controlLocked = false;
  private runDustAt = 0;
  host: PlayerHost;

  constructor(scene: PlayerHost, x: number, y: number) {
    super(scene, x, y, "w_idle", 0);
    this.host = scene;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.player);
    this.body.setSize(22, 42);
    this.body.setOffset(25, 24);
    this.body.setMaxVelocityY(TUNE.terminalVel);
    this.setGravityY(TUNE.gravity);
    this.maxHp = TUNE.playerMaxHp + this.mods.bonusMaxHp;
    this.hp = this.maxHp;
    this.play(PLAYER_ANIMS.idle.key);
  }

  get dashCooldownPct() {
    const now = this.scene.time.now;
    if (now >= this.dashReadyAt) return 1;
    return 1 - (this.dashReadyAt - now) / this.mods.dashCooldownMs;
  }

  get invulnerable() {
    return this.scene.time.now < this.invulnUntil;
  }

  get isDead() {
    return this.pstate === "dead";
  }

  lockControl(v: boolean) {
    this.controlLocked = v;
    if (v) this.setVelocityX(0);
  }

  respawnAt(x: number, y: number) {
    this.setPosition(x, y);
    this.setVelocity(0, 0);
    this.hp = this.maxHp;
    this.pstate = "idle";
    this.setAlpha(1);
    this.setActive(true).setVisible(true);
    this.body.enable = true;
    this.controlLocked = false;
    this.invulnUntil = this.scene.time.now + 600;
    this.comboStep = 0;
    this.airDashUsed = false;
    this.airJumpUsed = false;
    this.focusStartedAt = -1;
    this.focusPct = 0;
    this.host.onFocusProgress(0);
    this.play(PLAYER_ANIMS.idle.key, true);
  }

  /* ---- soul & skills ---- */

  addSoul(n: number) {
    this.soul = Phaser.Math.Clamp(this.soul + n, 0, this.maxSoul);
    this.host.onSoulChanged(this.soul);
  }

  heal(n: number) {
    if (this.isDead || this.hp >= this.maxHp) return false;
    this.hp = Math.min(this.maxHp, this.hp + n);
    this.host.onPlayerDamaged(this.hp);
    sfx("heal");
    const em = this.scene.add.particles(this.x, this.y, "amber_dot", {
      speed: { min: 20, max: 90 },
      lifespan: 620,
      scale: { start: 0.7, end: 0 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(14);
    this.scene.time.delayedCall(800, () => em.destroy());
    return true;
  }

  raiseMaxHp() {
    this.maxHp += 1;
    this.hp = this.maxHp;
    this.host.onPlayerDamaged(this.hp);
  }

  /** Hold FOCUS to spend soul and mend one mask. */
  updateFocus(held: boolean, time: number) {
    const grounded = this.body.blocked.down;
    const canFocus =
      held && grounded && !this.isDead && !this.controlLocked && this.soul >= this.mods.soulCost && this.hp < this.maxHp &&
      this.pstate !== "dash" && this.pstate !== "attack" && this.pstate !== "hurt";
    if (!canFocus) {
      if (this.focusStartedAt >= 0) {
        this.focusStartedAt = -1;
        this.focusPct = 0;
        this.host.onFocusProgress(0);
      }
      return;
    }
    if (this.focusStartedAt < 0) this.focusStartedAt = time;
    this.setVelocityX(0);
    this.focusPct = Phaser.Math.Clamp((time - this.focusStartedAt) / 900, 0, 1);
    this.host.onFocusProgress(this.focusPct);
    if (this.focusPct >= 1) {
      this.focusStartedAt = -1;
      this.focusPct = 0;
      this.host.onFocusProgress(0);
      this.addSoul(-this.mods.soulCost);
      this.heal(1);
    }
  }

  get focusing() {
    return this.focusStartedAt >= 0;
  }

  /** Spirit blast — a ranged soul projectile. */
  castSpell() {
    const now = this.scene.time.now;
    if (this.isDead || this.controlLocked || now < this.spellReadyAt) return;
    if (this.soul < this.mods.soulCost) {
      this.host.onSoulChanged(this.soul);
      return;
    }
    this.spellReadyAt = now + 420;
    this.addSoul(-this.mods.soulCost);
    this.pstate = "attack";
    this.attackSwung = true;
    this.stateUntil = now + 240;
    this.play(PLAYER_ANIMS.atk2.key, true);
    this.setVelocityX(-this.facing * 90);
    this.host.spawnSpell(this.x + this.facing * 26, this.y - 6, this.facing);
    this.host.shake(0.006, 120);
    sfx("spell");
  }


  bufferJump() {
    this.jumpBufferedAt = this.scene.time.now;
  }
  setJumpHeld(v: boolean) {
    this.jumpHeld = v;
    if (!v && this.body.velocity.y < -80 && this.pstate !== "dash") {
      this.setVelocityY(this.body.velocity.y * TUNE.jumpCutMultiplier);
    }
  }

  tryDash() {
    const now = this.scene.time.now;
    if (this.controlLocked || this.isDead) return;
    if (now < this.dashReadyAt) return;
    if (!this.body.blocked.down && this.airDashUsed) return;
    if (!this.body.blocked.down) this.airDashUsed = true;
    this.pstate = "dash";
    this.stateUntil = now + TUNE.dashDurationMs;
    this.dashEndAt = this.stateUntil;
    this.dashReadyAt = this.stateUntil + this.mods.dashCooldownMs;
    this.setVelocityX(this.facing * TUNE.dashSpeed);
    this.setVelocityY(0);
    this.body.setAllowGravity(false);
    this.play(PLAYER_ANIMS.dash.key, true);
    sfx("dash");
    this.host.shake(0.004, 90);
    this.emitDashTrail();
  }

  private emitDashTrail() {
    const ghost = () => {
      if (this.pstate !== "dash") return;
      const img = this.scene.add
        .image(this.x, this.y, this.texture.key, this.frame.name)
        .setFlipX(this.flipX)
        .setAlpha(0.45)
        .setTint(0xffb347)
        .setDepth(DEPTH.player - 1);
      this.scene.tweens.add({
        targets: img,
        alpha: 0,
        duration: 220,
        onComplete: () => img.destroy(),
      });
    };
    ghost();
    this.scene.time.delayedCall(50, ghost);
    this.scene.time.delayedCall(100, ghost);
  }

  tryAttack() {
    const now = this.scene.time.now;
    if (this.controlLocked || this.isDead) return;
    if (this.pstate === "attack" || this.pstate === "dash" || this.pstate === "hurt") return;
    if (now > this.comboExpires) this.comboStep = 0;
    this.comboStep = (this.comboStep % 3) + 1;
    this.comboExpires = now + this.mods.comboWindowMs + TUNE.attackActiveMs;
    this.pstate = "attack";
    this.attackSwung = false;
    const total = TUNE.attackStartupMs + TUNE.attackActiveMs + this.mods.attackRecoverMs + (this.comboStep === 3 ? 90 : 0);
    this.stateUntil = now + total;
    const key = [PLAYER_ANIMS.atk1, PLAYER_ANIMS.atk2, PLAYER_ANIMS.atk3][this.comboStep - 1]!.key;
    this.play(key, true);
    sfx("swing");
    if (this.body.blocked.down) this.setVelocityX(this.facing * 90);
  }

  private doSwing() {
    this.attackSwung = true;
    const w = this.comboStep === 3 ? 78 : 62;
    this.host.spawnAttackHitbox({
      x: this.x + this.facing * (w / 2 + 12),
      y: this.y - 6,
      w,
      h: 52,
      damage: this.mods.attackDamage + (this.comboStep === 3 ? 1 : 0),
      dir: this.facing,
      durationMs: TUNE.attackActiveMs,
    });
  }

  takeDamage(amount: number, fromX: number) {
    const now = this.scene.time.now;
    if (this.isDead || this.invulnerable || this.pstate === "dash") return;
    this.hp = Math.max(0, this.hp - amount);
    this.invulnUntil = now + TUNE.invulnMs;
    this.host.onPlayerDamaged(this.hp);
    this.host.shake(0.01, 160);
    if (this.hp <= 0) {
      this.die();
      return;
    }
    sfx("playerHit");
    this.pstate = "hurt";
    this.stateUntil = now + 260;
    this.body.setAllowGravity(true);
    const dir = this.x < fromX ? -1 : 1;
    this.setVelocity(dir * 240, -260);
    this.play(PLAYER_ANIMS.hurt.key, true);
    this.scene.tweens.add({
      targets: this,
      alpha: 0.25,
      duration: 90,
      yoyo: true,
      repeat: Math.floor(TUNE.invulnMs / 180),
      onComplete: () => this.setAlpha(1),
    });
  }

  private die() {
    this.pstate = "dead";
    sfx("death");
    this.body.setAllowGravity(true);
    this.setVelocity(0, -180);
    this.play(PLAYER_ANIMS.death.key, true);
    const em = this.scene.add.particles(this.x, this.y, "amber_dot", {
      speed: { min: 40, max: 160 },
      lifespan: 1200,
      quantity: 22,
      scale: { start: 0.9, end: 0 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(22);
    this.scene.time.delayedCall(1400, () => em.destroy());
    this.scene.time.delayedCall(900, () => this.host.onPlayerDied());
  }

  override update(time: number, delta: number, input: { left: boolean; right: boolean }) {
    if (this.isDead) return;
    const dt = delta / 1000;
    const onGround = this.body.blocked.down || this.body.touching.down;
    if (onGround) {
      this.lastGroundedAt = time;
      this.airDashUsed = false;
      this.airJumpUsed = false;
    }

    // state timers
    if (this.pstate === "dash" && time >= this.dashEndAt) {
      this.body.setAllowGravity(true);
      this.setVelocityX(this.facing * TUNE.maxSpeed * 0.7);
      this.pstate = onGround ? "idle" : "fall";
    }
    if (this.pstate === "attack") {
      const elapsed = time - (this.stateUntil - (TUNE.attackStartupMs + TUNE.attackActiveMs + TUNE.attackRecoverMs));
      if (!this.attackSwung && elapsed >= TUNE.attackStartupMs) this.doSwing();
      if (time >= this.stateUntil) this.pstate = onGround ? "idle" : "fall";
    }
    if ((this.pstate === "hurt" || this.pstate === "land") && time >= this.stateUntil) {
      this.pstate = onGround ? "idle" : "fall";
    }

    const busy = this.pstate === "dash" || this.pstate === "hurt" || this.focusing;
    const attacking = this.pstate === "attack";

    // horizontal movement
    if (!busy && !this.controlLocked) {
      let dir = 0;
      if (input.left) dir -= 1;
      if (input.right) dir += 1;
      if (dir !== 0 && !attacking) this.facing = dir;
      const control = attacking ? 0.25 : 1;
      const a = (onGround ? TUNE.accel : TUNE.airAccel) * control;
      if (dir !== 0) {
        this.setVelocityX(
          Phaser.Math.Clamp(this.body.velocity.x + dir * a * dt, -TUNE.maxSpeed, TUNE.maxSpeed),
        );
      } else {
        const d = TUNE.decel * dt * (onGround ? 1 : 0.45);
        const v = this.body.velocity.x;
        this.setVelocityX(Math.abs(v) <= d ? 0 : v - Math.sign(v) * d);
      }
    }

    // jump (coyote + buffer + air jump)
    if (!busy && !this.controlLocked && this.pstate !== "attack") {
      const canCoyote = time - this.lastGroundedAt <= TUNE.coyoteMs;
      const buffered = time - this.jumpBufferedAt <= TUNE.jumpBufferMs;
      if (buffered && canCoyote) {
        this.jumpBufferedAt = -9999;
        this.lastGroundedAt = -9999;
        this.setVelocityY(-this.mods.jumpVel);
        this.pstate = "rise";
        sfx("jump");
        this.puff(0.5);
      } else if (buffered && !onGround && !this.airJumpUsed) {
        this.jumpBufferedAt = -9999;
        this.airJumpUsed = true;
        this.setVelocityY(-this.mods.airJumpVel);
        this.pstate = "rise";
        sfx("jump");
        this.airJumpRing();
      }
    }

    // variable jump height: hold to rise higher
    const rising = this.body.velocity.y < 0 && this.pstate !== "dash";
    this.setGravityY(rising && this.jumpHeld ? TUNE.gravity * this.mods.jumpHoldGravityMult : TUNE.gravity);


    // landing detection
    if (onGround && (this.pstate === "fall" || this.pstate === "rise")) {
      this.pstate = "land";
      this.stateUntil = time + 130;
      sfx("land");
      this.puff(1);
      this.host.shake(0.002, 70);
    }
    if (!onGround && !busy && !attacking && this.pstate !== "rise" && this.pstate !== "fall") {
      this.pstate = this.body.velocity.y < 0 ? "rise" : "fall";
    }
    if (this.pstate === "rise" && this.body.velocity.y >= 0) this.pstate = "fall";
    if (onGround && (this.pstate === "idle" || this.pstate === "run")) {
      this.pstate = Math.abs(this.body.velocity.x) > 12 ? "run" : "idle";
    }

    // run dust
    if (this.pstate === "run" && time > this.runDustAt) {
      this.runDustAt = time + 150;
      this.puff(0.3);
    }

    this.setFlipX(this.facing < 0);
    this.applyAnim();
  }

  /** Expanding amber ring + motes when the second jump fires. */
  private airJumpRing() {
    const ring = this.scene.add
      .image(this.x, this.y + 18, "amber_dot")
      .setScale(2)
      .setAlpha(0.6)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(DEPTH.fx);
    this.scene.tweens.add({
      targets: ring,
      scaleX: 13,
      scaleY: 5,
      alpha: 0,
      duration: 320,
      ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    const em = this.scene.add.particles(this.x, this.y + 16, "spark", {
      speed: { min: 60, max: 170 },
      lifespan: 420,
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      tint: 0xffd89b,
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(10);
    this.scene.time.delayedCall(600, () => em.destroy());
  }

  private puff(scale: number) {
    const em = this.scene.add.particles(this.x, this.y + 22, "dust", {
      speed: { min: 20, max: 70 * scale },
      lifespan: 380,
      scale: { start: 0.5 * scale, end: 0 },
      alpha: { start: 0.5, end: 0 },
      emitting: false,
    });
    em.setDepth(DEPTH.fx);
    em.explode(Math.ceil(4 * scale));
    this.scene.time.delayedCall(500, () => em.destroy());
  }

  private applyAnim() {
    const A = PLAYER_ANIMS;
    let key: string | null = null;
    switch (this.pstate) {
      case "idle":
        key = A.idle.key;
        break;
      case "run":
        key = A.run.key;
        break;
      case "rise":
        key = A.rise.key;
        break;
      case "fall":
        key = A.fall.key;
        break;
      case "land":
        key = A.land.key;
        break;
      case "dash":
        key = A.dash.key;
        break;
      default:
        key = null;
    }
    if (key && this.anims.currentAnim?.key !== key) this.play(key, true);
  }
}
