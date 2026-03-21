import ProgressManager from './ProgressManager.js';

export default class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super('LevelSelectScene');
    }

    preload() {
        // Initialize progress if needed
        ProgressManager.initProgress();
    }

    create() {
        // Hide all game UI elements that might be visible from previous scenes
        const uiElements = [
            'game-ui',
            'tower-selection-panel'
        ];

        uiElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = 'none';
            }
        });

        const { width, height } = this.scale;

        // Background with gradient effect
        this.bgGraphics = this.add.graphics();
        this.circles = [];
        for (let i = 0; i < 15; i++) {
            this.circles.push({
                x: Phaser.Math.Between(0, width),
                y: Phaser.Math.Between(0, height),
                radius: Phaser.Math.Between(20, 60),
                alpha: Phaser.Math.FloatBetween(0.05, 0.15),
                speed: Phaser.Math.FloatBetween(0.1, 0.4)
            });
        }

        // Gradient overlay
        const gradient = this.make.graphics({ x: 0, y: 0, add: false });
        gradient.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x2d5f6f, 0x2d5f6f, 1);
        gradient.fillRect(0, 0, width, height);
        gradient.generateTexture('gradientBG', width, height);
        this.add.image(0, 0, 'gradientBG').setOrigin(0, 0).setDepth(-1);
        gradient.destroy();

        // Title
        this.add.text(width / 2, 80, 'SELECT LEVEL', {
            fontSize: '64px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 6,
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Get progress
        const progress = ProgressManager.getProgress();
        const unlockedLevels = ProgressManager.getUnlockedLevels();

        // Level buttons
        const levelData = [
            { num: 1, name: 'LEVEL 1', desc: 'Intro to Defense', scene: 'MainScene' },
            { num: 2, name: 'LEVEL 2', desc: 'Larger Battlefield', scene: 'Level2Scene' },
            { num: 3, name: 'LEVEL 3', desc: 'Final Stand', scene: 'Level3Scene' },
            { num: 4, name: 'LEVEL 4', desc: 'Test', scene: 'Level4Scene' }
        ];

        levelData.forEach((level, idx) => {
            const isUnlocked = unlockedLevels.includes(level.num);
            const isCompleted = ProgressManager.isLevelCompleted(level.num);
            
            const xPos = width / 2 + (idx - 1) * 340;
            const yPos = height / 2 + 80;

            // Level card
            const cardColor = isCompleted ? 0x1a5f3e : (isUnlocked ? 0x1a3f5e : 0x3d2d2d);
            const card = this.add.rectangle(xPos, yPos, 280, 200, cardColor);
            card.setStrokeStyle(3, isUnlocked ? 0x64d5ff : 0x666666);
            card.setInteractive({ useHandCursor: isUnlocked });

            // Level name
            this.add.text(xPos, yPos - 50, level.name, {
                fontSize: '32px',
                color: isUnlocked ? '#64d5ff' : '#888888',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Level description
            this.add.text(xPos, yPos - 10, level.desc, {
                fontSize: '14px',
                color: isUnlocked ? '#a8daff' : '#666666',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Status badge
            if (isCompleted) {
                this.add.text(xPos, yPos + 50, '✓ COMPLETED', {
                    fontSize: '18px',
                    color: '#90EE90',
                    fontStyle: 'bold',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            } else if (isUnlocked) {
                this.add.text(xPos, yPos + 50, 'AVAILABLE', {
                    fontSize: '16px',
                    color: '#FFD700',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            } else {
                this.add.text(xPos, yPos + 50, '🔒 LOCKED', {
                    fontSize: '16px',
                    color: '#ff6b6b',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            }

            // Level is locked - cannot be played
            if (!isUnlocked) {
                this.add.text(xPos, yPos + 50, '🔒 LOCKED', {
                    fontSize: '16px',
                    color: '#ff6b6b',
                    fontFamily: 'Arial'
                }).setOrigin(0.5);
            } else {
                // Button click only if unlocked
                card.on('pointerover', () => {
                    card.setScale(1.05);
                });
                card.on('pointerout', () => {
                    card.setScale(1);
                });
                card.on('pointerdown', () => {
                    this.startLevel(level.num);
                });
            }
        });

        // Back button
        const backBtn = this.add.text(50, height - 50, '← BACK', {
            fontSize: '24px',
            color: '#64d5ff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => {
            backBtn.setColor('#ffffff');
            backBtn.setScale(1.1);
        });
        backBtn.on('pointerout', () => {
            backBtn.setColor('#64d5ff');
            backBtn.setScale(1);
        });
        backBtn.on('pointerdown', () => {
            this.scene.start('MenuScene');
        });

        // ESC to go back
        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    update() {
        // Animate background
        this.bgGraphics.clear();
        this.bgGraphics.fillStyle(0x66ccff, 0.05);
        this.circles.forEach(c => {
            c.y -= c.speed;
            if (c.y + c.radius < 0) c.y = this.scale.height + c.radius;
            this.bgGraphics.fillCircle(c.x, c.y, c.radius);
        });
    }

    startLevel(levelNum) {
        const scenes = ['MainScene', 'Level2Scene', 'Level3Scene', 'Level4Scene'];
        const targetScene = scenes[levelNum - 1];
        this.scene.start('LoadingScene', { target: targetScene, payload: { level: levelNum } });
    }
}
