import * as Phaser from "phaser";
import { DEPTH } from "../config";
import { sfx } from "../audio";

export type PickupKind = "life" | "soul" | "shard";

export interface Pickup {
  body: Phaser.Physics.Arcade.Body;
}

/** Drops left behind by slain creatures: soul motes, life shards and rare mask fragments. */
export class Pickup extends Phaser.Physics.Arcade.Sprite {
  kind: PickupKind;
  private bornAt: number;
  private collected = false;

  constructor(scene: Phaser.Scene, kind: PickupKind, x: number, y: number) {
    super(scene, x, y, kind === "soul" ? "pickup_soul" : "pickup_life", 0);
    this.kind = kind;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(DEPTH.entities);
    this.bornAt = scene.time.now;
    this.body.setSize(20, 20);
    this.body.setAllowGravity(true);
    this.setGravityY(900);
    this.body.setBounce(0.45, 0.45);
    this.body.setDragX(140);
    this.setVelocity(Phaser.Math.Between(-90, 90), Phaser.Math.Between(-260, -140));
    this.play(kind === "soul" ? "pickup_soul" : "pickup_life");
    if (kind === "shard") this.setScale(1.5).setTint(0xffd89b);
    scene.tweens.add({ targets: this, alpha: { from: 1, to: 0.7 }, duration: 700, yoyo: true, repeat: -1 });
  }

  /** Drifts toward the player once close, then is absorbed. */
  tick(px: number, py: number, onCollect: (k: PickupKind) => void) {
    if (this.collected || !this.active) return;
    const now = this.scene.time.now;
    const d = Phaser.Math.Distance.Between(this.x, this.y, px, py);
    if (d < 130) {
      const ang = Math.atan2(py - this.y, px - this.x);
      this.body.setAllowGravity(false);
      this.setVelocity(Math.cos(ang) * 420, Math.sin(ang) * 420);
    }

    if (d < 34) {
      this.collected = true;
      sfx("pickup");
      onCollect(this.kind);
      const em = this.scene.add.particles(this.x, this.y, "spark", {
        speed: { min: 40, max: 130 },
        lifespan: 340,
        scale: { start: 0.4, end: 0 },
        tint: this.kind === "soul" ? 0x8fd8d2 : 0xffd89b,
        emitting: false,
      });
      em.setDepth(DEPTH.fx);
      em.explode(8);
      this.scene.time.delayedCall(500, () => em.destroy());
      this.destroy();
      return;
    }
    if (now - this.bornAt > 14000 && this.kind !== "shard") this.destroy();
  }
}
