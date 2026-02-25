import ProgressManager from './ProgressManager.js';

export default class DifficultySelectScene extends Phaser.Scene {
    constructor() {
        super('DifficultySelectScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background with gradient effect
        const gradient = this.make.graphics({ x: 0, y: 0, add: false });
        gradient.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x2d5f6f, 0x2d5f6f, 1);
        gradient.fillRect(0, 0, width, height);
        gradient.generateTexture('gradientBG2', width, height);
        this.add.image(0, 0, 'gradientBG2').setOrigin(0, 0).setDepth(-1);
        gradient.destroy();

        // Title
        this.add.text(width / 2, 80, 'SELECT DIFFICULTY', {
            fontSize: '64px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 6,
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        const difficulties = [
            { name: 'EASY', desc: '1.5x starting gold\n0.75x enemy HP\n0.75x enemy damage', mult: { gold: 1.5, enemyHp: 0.75, enemyDmg: 0.75 }, color: 0x1a5f3e },
            { name: 'NORMAL', desc: '1x normal difficulty\nFull enemy stats\nRegular income', mult: { gold: 1, enemyHp: 1, enemyDmg: 1 }, color: 0x1a3f5e },
            { name: 'HARD', desc: '1.5x starting gold cost\n1.5x enemy HP\n1.5x enemy damage', mult: { gold: 0.75, enemyHp: 1.5, enemyDmg: 1.5 }, color: 0x3d3d5c }
        ];

        difficulties.forEach((diff, idx) => {
            const xPos = width / 2 + (idx - 1) * 340;
            const yPos = height / 2 + 80;

            // Difficulty card
            const card = this.add.rectangle(xPos, yPos, 280, 240, diff.color);
            card.setStrokeStyle(3, 0x64d5ff);
            card.setInteractive({ useHandCursor: true });

            // Difficulty name
            this.add.text(xPos, yPos - 70, diff.name, {
                fontSize: '36px',
                color: '#64d5ff',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0.5);

            // Difficulty description
            this.add.text(xPos, yPos, diff.desc, {
                fontSize: '11px',
                color: '#a8daff',
                fontFamily: 'Arial',
                align: 'center'
            }).setOrigin(0.5);

            // Button effects
            card.on('pointerover', () => {
                card.setScale(1.05);
            });
            card.on('pointerout', () => {
                card.setScale(1);
            });
            card.on('pointerdown', () => {
                // Store difficulty selection
                localStorage.setItem('mythological_defense_difficulty', JSON.stringify(diff.mult));
                // Go back to level selection
                this.scene.start('LevelSelectScene');
            });
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
            this.scene.start('LevelSelectScene');
        });
    }
}
