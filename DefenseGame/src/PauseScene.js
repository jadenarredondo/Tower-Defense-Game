import ProgressManager from './ProgressManager.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create(data) {
        const { width, height } = this.scale;

        // ensure we cleanup when the scene stops
        this.events.on('shutdown', () => this.shutdownCleanup());

        // Get the paused scene from data passed during launch
        this.pausedSceneKey = data?.pausedScene || 'MainScene';
        console.log(`🔇 Pause scene opened for: ${this.pausedSceneKey}`);

        // Dark overlay
        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.65);

        // Main panel with modern styling - INCREASED HEIGHT for 4 buttons
        const panel = this.add.rectangle(width/2, height/2, 500, 620, 0x1a1a2e)
            .setStrokeStyle(3, 0x64d5ff, 0.8)
            .setDepth(10);

        // Decorative top bar
        this.add.rectangle(width/2, height/2 - 240, 500, 8, 0x64d5ff, 0.6);

        // Title with glow effect
        const titleText = this.add.text(width/2, height/2 - 210, 'PAUSED', {
            fontSize: '64px',
            fontStyle: 'bold',
            color: '#64d5ff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(11);

        // Subtle glow animation
        this.tweens.add({
            targets: titleText,
            alpha: { from: 1, to: 0.8 },
            duration: 1500,
            yoyo: true,
            loop: -1,
            useFrames: false
        });

        // Show game stats
        const activeScene = this.scene.get(this.pausedSceneKey);
        if (activeScene) {
            const statsY = height/2 - 130;
            const statsColor = '#a8daff';
            const statsFontSize = '14px';

            this.add.text(width/2 - 120, statsY, '━━━ STATS ━━━', {
                fontSize: '12px',
                color: '#64d5ff',
                fontStyle: 'bold',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5);

            const stats = [
                `❤️ Health: ${activeScene.playerHealth}/${activeScene.maxPlayerHealth}`,
                `💰 Gold: ${activeScene.gold}`,
                `🌊 Wave: ${activeScene.currentWave + 1}/${activeScene.maxWaves}`,
                `🎯 Towers: ${activeScene.towers.length}/${activeScene.maxTowers}`,
                `👾 Enemies: ${activeScene.enemiesAlive}`
            ];

            stats.forEach((stat, idx) => {
                this.add.text(width/2 - 120, statsY + 25 + idx * 20, stat, {
                    fontSize: statsFontSize,
                    color: statsColor,
                    fontFamily: 'Arial, sans-serif'
                }).setOrigin(0.5);
            });
        }

        // Buttons with proper spacing for 4 buttons
        const buttonYStart = height/2 - 90;
        const buttonSpacing = 60;

        // RESUME button
        this.makeButton(width/2, buttonYStart, 'RESUME', () => {
            const pausedScene = this.scene.get(this.pausedSceneKey);
            if (pausedScene) {
                pausedScene.time.timeScale = 1;
            }
            this.scene.resume(this.pausedSceneKey);
            this.scene.stop();
        }, 0x4a9eff);

        // SAVE GAME button
        this.makeButton(width/2, buttonYStart + buttonSpacing, 'SAVE GAME', () => {
            this.saveGame();
        }, 0x90EE90);

        // SKILLS button - PURPLE
        this.makeButton(width/2, buttonYStart + (buttonSpacing * 2), 'SKILLS', () => {
            console.log('🎮 SKILLS button clicked!');
            // Launch skill tree scene on top of pause scene (don't stop pause scene)
            this.scene.launch('SkillTreeScene', { 
                nextScene: this.pausedSceneKey, 
                fromPause: true,
                pausedGame: this.pausedSceneKey
            });
        }, 0x9b59b6);

        // EXIT TO MENU button
        this.makeButton(width/2, buttonYStart + (buttonSpacing * 3), 'EXIT TO MENU', () => {
            this.scene.stop(this.pausedSceneKey);
            this.scene.stop();
            this.scene.start('MenuScene');
        }, 0xff6b6b);
    }

    shutdownCleanup() {
        // remove any outstanding tweens or timers tied to this pause overlay
        this.tweens.killAll();
        this.time.removeAllEvents();
        // input listeners on buttons are destroyed with their GameObjects, but ensure
        this.input.off('pointerdown');
        this.input.off('pointerover');
        this.input.off('pointerout');
    }

    saveGame() {
        const activeScene = this.scene.get(this.pausedSceneKey);

        if (!activeScene) {
            console.warn(`⚠️ No scene found: ${this.pausedSceneKey}`);
            return;
        }

        // Capture game state
        const gameState = {
            levelType: this.pausedSceneKey,
            levelNum: this.pausedSceneKey === 'MainScene' ? 1 : 2,
            playerHealth: activeScene.playerHealth,
            maxPlayerHealth: activeScene.maxPlayerHealth,
            gold: activeScene.gold,
            currentWave: activeScene.currentWave,
            maxWaves: activeScene.maxWaves,
            enemiesAlive: activeScene.enemiesAlive,
            towersCount: activeScene.towers.length,
            timestamp: new Date().toISOString()
        };

        ProgressManager.saveGameState(gameState);
        console.log('💾 Game state saved:', gameState);

        // Visual feedback
        const { width, height } = this.scale;
        const feedbackText = this.add.text(width/2, height/2 - 200, '✓ GAME SAVED', {
            fontSize: '32px',
            fontStyle: 'bold',
            color: '#90EE90',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(20);

        this.tweens.add({
            targets: feedbackText,
            alpha: 0,
            duration: 2000,
            delay: 500,
            useFrames: false,
            onComplete: () => feedbackText.destroy()
        });
    }

    makeButton(x, y, text, callback, color) {
        // Button background
        const btnBg = this.add.rectangle(x, y, 280, 60, color, 0.15)
            .setStrokeStyle(2, color, 0.8)
            .setDepth(11);

        // Button text
        const btn = this.add.text(x, y, text, {
            fontSize: '28px',
            fontStyle: 'bold',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(12).setInteractive({ useHandCursor: true });

        // Hover effects
        btn.on('pointerover', () => {
            btnBg.setFillStyle(color, 0.35);
            btn.setScale(1.08);
                this.tweens.add({
                    targets: btnBg,
                    fillAlpha: 0.35,
                    duration: 200,
                    useFrames: false
                });
        });

        btn.on('pointerout', () => {
            btnBg.setFillStyle(color, 0.15);
            btn.setScale(1);
                this.tweens.add({
                    targets: btnBg,
                    fillAlpha: 0.15,
                    duration: 200,
                    useFrames: false
                });
        });

        btn.on('pointerdown', () => {
            // Button press animation
                this.tweens.add({
                    targets: [btn, btnBg],
                    scaleY: 0.95,
                    duration: 100,
                    yoyo: true,
                    useFrames: false
                });
            this.time.delayedCall(150, callback);
        });
    }
}
