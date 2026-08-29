import * as Phaser from "phaser";
import { GAME_H, GAME_W, DEBUG } from "./config";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { PauseScene } from "./scenes/PauseScene";
import { SkillsScene } from "./scenes/SkillsScene";
import { SettingsScene } from "./scenes/SettingsScene";
import { GameScene } from "./scenes/GameScene";
import { UIScene } from "./scenes/UIScene";
import { VictoryScene } from "./scenes/VictoryScene";

export function createGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    width: GAME_W,
    height: GAME_H,
    backgroundColor: "#0a0c12",
    pixelArt: false,
    roundPixels: true,
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: DEBUG },
    },
    scene: [BootScene, MenuScene, GameScene, UIScene, PauseScene, SkillsScene, SettingsScene, VictoryScene],
  });
  (window as unknown as { __game: Phaser.Game }).__game = game;
  return game;
}
