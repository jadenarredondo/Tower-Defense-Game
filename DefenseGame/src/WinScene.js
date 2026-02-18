export default class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background with gradient effect
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e27).setDepth(-1);
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1f42).setDepth(-1).setAlpha(0.5);

        // Overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setDepth(2999).setAlpha(0.85);

        // Get gold from main scene
        const mainScene = this.scene.get('MainScene');
        const gold = mainScene.gold || 0;

        // Win message with animation
        const title = this.add.text(width / 2, height / 2 - 150, 'VICTORY!', {
            fontSize: '96px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#FFA500',
            strokeThickness: 6
        }).setOrigin(0.5).setDepth(3000);

        this.tweens.add({
            targets: title,
            y: height / 2 - 140,
            duration: 600,
            ease: 'Elastic.easeOut'
        });

        // Subtitle
        this.add.text(width / 2, height / 2 - 70, 'ALL WAVES DEFEATED!', {
            fontSize: '32px',
            fill: '#90EE90',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(3000);

        // Gold reward display
        const goldDisplay = this.add.container(width / 2, height / 2 + 10);
        
        const goldBg = this.add.rectangle(0, 0, 400, 80, 0x1a1f42).setStrokeStyle(3, 0xFFD700);
        goldDisplay.add(goldBg);

        const goldText = this.add.text(-150, -10, 'GOLD EARNED', {
            fontSize: '20px',
            fill: '#9ca3af',
            fontFamily: 'Arial',
            fontWeight: 'bold',
            letterSpacing: 2
        });
        goldDisplay.add(goldText);

        const goldAmount = this.add.text(80, 0, `${gold}`, {
            fontSize: '48px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        goldDisplay.add(goldAmount);

        goldDisplay.setDepth(3000);

        // Play Again button
        this.createButton(width / 2 - 180, height / 2 + 140, 'PLAY AGAIN', '#7c3aed', () => {
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
