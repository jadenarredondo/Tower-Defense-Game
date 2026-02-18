export default class LoseScene extends Phaser.Scene {
    constructor() {
        super('LoseScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background with gradient effect
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a0000).setDepth(-1);
        this.add.rectangle(width / 2, height / 2, width, height, 0x2d0000).setDepth(-1).setAlpha(0.5);

        // Overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setDepth(2999).setAlpha(0.85);

        // Loss message with animation
        const title = this.add.text(width / 2, height / 2 - 150, 'DEFEAT', {
            fontSize: '96px',
            fill: '#ff4444',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#ff0000',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(3000);

        this.tweens.add({
            targets: title,
            y: height / 2 - 140,
            duration: 600,
            ease: 'Elastic.easeOut'
        });

        // Subtitle
        this.add.text(width / 2, height / 2 - 70, 'Your castle has fallen...', {
            fontSize: '32px',
            fill: '#ff6666',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(3000);

        // Retry button
        this.createButton(width / 2 - 180, height / 2 + 140, 'RETRY', '#ef4444', () => {
            this.scene.stop('MainScene');
            this.scene.start('MainScene');
        });

        // Return to menu button
        this.createButton(width / 2 + 180, height / 2 + 140, 'MENU', '#6366f1', () => {
            this.scene.stop('MainScene');
            this.scene.start('MenuScene');
        });
    }

    createButton(x, y, text, color, callback) {
        const buttonBg = this.add.rectangle(x, y, 300, 70, color).setDepth(3000)
            .setStrokeStyle(2, '#ffffff');
        
        const buttonText = this.add.text(x, y, text, {
            fontSize: '28px',
            fill: '#ffffff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            letterSpacing: 1
        }).setOrigin(0.5).setDepth(3001);

        buttonBg.setInteractive({ useHandCursor: true })
            .on('pointerover', () => {
                buttonBg.setScale(1.08);
                buttonText.setScale(1.08);
            })
            .on('pointerout', () => {
                buttonBg.setScale(1);
                buttonText.setScale(1);
            })
            .on('pointerdown', callback);
    }
}
