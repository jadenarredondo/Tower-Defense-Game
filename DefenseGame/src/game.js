import MenuScene from './MenuScene.js';
import MainScene from './MainScene.js';
import PauseScene from './PauseScene.js';
import SettingsScene from './SettingsScene.js';
import WinScene from './WinScene.js';
import LoseScene from './LoseScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0b102a',
    scene: [MenuScene, MainScene, PauseScene, SettingsScene],
        scene: [MenuScene, MainScene, PauseScene, SettingsScene, WinScene, LoseScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    }
};

new Phaser.Game(config);
