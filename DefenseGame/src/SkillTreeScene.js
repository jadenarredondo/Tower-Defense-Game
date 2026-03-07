import SkillTreeManager from './SkillTreeManager.js';
import AudioManager from './AudioManager.js';

export default class SkillTreeScene extends Phaser.Scene {
    constructor() {
        super('SkillTreeScene');
        this.audioManager = null;
        this.debug = false;
    }

    create() {
        // Get or create audio manager
        this.audioManager = this.registry.get('audioManager') || new AudioManager();
        // Store in registry for other scenes
        this.registry.set('audioManager', this.audioManager);

        const { width, height } = this.scale;
        
        // ============ BACKGROUND WITH SOLID COLOR ============
        // Use solid color background to avoid memory issues
        this.add.rectangle(width / 2, height / 2, width, height, 0x0a0e27).setOrigin(0.5, 0.5).setDepth(-100);

        // ============ HEADER SECTION ============
        const headerBg = this.add.rectangle(width / 2, 0, width, 120, 0x0f1534, 0.8).setOrigin(0.5, 0).setDepth(2);
        headerBg.setStrokeStyle(2, 0x64d5ff, 0.5);

        // Title
        const title = this.add.text(width / 2, 35, '⚔ SKILL TREE ⚔', {
            fontSize: '44px',
            fill: '#00d9ff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            stroke: '#064e6b',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(3);

        // hint for closing
        this.add.text(width/2, 75, 'Press ESC to close', {
            fontSize: '18px',
            fill: '#aaa',
            fontFamily: 'Arial',
            fontStyle: 'italic'
        }).setOrigin(0.5).setDepth(3);

        // Pulsing glow effect on title
        this.tweens.add({
            targets: title,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Get skill data
        SkillTreeManager.initSkills();
        this.skillData = SkillTreeManager.getSkillData();
        this.nextScene = this.sys.settings.data?.nextScene || 'MenuScene';
        this.pausedGame = this.sys.settings.data?.pausedGame || this.sys.settings.data?.nextScene || 'MainScene';
        this.levelNumber = this.sys.settings.data?.level || 0;
        this.fromPause = this.sys.settings.data?.fromPause || false;

        // ============ POINTS DISPLAY PANEL ============
        const pointsBox = this.add.rectangle(width - 150, 60, 280, 70, 0x1a2d42, 0.9)
            .setStrokeStyle(2, 0xFFD700)
            .setDepth(3);

        const pointsLabel = this.add.text(width - 150, 35, 'AVAILABLE POINTS', {
            fontSize: '14px',
            fill: '#FFD700',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        this.pointsText = this.add.text(width - 150, 65, `${this.skillData.availablePoints}`, {
            fontSize: '36px',
            fill: '#00FF00',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(3);

        // ============ SKILL CARDS ============
        const skills = Object.entries(SkillTreeManager.SKILLS);
        const skillsPerRow = 3;
        const skillWidth = 320;
        const skillHeight = 240; // Increased from 200 to 240
        const cardSpacingX = skillWidth + 30;
        const cardSpacingY = skillHeight + 40;
        
        const totalWidth = skillsPerRow * cardSpacingX;
        const startX = width / 2 - totalWidth / 2 + cardSpacingX / 2;
        const startY = 280;

        // Container for scrollable content
        let maxY = startY;

        skills.forEach((entry, idx) => {
            const [skillId, skillDef] = entry;
            const row = Math.floor(idx / skillsPerRow);
            const col = idx % skillsPerRow;
            
            const x = startX + col * cardSpacingX;
            const y = startY + row * cardSpacingY;
            maxY = Math.max(maxY, y + skillHeight);

            const currentLevel = this.skillData.skills[skillId].level;
            const maxLevel = skillDef.maxLevel;
            const nextCost = skillDef.costPerLevel(currentLevel + 1);
            const canAfford = this.skillData.availablePoints >= nextCost && currentLevel < maxLevel;
            const isMaxed = currentLevel >= maxLevel;

            // ---- SKILL CARD BACKGROUND ----
            const cardBg = this.add.rectangle(x, y, skillWidth, skillHeight, isMaxed ? 0x1f3a2f : 0x1a2547);
            cardBg.setStrokeStyle(3, isMaxed ? 0x4ade80 : 0x64d5ff, 0.8);
            cardBg.setDepth(5);

            // Hover effect on card
            cardBg.setInteractive({ useHandCursor: false });
            cardBg.on('pointerover', () => {
                if (!isMaxed || canAfford) {
                    this.tweens.add({
                        targets: cardBg,
                        scaleX: 1.05,
                        scaleY: 1.05,
                        duration: 200,
                        ease: 'Power2'
                    });
                    cardBg.setStrokeStyle(3, isMaxed ? 0x4ade80 : 0x00d9ff, 1);
                }
            });
            cardBg.on('pointerout', () => {
                this.tweens.add({
                    targets: cardBg,
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Power2'
                });
                cardBg.setStrokeStyle(3, isMaxed ? 0x4ade80 : 0x64d5ff, 0.8);
            });

            // ---- SKILL ICON & NAME ----
            this.add.text(x - 100, y - 75, skillDef.icon, {
                fontSize: '48px',
                fontFamily: 'Arial'
            }).setOrigin(0.5).setDepth(6);

            this.add.text(x, y - 75, skillDef.name, {
                fontSize: '20px',
                fill: '#FFFFFF',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6);

            // ---- DESCRIPTION ----
            this.add.text(x - 150, y - 35, skillDef.description, {
                fontSize: '14px',
                fill: '#d1d5db',
                fontFamily: 'Arial',
                wordWrap: { width: 280 },
                align: 'left'
            }).setOrigin(0, 0).setDepth(6).setLineSpacing(3);

            // ---- LEVEL & PROGRESS BAR ----
            const levelStr = `LV ${currentLevel}/${maxLevel}`;
            this.add.text(x - 150, y + 30, levelStr, {
                fontSize: '16px',
                fill: isMaxed ? '#4ade80' : '#FFD700',
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(0, 0.5).setDepth(6);

            // Progress bar
            const barWidth = 220;
            const barHeight = 12;
            const barX = x - 80;
            const barY = y + 30;

            const barBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x2b3e4d, 1)
                .setStrokeStyle(1, 0x64d5ff, 0.5)
                .setOrigin(0, 0.5)
                .setDepth(6);

            const fillPct = Math.max(0, Math.min(1, currentLevel / maxLevel));
            const fillWidth = Math.round(barWidth * fillPct);
            if (fillWidth > 1) {
                this.add.rectangle(barX, barY, fillWidth, barHeight, 0x00d9ff)
                    .setOrigin(0, 0.5)
                    .setDepth(7);
            }

            // ---- COST DISPLAY ----
            const costColor = isMaxed ? '#4ade80' : (canAfford ? '#84cc16' : '#ef4444');
            const costText = isMaxed ? '✓ MAXED' : `Cost: ${nextCost}`;
            
            this.add.text(x + 150, y + 8, costText, {
                fontSize: '14px',
                fill: costColor,
                fontFamily: 'Arial',
                fontStyle: 'bold'
            }).setOrigin(1, 0).setDepth(6);

            // ---- UPGRADE BUTTON ----
            if (!isMaxed) {
                const buttonBg = this.add.rectangle(x, y + 85, 260, 40, canAfford ? 0x2d5f6f : 0x3a3a3a);
                buttonBg.setStrokeStyle(2, canAfford ? 0x00d9ff : 0x666666);
                buttonBg.setInteractive({ useHandCursor: true });
                buttonBg.setDepth(6);

                const buttonText = this.add.text(x + 20, y + 85, '⬆ UPGRADE', {
                    fontSize: '16px',
                    fill: canAfford ? '#00d9ff' : '#888888',
                    fontFamily: 'Arial',
                    fontStyle: 'bold'
                }).setOrigin(0.5).setDepth(7);

                if (canAfford) {
                    buttonBg.on('pointerover', () => {
                        buttonBg.setFillStyle(0x3d8faf);
                        buttonText.setFill('#FFD700');
                    });
                    buttonBg.on('pointerout', () => {
                        buttonBg.setFillStyle(0x2d5f6f);
                        buttonText.setFill('#00d9ff');
                    });
                    buttonBg.on('pointerdown', () => {
                        this.upgradSkill(skillId, skillDef, nextCost, buttonBg);
                    });
                } else {
                    buttonBg.setAlpha(0.5);
                }
            }
        });

        // ============ BOTTOM SECTION ============
        const bottomY = Math.max(height - 100, maxY + 50);
        
        // Continue button (right side)
        const continueBtn = this.add.rectangle(width / 2 + 130, bottomY, 240, 60, 0x2d5f6f);
        continueBtn.setStrokeStyle(3, 0x64d5ff);
        continueBtn.setInteractive({ useHandCursor: true });
        continueBtn.setDepth(5);

        const continueBtnText = this.add.text(width / 2 + 130, bottomY, '→ CONTINUE', {
            fontSize: '22px',
            fill: '#64d5ff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        // Close button (left side)
        const closeBtn = this.add.rectangle(width / 2 - 130, bottomY, 240, 60, 0x5f2d2d);
        closeBtn.setStrokeStyle(3, 0xef4444);
        closeBtn.setInteractive({ useHandCursor: true });
        closeBtn.setDepth(5);

        const closeBtnText = this.add.text(width / 2 - 130, bottomY, '✕ CLOSE', {
            fontSize: '22px',
            fill: '#ef4444',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(6);

        continueBtn.on('pointerover', () => {
            continueBtn.setFillStyle(0x3d7f9f);
            continueBtnText.setFill('#FFD700');
            this.tweens.add({
                targets: continueBtn,
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 200
            });
        });
        continueBtn.on('pointerout', () => {
            continueBtn.setFillStyle(0x2d5f6f);
            continueBtnText.setFill('#64d5ff');
            this.tweens.add({
                targets: continueBtn,
                scaleX: 1,
                scaleY: 1,
                duration: 200
            });
        });
        continueBtn.on('pointerdown', () => {
            if (this.audioManager && this.audioManager.playClick) this.audioManager.playClick();
            continueBtn.setFillStyle(0x1a4d5f);
            
            // Save skill data before exiting
            SkillTreeManager.saveSkillData(this.skillData);
            
            this.time.delayedCall(150, () => {
                if (this.fromPause) {
                    // If from pause, just stop skill tree (PauseScene is already running underneath)
                    this.scene.stop('SkillTreeScene');
                } else {
                    this.scene.start('LoadingScene', { target: this.nextScene, payload: { fromSkillTree: true, level: this.levelNumber } });
                }
            });
        });

        closeBtn.on('pointerover', () => {
            closeBtn.setFillStyle(0x7f3d3d);
            closeBtnText.setFill('#FFD700');
            this.tweens.add({
                targets: closeBtn,
                scaleX: 1.08,
                scaleY: 1.08,
                duration: 200
            });
        });
        closeBtn.on('pointerout', () => {
            closeBtn.setFillStyle(0x5f2d2d);
            closeBtnText.setFill('#ef4444');
            this.tweens.add({
                targets: closeBtn,
                scaleX: 1,
                scaleY: 1,
                duration: 200
            });
        });
        closeBtn.on('pointerdown', () => {
            if (this.audioManager && this.audioManager.playClick) this.audioManager.playClick();
            closeBtn.setFillStyle(0x4d1d1d);
            
            // Save skill data before exiting
            SkillTreeManager.saveSkillData(this.skillData);
            
            this.time.delayedCall(150, () => {
                if (this.fromPause) {
                    // If from pause, just stop skill tree (PauseScene is already running underneath)
                    this.scene.stop('SkillTreeScene');
                } else {
                    this.scene.start('LoadingScene', { target: 'MenuScene', payload: { fromSkillTree: true } });
                }
            });
        });

        // ============ KEYBOARD SHORTCUTS ============
        this.input.keyboard.on('keydown-ESC', () => {
            console.log('ESC pressed from SkillTree, fromPause:', this.fromPause);
            // Save skill data before closing
            SkillTreeManager.saveSkillData(this.skillData);
            
            if (this.fromPause) {
                // If from pause, just stop skill tree (PauseScene is already running underneath)
                this.scene.stop('SkillTreeScene');
            } else {
                // Normal flow - go to next scene
                this.scene.start('LoadingScene', { target: this.nextScene, payload: { fromSkillTree: true, level: this.levelNumber } });
            }
        });

        // ============ SCENE MANAGEMENT ============
        this.events.on('shutdown', () => {
            // Ensure skill data is saved when scene is destroyed
            if (this.skillData) {
                SkillTreeManager.saveSkillData(this.skillData);
            }
        });
    }

    upgradSkill(skillId, skillDef, cost, buttonBg) {
        const success = SkillTreeManager.purchaseSkill(skillId, this.skillData);
        
        if (success) {
            this.audioManager.playClick();
            
            // Visual feedback - button press effect
            this.tweens.add({
                targets: buttonBg,
                scaleX: 0.95,
                scaleY: 0.95,
                duration: 100,
                yoyo: true
            });

            // Update points display with animation
            this.tweens.add({
                targets: this.pointsText,
                scale: 1.3,
                duration: 300,
                yoyo: true,
                ease: 'Back.easeOut'
            });
            
            this.skillData = SkillTreeManager.getSkillData();
            this.pointsText.setText(`${this.skillData.availablePoints}`);
            
            if (this.debug) {
                console.log(`✓ Upgraded ${skillDef.name} to level ${this.skillData.skills[skillId].level}`);
            }
            
            // Reload scene to update UI after a short delay
            this.time.delayedCall(400, () => this.scene.restart());
        }
    }
}
