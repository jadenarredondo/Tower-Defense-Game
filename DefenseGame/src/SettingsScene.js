import ProgressManager from './ProgressManager.js';
import AudioManager from './AudioManager.js';

export default class SettingsScene extends Phaser.Scene {
    constructor() {
        super('SettingsScene');
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
        this.add.text(width / 2, height / 4 - 80, 'SETTINGS', {
            fontSize: '68px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 8,
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // --------- DEV ---------
        const DEVY = height / 2 - 60;
        this.Dev = this.add.text(width / 2 + 200, DEVY - 50, 'DEV', {
            fontSize: '28px',
            color: '#64d5ff',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0,0).setInteractive({ useHandCursor: true });

        this.Dev.on('pointerdown', () => {
            this.scene.start('DEVTools');
        });

        this.Dev.on('pointerover', () => {
            this.Dev.setScale(1.05);
        });

        this.Dev.on('pointerout', () => {
            this.Dev.setScale(1);
        });

        // DEV Buttons

        // //Level 1
        // //const DEVBY = DEVY + 10;
        // this.DBtn1 = this.add.text(width / 2 + 200, DEVY + 10, 'Level 1 Unlock', {
        //     fontSize: '20px',
        //     //color: isMuted ? '#ff6b6b' : '#64d5ff',
        //     fontStyle: 'bold',
        //     //backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
        //     padding: { x: 15, y: 10 },
        //     fontFamily: 'Arial, sans-serif'
        // }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        // this.DBtn1.on('pointerdown', () => {
        //     ProgressManager.completeLevel(1);
        // });

        // this.DBtn1.on('pointerover', () => {
        //     this.DBtn1.setScale(1.05);
        // });

        // this.DBtn1.on('pointerout', () => {
        //     this.DBtn1.setScale(1);
        // });

        // //Level 2
        
        // this.DBtn2 = this.add.text(width / 2 + 200, DEVY + 40, 'Level 2 Unlock', {
        //     fontSize: '20px',
        //     //color: isMuted ? '#ff6b6b' : '#64d5ff',
        //     fontStyle: 'bold',
        //     //backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
        //     padding: { x: 15, y: 10 },
        //     fontFamily: 'Arial, sans-serif'
        // }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        // this.DBtn2.on('pointerdown', () => {
        //     ProgressManager.completeLevel(2);
        // });

        // this.DBtn2.on('pointerover', () => {
        //     this.DBtn2.setScale(1.05);
        // });

        // this.DBtn2.on('pointerout', () => {
        //     this.DBtn2.setScale(1);
        // });

        // //Level 3
        
        // this.DBtn3 = this.add.text(width / 2 + 200, DEVY + 70, 'Level 3 Unlock', {
        //     fontSize: '20px',
        //     //color: isMuted ? '#ff6b6b' : '#64d5ff',
        //     fontStyle: 'bold',
        //     //backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
        //     padding: { x: 15, y: 10 },
        //     fontFamily: 'Arial, sans-serif'
        // }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        // this.DBtn3.on('pointerdown', () => {
        //     ProgressManager.completeLevel(3);
        // });

        // this.DBtn3.on('pointerover', () => {
        //     this.DBtn3.setScale(1.05);
        // });

        // this.DBtn3.on('pointerout', () => {
        //     this.DBtn3.setScale(1);
        // });

        // //Level 4
        
        // this.DBtn4 = this.add.text(width / 2 + 200, DEVY + 100, 'Level 4 Unlock', {
        //     fontSize: '20px',
        //     //color: isMuted ? '#ff6b6b' : '#64d5ff',
        //     fontStyle: 'bold',
        //     //backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
        //     padding: { x: 15, y: 10 },
        //     fontFamily: 'Arial, sans-serif'
        // }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        // this.DBtn4.on('pointerdown', () => {
        //     ProgressManager.completeLevel(4);
        // });

        // this.DBtn4.on('pointerover', () => {
        //     this.DBtn4.setScale(1.05);
        // });

        // this.DBtn4.on('pointerout', () => {
        //     this.DBtn4.setScale(1);
        // });


        // ---------- AUDIO SECTION ----------
        const audioY = height / 2 - 60;
        this.add.text(width / 2 - 500, audioY - 50, 'AUDIO SETTINGS', {
            fontSize: '28px',
            color: '#64d5ff',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0);

        // Master Volume Slider
        this.masterVolumeControls = this.createVolumeControl(width / 2 - 450, audioY, 'MASTER VOLUME', 
            this.audioManager?.getMasterVolume() || 0.3, 
            (val) => {
                console.log('Setting master volume to:', val);
                this.audioManager?.setMasterVolume(val);
                // Update the top bar volume slider
                const volumeSlider = document.getElementById('volume-slider');
                if (volumeSlider) {
                    volumeSlider.value = Math.round(val * 100);
                }
            });

        // Sound Volume Slider
        this.soundVolumeControls = this.createVolumeControl(width / 2 - 450, audioY + 50, 'SOUND VOLUME', 
            this.audioManager?.getSoundVolume() || 0.4, 
            (val) => {
                console.log('Setting sound volume to:', val);
                this.audioManager?.setSoundVolume(val);
            });

        // Music Volume Slider
        this.musicVolumeControls = this.createVolumeControl(width / 2 - 450, audioY + 100, 'MUSIC VOLUME', 
            this.audioManager?.getMusicVolume() || 0.25, 
            (val) => {
                console.log('Setting music volume to:', val);
                this.audioManager?.setMusicVolume(val);
            });

        // Mute Button
        const muteY = audioY + 160;
        const isMuted = this.audioManager?.getIsMuted() || false;
        this.muteBtn = this.add.text(width / 2 - 450, muteY, `MUTE: ${isMuted ? 'ON' : 'OFF'}`, {
            fontSize: '20px',
            color: isMuted ? '#ff6b6b' : '#64d5ff',
            fontStyle: 'bold',
            backgroundColor: isMuted ? '#4a2a2a' : '#1a3a3e',
            padding: { x: 15, y: 10 },
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        this.muteBtn.on('pointerdown', () => {
            const newMuteState = this.audioManager?.toggleMute() || false;
            this.muteBtn.setText(`MUTE: ${newMuteState ? 'ON' : 'OFF'}`);
            this.muteBtn.setColor(newMuteState ? '#ff6b6b' : '#64d5ff');
            this.muteBtn.setBackgroundColor(newMuteState ? '#4a2a2a' : '#1a3a3e');
            
            // Update the top bar mute button
            const topMuteBtn = document.getElementById('mute-btn');
            if (topMuteBtn) {
                topMuteBtn.textContent = newMuteState ? '🔇' : '🔊';
            }
        });

        this.muteBtn.on('pointerover', () => {
            this.muteBtn.setScale(1.05);
        });

        this.muteBtn.on('pointerout', () => {
            this.muteBtn.setScale(1);
        });

        // ---------- SET TO DEFAULT BUTTON (moved to audio section) ----------
        const defaultBtn = this.add.text(width / 2 - 450, audioY + 220, 'SET TO DEFAULT', {
            fontSize: '24px',
            color: '#ffa500',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0).setInteractive({ useHandCursor: true });

        defaultBtn.on('pointerover', () => {
            defaultBtn.setColor('#ffffff');
            defaultBtn.setScale(1.05);
        });

        defaultBtn.on('pointerout', () => {
            defaultBtn.setColor('#ffa500');
            defaultBtn.setScale(1);
        });

        defaultBtn.on('pointerdown', () => {
            this.resetToDefaults();
        });

        // ---------- DELETE DATA BUTTON ----------
        const deleteBtn = this.add.text(width / 2, height - 120, 'DELETE ALL DATA', {
            fontSize: '28px',
            color: '#ff6b6b',
            fontStyle: 'bold',
            align: 'center',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        deleteBtn.on('pointerover', () => {
            deleteBtn.setColor('#ffffff');
            deleteBtn.setScale(1.05);
        });

        deleteBtn.on('pointerout', () => {
            deleteBtn.setColor('#ff6b6b');
            deleteBtn.setScale(1);
        });

        deleteBtn.on('pointerdown', () => {
            this.showDeleteConfirmation();
        });

        // ---------- BACK BUTTON ----------
        const backBtn = this.add.text(width / 2, height - 40, 'BACK TO MENU', {
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
            this.scene.start('MenuScene');
        });

        // ESC to go back
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    /**
     * Create a volume control slider with label and display
     */
    createVolumeControl(x, y, label, initialValue, callback) {
        // Label
        this.add.text(x, y, label, {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0);

        // Background bar
        const barWidth = 200;
        const barHeight = 20;
        const barX = x + 150;
        const bar = this.add.rectangle(barX, y + 9, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0.5)
            .setStrokeStyle(2, 0x64d5ff, 1);

        // Filled portion
        const fill = this.add.rectangle(barX, y + 9, barWidth * initialValue, barHeight, 0x64d5ff)
            .setOrigin(0, 0.5);

        // Value display
        const valueText = this.add.text(barX + barWidth + 20, y, Math.round(initialValue * 100) + '%', {
            fontSize: '16px',
            color: '#64d5ff',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0, 0);

        // Make bar interactive
        bar.setInteractive({ useHandCursor: true });

        bar.on('pointerdown', (pointer) => {
            this.updateVolumeSlider(pointer, bar, fill, barX, barWidth, valueText, callback);
        });

        bar.on('pointermove', (pointer) => {
            if (pointer.isDown) {
                this.updateVolumeSlider(pointer, bar, fill, barX, barWidth, valueText, callback);
            }
        });

        // Return references for updating
        return { fill, valueText };
    }

    /**
     * Update the volume slider position based on pointer
     */
    updateVolumeSlider(pointer, bar, fill, barX, barWidth, valueText, callback) {
        const relativeX = pointer.x - barX;
        const clampedX = Math.max(0, Math.min(barWidth, relativeX));
        const volumePercent = clampedX / barWidth;

        // Update fill bar width (don't change origin)
        fill.setSize(clampedX, fill.height);

        valueText.setText(Math.round(volumePercent * 100) + '%');

        if (callback) {
            callback(volumePercent);
        }
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

    /**
     * Reset audio settings to default values
     */
    resetToDefaults() {
        if (!this.audioManager) return;

        // Reset to default values
        this.audioManager.setMasterVolume(0.5);
        this.audioManager.setSoundVolume(0.4);
        this.audioManager.setMusicVolume(0.6);
        this.audioManager.setMute(false);

        // Update settings scene sliders
        if (this.masterVolumeControls) {
            this.masterVolumeControls.fill.setSize(200 * 0.5, this.masterVolumeControls.fill.height);
            this.masterVolumeControls.valueText.setText('50%');
        }
        if (this.soundVolumeControls) {
            this.soundVolumeControls.fill.setSize(200 * 0.4, this.soundVolumeControls.fill.height);
            this.soundVolumeControls.valueText.setText('40%');
        }
        if (this.musicVolumeControls) {
            this.musicVolumeControls.fill.setSize(200 * 0.6, this.musicVolumeControls.fill.height);
            this.musicVolumeControls.valueText.setText('60%');
        }

        // Update mute button in settings
        if (this.muteBtn) {
            this.muteBtn.setText('MUTE: OFF');
            this.muteBtn.setColor('#64d5ff');
            this.muteBtn.setBackgroundColor('#1a3a3e');
        }

        // Update top bar controls
        const volumeSlider = document.getElementById('volume-slider');
        const muteBtn = document.getElementById('mute-btn');
        if (volumeSlider) {
            volumeSlider.value = 50; // 0.5 * 100
        }
        if (muteBtn) {
            muteBtn.textContent = '🔊';
        }

        // Show confirmation message
        const { width, height } = this.scale;
        const confirmText = this.add.text(width / 2, height / 2, 'Audio settings reset to defaults!', {
            fontSize: '24px',
            color: '#64d5ff',
            fontStyle: 'bold',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5).setDepth(25);

        // Remove confirmation after 2 seconds
        this.time.delayedCall(2000, () => {
            confirmText.destroy();
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
