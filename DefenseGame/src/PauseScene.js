import ProgressManager from './ProgressManager.js';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create(data) {
        const { width, height } = this.scale;

        // Get the paused scene from data passed during launch
        this.pausedSceneKey = data?.pausedScene || 'MainScene';
        console.log(`🔇 Pause scene opened for: ${this.pausedSceneKey}`);

        // Dark overlay
        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.65);

        // Main panel with modern styling
        const panel = this.add.rectangle(width/2, height/2, 500, 480, 0x1a1a2e)
            .setStrokeStyle(3, 0x64d5ff, 0.8)
            .setDepth(10);

        // Decorative top bar
        this.add.rectangle(width/2, height/2 - 210, 500, 8, 0x64d5ff, 0.6);

        // Title with glow effect
        const titleText = this.add.text(width/2, height/2 - 180, 'PAUSED', {
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
            loop: -1
        });

        // Show game stats
        const activeScene = this.scene.get(this.pausedSceneKey);
        if (activeScene) {
            const statsY = height/2 - 100;
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

        // Buttons with enhanced styling
        this.makeButton(width/2, height/2 - 80, 'RESUME', () => {
            this.scene.stop();
            this.scene.resume(this.pausedSceneKey);
        }, 0x4a9eff);

        this.makeButton(width/2, height/2, 'SAVE GAME', () => {
            this.saveGame();
        }, 0x90EE90);

        this.makeButton(width/2, height/2 + 80, 'EXIT TO MENU', () => {
            this.scene.stop(this.pausedSceneKey);
            this.scene.start('MenuScene');
        }, 0xff6b6b);
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
                duration: 200
            });
        });

        btn.on('pointerout', () => {
            btnBg.setFillStyle(color, 0.15);
            btn.setScale(1);
            this.tweens.add({
                targets: btnBg,
                fillAlpha: 0.15,
                duration: 200
            });
        });

        btn.on('pointerdown', () => {
            // Button press animation
            this.tweens.add({
                targets: [btn, btnBg],
                scaleY: 0.95,
                duration: 100,
                yoyo: true
            });
            this.time.delayedCall(150, callback);
        });
    }
}
