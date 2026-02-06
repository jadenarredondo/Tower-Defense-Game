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

        // Coming soon message
        this.add.text(width / 2, height / 2 - 60, 'Coming Soon!', {
            fontSize: '48px',
            color: '#a8daff',
            fontStyle: 'italic',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 20, 'Settings will be available in a future update.', {
            fontSize: '24px',
            color: '#888888',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

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
