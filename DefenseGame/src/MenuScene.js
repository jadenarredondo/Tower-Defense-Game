import ProgressManager from './ProgressManager.js';
import AudioManager from './AudioManager.js';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
        this.audioManager = null;
    }

    preload() {
        // Initialize audio manager on first load
        this.audioManager = AudioManager.getInstance();
        
        // Initialize progress on menu load
        ProgressManager.initProgress();
        // Initialize audio context
        this.audioManager.resume();

        // title/subtitle graphics
        this.load.image('gameTitle','assets/menu/gameTitle.png');
        this.load.image('subtitle','assets/menu/subtitleImage.png');

        // ensure pixel art stays crisp
        this.load.on('complete', () => {
            ['gameTitle','subtitle'].forEach(key => {
                if (this.textures.exists(key)) {
                    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
                }
            });
        });
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

        // ---------- TITLE (image) ----------
        // move title a bit higher
        const titleImg = this.add.image(width / 2, height / 4 - 60, 'gameTitle').setOrigin(0.5);
        // add a subtle pulsating tween like the old text glow
        this.tweens.add({
            targets: titleImg,
            scaleX: 1.02,
            scaleY: 1.02,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut',
            useFrames: false
        });
        

        // Subtitle image closer to the title but still separated
        this.add.image(width / 2, height / 4 + 90, 'subtitle').setOrigin(0.5);

        // Start background music
        if (this.audioManager) {
            this.audioManager.playBackgroundMusic();
        }

        // ---------- BUTTONS ----------
        const buttonData = [
            { text: 'PLAY', action: () => this.selectLevel(), icon: '▶' },
            { text: 'TUTORIAL', action: () => this.viewTutorial(), icon: '📚' },
            { text: 'ACHIEVEMENTS', action: () => this.showAchievements(), icon: '🏆' },
            { text: 'SETTINGS', action: () => this.settingsGame(), icon: '⚙' },
            { text: 'EXIT', action: () => this.exitGame(), icon: '✕' }
        ];

        this.buttons = [];
        const buttonSpacing = 130; // tighter vertical spacing between rows
        const baseY = height / 2 + 20;  // bring button block very close to subtitle
        const offsetX = 220; // reduce horizontal separation slightly
        let scrollOffset = 0;
        // compute maximum y position for scrolling (5 buttons now: 2 rows of 2, then exit)
        const lastBtnIndex = buttonData.length - 1;
        const maxRows = 3; // two rows for first 4, one for exit
        const maxYPos = baseY + (maxRows) * buttonSpacing;
        const maxScroll = Math.max(0, maxYPos + 80 - height);

        // Store button elements for scroll updates
        const buttonElements = [];

        buttonData.forEach((b, idx) => {
            let posX, currentY, basePosY;
            if (idx < 4) {
                // first four buttons in 2x2 grid
                const row = Math.floor(idx / 2);
                const col = idx % 2;
                posX = width / 2 + (col === 0 ? -offsetX : offsetX);
                basePosY = baseY + row * buttonSpacing;
            } else {
                // exit button centered on its own row
                posX = width / 2;
                basePosY = baseY + 2 * buttonSpacing;
            }
            currentY = basePosY;
            
            const colors = ['#00d9ff', '#7c3aed', '#06b6d4'];  // Modern cyan, purple, teal
            const buttonColor = colors[idx % colors.length];
            const glowColor = idx % colors.length === 0 ? 0x00d9ff : (idx % colors.length === 1 ? 0x7c3aed : 0x06b6d4);
            
            // Button background box (glass morphism with gradient effect)
            const boxWidth = 400;
            const boxHeight = 80;
            const buttonBox = this.add.rectangle(posX, currentY, boxWidth, boxHeight, 0x0f1534, 0.7)
                .setStrokeStyle(3, buttonColor, 0.9)
                .setDepth(5);

            // Glow effect shadow - more prominent
            const glowBox = this.add.rectangle(posX, currentY, boxWidth + 30, boxHeight + 30, glowColor, 0)
                .setStrokeStyle(2, buttonColor, 0.15)
                .setDepth(4);

            // Icon background circle
            const iconBg = this.add.circle(posX - 150, currentY, 32, glowColor, 0.25)
                .setStrokeStyle(2, buttonColor, 0.8)
                .setDepth(5)
                .setInteractive({ useHandCursor: true });

            // Icon
            const icon = this.add.text(posX - 150, currentY, b.icon, {
                fontSize: '36px',
                color: buttonColor,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6);

            // Button text
            const btn = this.add.text(posX + 30, currentY, b.text, {
                fontSize: '32px',
                color: buttonColor,
                fontStyle: 'bold',
                align: 'center',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5).setDepth(6).setInteractive({ useHandCursor: true });

            // Right arrow indicator
            const arrow = this.add.text(posX + 170, currentY, '→', {
                fontSize: '32px',
                color: buttonColor,
                fontFamily: 'Arial, sans-serif',
                fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(6);
            arrow.setAlpha(0.5);

            // Store elements for scroll updates
            buttonElements.push({ baseY: basePosY, buttonBox, glowBox, iconBg, icon, btn, arrow });
            // Hover effects
            const onHover = () => {
                btn.setColor('#ffffff');
                icon.setColor('#ffffff');
                iconBg.setFillStyle(glowColor, 0.6);
                arrow.setColor('#ffffff');
                arrow.setAlpha(1);
                buttonBox.setStrokeStyle(3, buttonColor, 1);
                glowBox.setStrokeStyle(3, buttonColor, 0.4);
                this.tweens.add({
                    targets: [buttonBox, glowBox, iconBg],
                    scaleX: 1.08,
                    scaleY: 1.08,
                    duration: 200,
                    ease: 'Power2',
                    useFrames: false
                });
            };

            const onOut = () => {
                btn.setColor(buttonColor);
                icon.setColor(buttonColor);
                iconBg.setFillStyle(glowColor, 0.3);
                arrow.setColor(buttonColor);
                arrow.setAlpha(0.4);
                buttonBox.setStrokeStyle(3, buttonColor, 0.9);
                glowBox.setStrokeStyle(2, buttonColor, 0.15);
                this.tweens.add({
                    targets: [buttonBox, glowBox, iconBg],
                    scaleX: 1,
                    scaleY: 1,
                    duration: 200,
                    ease: 'Power2',
                    useFrames: false
                });
            };

            btn.on('pointerover', onHover);
            buttonBox.on('pointerover', onHover);
            icon.on('pointerover', onHover);
            iconBg.on('pointerover', onHover);
            arrow.on('pointerover', onHover);
            glowBox.on('pointerover', onHover);

            btn.on('pointerout', onOut);
            buttonBox.on('pointerout', onOut);
            icon.on('pointerout', onOut);
            iconBg.on('pointerout', onOut);
            arrow.on('pointerout', onOut);
            glowBox.on('pointerout', onOut);

            const clickAction = () => {
                // Play click sound
                if (this.audioManager) {
                    this.audioManager.playClick();
                }
                
                this.tweens.add({
                    targets: [buttonBox, glowBox, btn, icon, arrow],
                    scaleX: 0.95,
                    scaleY: 0.95,
                    duration: 100,
                    ease: 'Power2',
                    useFrames: false
                });
                this.time.delayedCall(150, () => b.action());
            };

            btn.on('pointerdown', clickAction);
            buttonBox.setInteractive({ useHandCursor: true });
            buttonBox.on('pointerdown', clickAction);
            icon.setInteractive({ useHandCursor: true });
            icon.on('pointerdown', clickAction);
            arrow.setInteractive({ useHandCursor: true });
            arrow.on('pointerdown', clickAction);
            glowBox.setInteractive({ useHandCursor: true });
            glowBox.on('pointerdown', clickAction);

            this.buttons.push({ btn, buttonBox, glowBox, icon, iconBg, arrow });
        });

        // Bottom tagline - scrollable with buttons
        const taglineY = maxYPos + 120;
        const tagline = this.add.text(width / 2, taglineY, '⚡ Defend Your Kingdom ⚡', {
            fontSize: '16px',
            color: '#64d5ff',
            fontStyle: 'italic',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setAlpha(0.7);
        buttonElements.push({ baseY: taglineY, buttonBox: null, glowBox: null, iconBg: null, icon: null, btn: tagline, arrow: null, isTagline: true });

        // Menu scroll handler
        const updateMenuScroll = (newOffset) => {
            scrollOffset = Phaser.Math.Clamp(newOffset, 0, maxScroll);
            buttonElements.forEach(elem => {
                const newY = elem.baseY - scrollOffset;
                if (!elem.isTagline) {
                    elem.buttonBox.setY(newY);
                    elem.glowBox.setY(newY);
                    elem.iconBg.setY(newY);
                    elem.icon.setY(newY);
                    elem.arrow.setY(newY);
                }
                elem.btn.setY(newY);
            });
        };

        // Menu scroll with mouse wheel
        this.input.on('wheel', (pointer, over, deltaX, deltaY) => {
            updateMenuScroll(scrollOffset + deltaY * 0.5);
        });

        // Menu scroll with arrow keys
        this.input.keyboard.on('keydown-UP', () => {
            updateMenuScroll(scrollOffset - 50);
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            updateMenuScroll(scrollOffset + 50);
        });

        // Setup audio controls for the top bar
        this.setupAudioControls();

        // Add shutdown cleanup
        this.events.once('shutdown', () => {
            const muteBtn = document.getElementById('mute-btn');
            const volumeSlider = document.getElementById('volume-slider');
            if (muteBtn && this.muteClickHandler) {
                muteBtn.removeEventListener('click', this.muteClickHandler);
            }
            if (volumeSlider && this.volumeChangeHandler) {
                volumeSlider.removeEventListener('input', this.volumeChangeHandler);
            }
        });
    }

    setupAudioControls() {
        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');
        
        // Initialize UI state
        if (muteBtn) {
            muteBtn.textContent = this.audioManager.getIsMuted() ? '🔇' : '🔊';
        }
        if (volumeSlider) {
            volumeSlider.value = Math.round(this.audioManager.getMasterVolume() * 100);
        }

        // Store references for cleanup on shutdown
        this.muteClickHandler = () => {
            const isMuted = this.audioManager.toggleMute();
            muteBtn.textContent = isMuted ? '🔇' : '🔊';
            this.audioManager.playClick();
        };
        
        this.volumeChangeHandler = (e) => {
            const volume = parseFloat(e.target.value) / 100;
            this.audioManager.setMasterVolume(volume);
        };

        if (muteBtn) {
            muteBtn.addEventListener('click', this.muteClickHandler);
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', this.volumeChangeHandler);
        }
    }

    showAchievements() {
        // Simple modal listing unlocked achievements
        const { width, height } = this.scale;
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setDepth(50);
        const panel = this.add.rectangle(width/2, height/2, 600, 380, 0x1a1a2e).setDepth(51).setStrokeStyle(2, 0x64d5ff);

        const title = this.add.text(width/2, height/2 - 160, 'ACHIEVEMENTS', { fontSize: '32px', color: '#FFD700', fontStyle: 'bold', fontFamily: 'Arial' }).setOrigin(0.5).setDepth(52);

        // Load achievements
        import('./AchievementManager.js').then(mod => {
            const AchievementManager = mod.default;
            const all = AchievementManager.ACHIEVEMENTS;
            const unlocked = AchievementManager.getAchievements();
            let i = 0;
            Object.keys(all).forEach(key => {
                const a = all[key];
                const unlockedFlag = !!unlocked[key];
                this.add.text(width/2 - 220 + (i%2)*260, height/2 - 110 + Math.floor(i/2)*60, `${a.icon} ${a.name}${unlockedFlag ? ' ✓' : ''}`, { fontSize: '18px', color: unlockedFlag ? '#a8ffb0' : '#888', fontFamily: 'Arial' }).setDepth(52);
                i++;
            });
        });

        const close = this.add.text(width/2, height/2 + 150, 'CLOSE', { fontSize: '20px', color: '#fff', backgroundColor: '#6366f1', padding: { x: 12, y: 8 }, fontFamily: 'Arial' }).setOrigin(0.5).setDepth(52).setInteractive({ useHandCursor: true });
        close.on('pointerdown', () => { overlay.destroy(); panel.destroy(); title.destroy(); close.destroy(); this.scene.restart(); });
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

    selectLevel() {
        // If the player hasn't seen the tutorial yet, show it first
        const seen = localStorage.getItem('mythological_defense_tutorial_seen');
        if (!seen) {
            this.scene.start('TutorialScene');
        } else {
            this.scene.start('LevelSelectScene');
        }
    }

    viewTutorial() {
        // Allow player to view tutorial anytime from menu
        this.scene.start('TutorialScene');
    }

    exitGame() {
        const { width, height } = this.scale;

        // Disable all buttons
        this.buttons.forEach(btn => {
            btn.btn.disableInteractive();
            btn.buttonBox.disableInteractive();
            btn.icon.disableInteractive();
            btn.iconBg.disableInteractive();
            btn.arrow.disableInteractive();
            btn.glowBox.disableInteractive();
        });

        // Dark overlay
        const overlay = this.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7)
            .setDepth(19);

        // Exit confirmation panel
        const panel = this.add.rectangle(width/2, height/2, 400, 250, 0x1a1a2e)
            .setStrokeStyle(3, 0xff6b6b, 0.8)
            .setDepth(20);

        // Confirmation text
        const titleText = this.add.text(width/2, height/2 - 60, 'EXIT GAME?', {
            fontSize: '44px',
            fontStyle: 'bold',
            color: '#ff6b6b',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21);

        const descText = this.add.text(width/2, height/2, 'Are you sure you want to close?', {
            fontSize: '20px',
            color: '#cccccc',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21);

        // Confirm button
        const confirmBtn = this.add.text(width/2 - 90, height/2 + 60, 'YES', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#ff6b6b',
            padding: { x: 20, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

        // Cancel button
        const cancelBtn = this.add.text(width/2 + 90, height/2 + 60, 'NO', {
            fontSize: '24px',
            fontStyle: 'bold',
            color: '#ffffff',
            backgroundColor: '#4a9eff',
            padding: { x: 20, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(21).setInteractive({ useHandCursor: true });

        confirmBtn.on('pointerdown', () => {
            // Close the game window
            if (window.opener) {
                window.close();
            } else {
                // Fallback: hide game and show exit message
                document.getElementById('game-container').innerHTML = 
                    '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:#0b102a;font-size:2em;color:#64d5ff;font-family:Arial;">Thanks for playing!</div>';
            }
        });

        cancelBtn.on('pointerdown', () => {
            overlay.destroy();
            panel.destroy();
            titleText.destroy();
            descText.destroy();
            confirmBtn.destroy();
            cancelBtn.destroy();
            this.buttons.forEach(btn => {
                btn.btn.setInteractive();
                btn.buttonBox.setInteractive({ useHandCursor: true });
                btn.icon.setInteractive({ useHandCursor: true });
                btn.iconBg.setInteractive({ useHandCursor: true });
                btn.arrow.setInteractive({ useHandCursor: true });
                btn.glowBox.setInteractive({ useHandCursor: true });
            });
        });
    }

    settingsGame() {
        this.scene.start('SettingsScene');
    }
}
