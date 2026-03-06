/**
 * EffectsManager - Handles all visual effects and animations
 */
export default class EffectsManager {
    constructor(scene) {
        this.scene = scene;
    }

    /**
     * Create a damage number pop-up with physics
     */
    createDamageNumber(x, y, damage) {
        const damageText = this.scene.add.text(x, y, `-${Math.floor(damage)}`, {
            fontSize: '32px',
            fill: '#ff6b6b',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(2000);

        this.scene.tweens.add({
            targets: damageText,
            y: y - 80,
            alpha: 0,
            scale: 0.8,
            duration: 800,
            ease: 'Quad.easeOut',
                       useFrames: false,
            onComplete: () => damageText.destroy()
        });
    }

    /**
     * Create a healing/buff number
     */
    createHealNumber(x, y, amount) {
        const healText = this.scene.add.text(x, y, `+${Math.floor(amount)}`, {
            fontSize: '28px',
            fill: '#10b981',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            stroke: '#065f46',
            strokeThickness: 3
        }).setOrigin(0.5).setDepth(2000);

        this.scene.tweens.add({
            targets: healText,
            y: y - 70,
            alpha: 0,
            duration: 1000,
                       useFrames: false,
            ease: 'Quad.easeOut',
            onComplete: () => healText.destroy()
        });
    }

    /**
     * Create a screen shake effect
     */
    shake(duration = 200, intensity = 10) {
        const camera = this.scene.cameras.main;
        const originalX = camera.x;
        const originalY = camera.y;

        this.scene.tweens.add({
            targets: { x: 0, y: 0 },
            x: { from: 0, to: intensity },
            y: { from: 0, to: intensity },
            duration: duration,
            repeat: -1,
            yoyo: true,
            ease: 'Linear',
                       useFrames: false,
            onUpdate: (tween) => {
                camera.setPosition(originalX + (Math.random() - 0.5) * intensity * 2,
                                 originalY + (Math.random() - 0.5) * intensity * 2);
            },
            onComplete: () => {
                camera.setPosition(originalX, originalY);
            }
        });
    }

    /**
     * Create a pulse effect on a sprite
     */
    pulse(target, duration = 500, scale = 1.1) {
        return this.scene.tweens.add({
            targets: target,
            scale: scale,
                       useFrames: false,
            duration: duration,
            yoyo: true,
            ease: 'Quad.easeInOut'
        });
    }

    /**
     * Create a glow effect by tinting
     */
    glow(target, color = 0xffff00, duration = 300) {
        target.setTint(color);
        this.scene.time.delayedCall(duration, () => {
            target.clearTint();
        });
    }

    /**
     * Create a laser beam effect between two points
     */
    createBeam(x1, y1, x2, y2, color = 0x00ffff, duration = 150) {
        const line = this.scene.add.line(0, 0, x1, y1, x2, y2, color, 0.7)
            .setOrigin(0)
            .setDepth(1500)
            .setLineWidth(3);

        this.scene.time.delayedCall(duration, () => {
            line.destroy();
        });
    }

    /**
     * Create a spinning effect
     */
    spin(target, duration = 1000, rotations = 2) {
        return this.scene.tweens.add({
            targets: target,
            rotation: Math.PI * 2 * rotations,
                       useFrames: false,
            duration: duration,
            ease: 'Linear'
        });
    }

    /**
     * Create a blink effect
     */
    blink(target, times = 5, duration = 300) {
        const blinkDuration = duration / (times * 2);
        
        for (let i = 0; i < times * 2; i++) {
            this.scene.time.delayedCall(blinkDuration * i, () => {
                target.setAlpha(target.alpha === 1 ? 0.3 : 1);
            });
        }
        
        this.scene.time.delayedCall(duration, () => {
            target.setAlpha(1);
        });
    }

    /**
     * Create a bouncing animation
     */
    bounce(target, bounces = 3, height = 30, duration = 500) {
        const originalY = target.y;
        
        return this.scene.tweens.add({
            targets: target,
            y: originalY - height,
            duration: duration / (bounces * 2),
            repeat: bounces * 2 - 1,
            yoyo: true,
            ease: 'Power1.easeOut',
            useFrames: false
        });
    }

    /**
     * Create confetti explosion
     */
    confetti(x, y, count = 12, colors = [0xff6b6b, 0xffd700, 0x64d5ff]) {
        for (let i = 0; i < count; i++) {
            const color = Phaser.Utils.Array.GetRandom(colors);
            const particle = this.scene.add.rectangle(x, y, 6, 6, color, 0.8)
                .setDepth(1000);
            
            const angle = (Math.PI * 2 * i) / count;
            const vx = Math.cos(angle) * 200;
            const vy = Math.sin(angle) * 200;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + vx,
                y: y + vy - 100,
                alpha: 0,
                rotation: Math.random() * Math.PI * 2,
                duration: 1000,
                ease: 'Power2.easeOut',
                               useFrames: false,
                onComplete: () => particle.destroy()
            });
        }
    }

    /**
     * Create a flash effect across the screen
     */
    flash(duration = 200, color = 0xffffff, alpha = 0.5) {
        const { width, height } = this.scene.scale;
        const flash = this.scene.add.rectangle(width / 2, height / 2, width, height, color, alpha)
            .setDepth(10000);
        
        this.scene.tweens.add({
            targets: flash,
                       useFrames: false,
            alpha: 0,
            duration: duration,
            ease: 'Linear',
            onComplete: () => flash.destroy()
        });
    }

    /**
     * Create a tilt/rock effect
     */
    tilt(target, angle = 5, duration = 300) {
        return this.scene.tweens.add({
            targets: target,
            rotation: Phaser.Math.DegToRad(angle),
                       useFrames: false,
            duration: duration,
            yoyo: true,
            ease: 'Quad.easeInOut'
        });
    }
}
