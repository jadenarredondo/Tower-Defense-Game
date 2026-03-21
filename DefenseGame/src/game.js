import MenuScene from './MenuScene.js';
import LevelSelectScene from './LevelSelectScene.js';
import DifficultySelectScene from './DifficultySelectScene.js';
import TutorialScene from './TutorialScene.js';
import MainScene from './MainScene.js';
import Level2Scene from './Level2Scene.js';
import Level3Scene from './Level3Scene.js';
import Level4Scene from './Level4Scene .js';
import PauseScene from './PauseScene.js';
import SettingsScene from './SettingsScene.js';
import DEVTools from './DEVTools.js';
import WinScene from './WinScene.js';
import LoseScene from './LoseScene.js';
import SkillTreeScene from './SkillTreeScene.js';
import LoadingScene from './LoadingScene.js';

const config = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'game-container',
    backgroundColor: '#0b102a',
    physics: {
        default: 'arcade',
        arcade: { gravity: { y: 0 }, debug: false }
    },
    scene: [MenuScene, LevelSelectScene, DifficultySelectScene, TutorialScene, MainScene, Level2Scene, Level3Scene, Level4Scene, PauseScene, SettingsScene, DEVTools, WinScene, LoseScene, SkillTreeScene, LoadingScene],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    // Enable pixel-art mode and disable antialiasing to avoid texture bleeding
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true
    }
};

new Phaser.Game(config);
