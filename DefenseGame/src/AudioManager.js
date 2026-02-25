/**
 * AudioManager - Handles all sound effects and music
 * Uses Web Audio API for synthetic sound generation
 */
export default class AudioManager {
    constructor() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not available');
            this.audioContext = null;
        }
        this.isMuted = false;
        this.masterVolume = 0.3;
        this.soundVolume = 0.4;
        this.musicVolume = 0.25;
        this.backgroundMusic = null;
        this.sounds = {};
    }

    /**
     * Play background music loop - Peaceful ambient meditation theme
     */
    playBackgroundMusic() {
        if (!this.audioContext || this.isMuted) return;
        if (this.backgroundMusic) this.backgroundMusic.stop();
        
        const now = this.audioContext.currentTime;
        const beatDuration = 1.0;  // Slower, more meditative pace
        
        // Peaceful pad (long sustained note)
        const playPad = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            // Smooth attack and release for peaceful effect
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.08 * this.musicVolume * this.masterVolume, startTime + 0.5);
            gain.gain.linearRampToValueAtTime(0.06 * this.musicVolume * this.masterVolume, startTime + duration - 0.5);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // Soft bass foundation
        const playBasePad = (freq, startTime, duration) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.05 * this.musicVolume * this.masterVolume, startTime + 0.3);
            gain.gain.linearRampToValueAtTime(0.04 * this.musicVolume * this.masterVolume, startTime + duration - 0.3);
            gain.gain.linearRampToValueAtTime(0, startTime + duration);
            osc.start(startTime);
            osc.stop(startTime + duration);
        };
        
        // Loop the peaceful music
        const beatPattern = () => {
            if (!this.isMuted && this.backgroundMusic !== null) {
                const loopStart = this.audioContext.currentTime;
                const loopDuration = 8 * beatDuration;  // 8 second loop
                
                // Peaceful chord progression: Am, G, F, C (natural minor scale)
                // Using low frequencies for peaceful ambient effect
                const bassNotes = [55, 49, 44, 33];  // A2, G2, F2, C2
                const midNotes = [110, 98, 88, 66];   // One octave up
                const highNotes = [220, 196, 176, 132]; // One more octave up
                
                for (let i = 0; i < 4; i++) {
                    const beatTime = loopStart + i * 2 * beatDuration;
                    // Layer multiple frequencies for rich ambient pad
                    playBasePad(bassNotes[i], beatTime, 2 * beatDuration);
                    playPad(midNotes[i], beatTime + 0.1, 2 * beatDuration);
                    playPad(highNotes[i], beatTime + 0.2, 2 * beatDuration);
                }
                
                setTimeout(beatPattern, loopDuration * 1000);
            }
        };
        
        this.backgroundMusic = { stop: () => { this.backgroundMusic = null; } };
        beatPattern();
    }

    /**
     * Stop background music
     */
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.stop();
            this.backgroundMusic = null;
        }
    }

    /**
     * Play tower attack sound effect
     */
    playTowerAttack() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(200, now + 0.1);
        
        gain.gain.setValueAtTime(this.soundVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        osc.start(now);
        osc.stop(now + 0.1);
    }

    /**
     * Play tower placement sound
     */
    playTowerPlace() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const notes = [800, 900, 1000];
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            const startTime = now + (i * 0.05);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(this.soundVolume * 0.6 * this.masterVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);
            
            osc.start(startTime);
            osc.stop(startTime + 0.08);
        });
    }

    /**
     * Play gold collection sound
     */
    playGoldCollected() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            const startTime = now + (i * 0.08);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.3 * this.soundVolume * this.masterVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
            
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    /**
     * Play enemy killed sound
     */
    playEnemyKilled() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        // Create a short burst effect
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
        
        gain.gain.setValueAtTime(this.soundVolume * 0.5 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }

    /**
     * Play damage/hit sound
     */
    playDamage() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.08);
        
        gain.gain.setValueAtTime(this.soundVolume * 0.6 * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        osc.start(now);
        osc.stop(now + 0.08);
    }

    /**
     * Play button click sound
     */
    playClick() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.15 * this.soundVolume * this.masterVolume, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * Play wave start sound
     */
    playWaveStart() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const notes = [440, 550, 660]; // A4, C#5, E5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            const startTime = now + (i * 0.1);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.3 * this.soundVolume * this.masterVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
            
            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }

    /**
     * Play game over sound (lose)
     */
    playGameOver() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const notes = [330, 294, 262]; // E4, D4, C4
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            const startTime = now + (i * 0.2);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.4 * this.soundVolume * this.masterVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    /**
     * Play victory sound
     */
    playVictory() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            const startTime = now + (i * 0.15);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.3 * this.soundVolume * this.masterVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    /**
     * Play upgrade sound
     */
    playUpgrade() {
        if (!this.audioContext || this.isMuted) return;
        
        const now = this.audioContext.currentTime;
        const notes = [349.23, 440, 523.25]; // F4, A4, C5
        
        notes.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            
            const startTime = now + (i * 0.1);
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.35 * this.soundVolume * this.masterVolume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
            
            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    /**
     * Generic tone player for custom sounds
     */
    playTone(frequency, duration, options = {}) {
        if (!this.audioContext) return null;
        
        const now = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = options.type || 'sine';
        osc.frequency.setValueAtTime(options.frequency || frequency, now);
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        const volume = options.volume || (this.soundVolume * this.masterVolume);
        const actualDuration = (duration || 1000) / 1000;
        
        if (options.fadeIn) {
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(volume, now + (options.fadeIn / 1000));
        } else {
            gain.gain.setValueAtTime(volume, now);
        }
        
        if (!options.loop) {
            gain.gain.exponentialRampToValueAtTime(0.01, now + actualDuration);
        }
        
        osc.start(now);
        
        if (!options.loop) {
            osc.stop(now + actualDuration);
        }
        
        return { osc, gain, stop: () => { try { osc.stop(); } catch (e) {} } };
    }

    /**
     * Toggle mute
     */
    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }

    /**
     * Set master volume
     */
    setMasterVolume(val) {
        this.masterVolume = Math.max(0, Math.min(1, val));
    }

    /**
     * Set sound effect volume
     */
    setSoundVolume(val) {
        this.soundVolume = Math.max(0, Math.min(1, val));
    }

    /**
     * Set music volume
     */
    setMusicVolume(val) {
        this.musicVolume = Math.max(0, Math.min(1, val));
    }

    /**
     * Resume audio context (required for user gesture)
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}
