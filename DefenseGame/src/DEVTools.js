import ProgressManager from './ProgressManager.js';
import AudioManager from './AudioManager.js';
import SkillTreeManager from './SkillTreeManager.js';

export default class DEVTools extends Phaser.Scene {
    constructor() {
        super('DEVTools');
        this.audioManager = null;
    }

    create() {
        const { width, height } = this.scale;

        // Get the audio manager
        this.audioManager = AudioManager.getInstance();

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
        this.add.text(width / 2, height / 4 - 80, 'DEV', {
            fontSize: '68px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 8,
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // --------- DEV ---------
        const DEVY = height / 2 - 60;
        this.add.text(width / 2 - 300, DEVY - 50, 'LEVELS', {
            fontSize: '28px',
            color: '#64d5ff',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0,0);

        // DEV Buttons

        
        this.LevelButton(300, 10, 1);
        this.LevelButton(300, 40, 2);
        this.LevelButton(300, 70, 3);
        this.LevelButton(300, 100, 4);

        this.SkillButton(-100, 10, 999);


        

        // ---------- BACK BUTTON ----------
        const backBtn = this.add.text(width / 2, height - 40, 'BACK TO SETTINGS', {
            fontSize: '32px',
            color: '#64d5ff',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        backBtn.on('pointerover', () => {
            backBtn.setColor('#ffffff');
            backBtn.setScale(1.05);
        });

        backBtn.on('pointerout', () => {
            backBtn.setColor('#64d5ff');
            backBtn.setScale(1);
        });

        backBtn.on('pointerdown', () => {
            this.scene.start('SettingsScene');
        });

        // ESC to go back
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * Create a volume control slider with label and display
     */
    

    /**
     * Update the volume slider position based on pointer
     */
    

    

    /**
     * Reset audio settings to default values
     */
    
    

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


    LevelButton(x, y, level) {
        const DEVY = this.scale.height / 2 - 60;
        let DBtn = this.add.text(this.scale.width / 2 - x, DEVY + y, `Level ${level} Unlock`, {
            fontSize: '20px',
            //color: isMuted ? '#ff6b6b' : '#64d5ff',
            fontStyle: 'bold',
            //backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
            padding: { x: 15, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        DBtn.on('pointerdown', () => {
            ProgressManager.completeLevel(level);
            console.log(`Level ${level} Unlocked`);
        });

        DBtn.on('pointerover', () => {
            DBtn.setScale(1.05);
        });

        DBtn.on('pointerout', () => {
            DBtn.setScale(1);
        });
    }

    SkillButton(x, y, points) {
        const DEVY = this.scale.height / 2 - 60;
        let DBtn = this.add.text(this.scale.width / 2 - x, DEVY + y, `Add ${points} Skill Points`, {
            fontSize: '20px',
            //color: isMuted ? '#ff6b6b' : '#64d5ff',
            fontStyle: 'bold',
            //backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
            padding: { x: 15, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        DBtn.on('pointerdown', () => {
            SkillTreeManager.initSkills();
            SkillTreeManager.addSkillPoints(points);
            console.log(`${points} Skill Points Added`);
        });

        DBtn.on('pointerover', () => {
            DBtn.setScale(1.05);
        });

        DBtn.on('pointerout', () => {
            DBtn.setScale(1);
        });
    }
}
