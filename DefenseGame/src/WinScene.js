import ProgressManager from './ProgressManager.js';
import AchievementManager from './AchievementManager.js';
import SkillTreeManager from './SkillTreeManager.js';

export default class WinScene extends Phaser.Scene {
    constructor() {
        super('WinScene');
        this.levelType = 'MainScene'; // Track which level just completed
        this.levelNumber = 1;
    }

    create() {
        const { width, height } = this.scale;

        // Background with gradient effect
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e27).setDepth(-1);
        this.add.rectangle(width / 2, height / 2, width, height, 0x1a1f42).setDepth(-1).setAlpha(0.5);

        // Overlay
        this.add.rectangle(width / 2, height / 2, width, height, 0x000000).setDepth(2999).setAlpha(0.85);

        // determine level from data passed when scene was launched
        const data = this.sys.settings.data || {};
        this.levelNumber = data.level || 1;
        switch (this.levelNumber) {
            case 1: this.levelType = 'MainScene'; break;
            case 2: this.levelType = 'Level2Scene'; break;
            case 3: this.levelType = 'Level3Scene'; break;
        }

        // Save progress (redundant calls are OK)
        ProgressManager.completeLevel(this.levelNumber);

        // Try unlocking achievements and show a small popup when unlocked
        const unlocked = AchievementManager.unlockAchievement('first_win');
        if (unlocked) {
            const achText = this.add.text(width / 2, height / 2 - 220, `Achievement Unlocked: ${AchievementManager.ACHIEVEMENTS.first_win.name} ${AchievementManager.ACHIEVEMENTS.first_win.icon}`, {
                fontSize: '20px',
                color: '#FFD700',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(4000);

            this.tweens.add({
                targets: achText,
                alpha: 0,
                delay: 2000,
                duration: 800,
                useFrames: false,
                onComplete: () => achText.destroy()
            });
        }

        // Get gold from passed data (will be set by the calling level scene)
        const gold = data.gold || 0;

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
            ease: 'Elastic.easeOut',
            useFrames: false
        });

        // Subtitle
        let levelText = 'LEVEL 1';
        if (this.levelType === 'Level2Scene') levelText = 'LEVEL 2';
        else if (this.levelType === 'Level3Scene') levelText = 'LEVEL 3 - FINAL';
        
        this.add.text(width / 2, height / 2 - 70, `${levelText} COMPLETE!`, {
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

        // Award skill points and show skill tree
        SkillTreeManager.initSkills();
        SkillTreeManager.addSkillPoints(SkillTreeManager.SKILL_POINTS_PER_LEVEL);

        // Skill points awarded message
        const skillPointText = this.add.text(width / 2, height / 2 + 80, `+${SkillTreeManager.SKILL_POINTS_PER_LEVEL} SKILL POINTS EARNED!`, {
            fontSize: '20px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3000);

        // Button logic based on level
        if (this.levelType === 'MainScene') {
            // Level 1 complete - show "Skill Tree" and "Menu"
            this.createButton(width / 2 - 180, height / 2 + 140, 'SKILL TREE', '#7c3aed', () => {
                this.scene.stop('MainScene');
                this.scene.start('SkillTreeScene', { nextScene: 'Level2Scene', level: 2 });
            });

            this.createButton(width / 2 + 180, height / 2 + 140, 'MENU', '#6366f1', () => {
                this.scene.stop('MainScene');
                this.scene.start('MenuScene');
            });
        } else if (this.levelType === 'Level2Scene') {
            // Level 2 complete - show "Skill Tree" and "Menu"
            this.createButton(width / 2 - 180, height / 2 + 140, 'SKILL TREE', '#7c3aed', () => {
                this.scene.stop('Level2Scene');
                this.scene.start('SkillTreeScene', { nextScene: 'Level3Scene', level: 3 });
            });

            this.createButton(width / 2 + 180, height / 2 + 140, 'MENU', '#6366f1', () => {
                this.scene.stop('Level2Scene');
                this.scene.start('MenuScene');
            });
        } else if (this.levelType === 'Level3Scene') {
            // Level 3 complete - show "Skill Tree" and "Menu"
            this.createButton(width / 2 - 180, height / 2 + 140, 'SKILL TREE', '#7c3aed', () => {
                this.scene.stop('Level3Scene');
                this.scene.start('SkillTreeScene', { nextScene: 'LevelSelectScene', level: 1 });
            });

            this.createButton(width / 2 + 180, height / 2 + 140, 'MENU', '#6366f1', () => {
                this.scene.stop('Level3Scene');
                this.scene.start('MenuScene');
            });
        }
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
