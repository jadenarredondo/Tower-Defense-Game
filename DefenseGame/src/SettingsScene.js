import ProgressManager from './ProgressManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
    }

    create() {
        const { width, height } = this.scale;

        // ---------- BACKGROUND EFFECT ----------
        this.bgGraphics = this.add.graphics();
        this.circles = [];
        for (let i = 0; i < 20; i++) {
            this.circles.push({
                x: Phaser.Math.Between(0, width),
                y: Phaser.Math.Between(0, height),
                radius: Phaser.Math.Between(20, 60),
                alpha: Phaser.Math.FloatBetween(0.05, 0.15),
                speed: Phaser.Math.FloatBetween(0.1, 0.4)
            });
        }

        // ---------- GRADIENT OVERLAY ----------
        const gradient = this.make.graphics({ x: 0, y: 0, add: false });
        gradient.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x2d5f6f, 0x2d5f6f, 1);
        gradient.fillRect(0, 0, width, height);
        gradient.generateTexture('gradientBG', width, height);
        this.add.image(0, 0, 'gradientBG').setOrigin(0, 0).setDepth(-1);
        gradient.destroy();

        // ---------- TITLE ----------
        this.add.text(width / 2, height / 4 - 40, 'SETTINGS', {
            fontSize: '68px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 8,
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // ---------- DELETE DATA BUTTON ----------
        const deleteBtn = this.add.text(width / 2, height / 2 - 40, 'DELETE ALL DATA', {
            fontSize: '32px',
            color: '#ff6b6b',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        deleteBtn.on('pointerover', () => {
            deleteBtn.setColor('#ffffff');
            deleteBtn.setScale(1.1);
        });

        deleteBtn.on('pointerout', () => {
            deleteBtn.setColor('#ff6b6b');
            deleteBtn.setScale(1);
        });

        deleteBtn.on('pointerdown', () => {
            this.showDeleteConfirmation();
        });

        // ---------- BACK BUTTON ----------
        const backBtn = this.add.text(width / 2, height / 2 + 120, 'BACK TO MENU', {
            fontSize: '36px',
            color: '#64d5ff',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

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
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    showDeleteConfirmation() {
        const { width, height } = this.scale;

        // Dark overlay
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7)
            .setDepth(19);

        // Confirmation panel
        const panel = this.add.rectangle(width/2, height/2, 500, 280, 0x1a1a2e)
            .setStrokeStyle(3, 0xff6b6b, 0.8)
            .setDepth(20);

        // Confirmation text
        const titleText = this.add.text(width/2, height/2 - 80, 'DELETE ALL DATA?', {
            fontSize: '40px',
            fontStyle: 'bold',
            color: '#ff6b6b',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21);

        const descText = this.add.text(width/2, height/2 - 10, 'This will erase all progress and cannot be undone!', {
            fontSize: '16px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21);

        // Confirm button
        const confirmBtn = this.add.text(width/2 - 120, height/2 + 80, 'DELETE', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#ff6b6b',
            padding: { x: 20, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

        // Cancel button
        const cancelBtn = this.add.text(width/2 + 120, height/2 + 80, 'CANCEL', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#4a9eff',
            padding: { x: 20, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

        confirmBtn.on('pointerdown', () => {
            ProgressManager.resetProgress();
            console.log('✓ All data deleted!');
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            descText.destroy();
            confirmBtn.destroy();
            cancelBtn.destroy();
        });

        cancelBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            descText.destroy();
            confirmBtn.destroy();
            cancelBtn.destroy();
        });
    }

    update() {
        // Animate background circles
        this.bgGraphics.clear();
        this.bgGraphics.fillStyle(0x66ccff, 0.05);
        this.circles.forEach(c => {
            c.y -= c.speed;
            if (c.y + c.radius < 0) c.y = this.scale.height + c.radius;
            this.bgGraphics.fillCircle(c.x, c.y, c.radius);
        });
    }
}
