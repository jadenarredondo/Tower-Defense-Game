export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.scale;

        // Dark overlay
        this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.65);

        // Main panel with modern styling
        const panel = this.add.rectangle(width/2, height/2, 500, 380, 0x1a1a2e)
            .setStrokeStyle(3, 0x64d5ff, 0.8)
            .setDepth(10);

        // Decorative top bar
        this.add.rectangle(width/2, height/2 - 160, 500, 8, 0x64d5ff, 0.6);

        // Title with glow effect
        const titleText = this.add.text(width/2, height/2 - 130, 'PAUSED', {
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

        // Buttons with enhanced styling
        this.makeButton(width/2, height/2 - 20, 'RESUME', () => {
            this.scene.stop();
            this.scene.resume('MainScene');
        }, 0x4a9eff);

        this.makeButton(width/2, height/2 + 80, 'EXIT TO MENU', () => {
            this.scene.stop('MainScene');
            this.scene.start('MenuScene');
        }, 0xff6b6b);
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
