export default class Tower {
    constructor(scene, x, y, config = {}, audioManager = null) {
        this.scene = scene;
        this.audioManager = audioManager;
        this.range = config.range || 220;
        this.damage = config.damage || 1;
        this.attackSpeed = config.attackSpeed || 500;
        this.level = 1;
        this.totalDamage = 0;
        this.type = config.name || 'Basic';

        this.moneyGain = config.moneyGain || 0;
        
        // Track upgrade counts (max 3 of each)
        this.damageUpgrades = 0;
        this.rangeUpgrades = 0;
        this.speedUpgrades = 0;
        this.maxUpgradesPerType = 3;
        
        // Tower scaling for visual variety
        const scale = config.scaleMult || 1;

        this.sprite = scene.add.sprite(x, y, 'tower')
            .setOrigin(0.5)
            .setScale(2 * scale)
            .setDepth(5200);

        // Draw visible range circle
        this.rangeCircle = scene.add.circle(x, y, this.range, 0x00ffff, 0.2)
            .setDepth(5150);

        if (!scene.anims.exists('tower_attack')) {
            scene.anims.create({
                key: 'tower_attack',
                frames: scene.anims.generateFrameNumbers('tower', { start: 0, end: 15 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.sprite.play('tower_attack');

        this.timer = scene.time.addEvent({
            delay: this.attackSpeed,
            loop: true,
            callback: this.attack,
            callbackScope: this
        });

        this.incInterval = 30000;
        this.incomeStart();


    }

    incomeStart() {
        this.scene.time.addEvent({
            delay: this.incInterval,
            callback: this.income,
            callbackScope: this,
            loop: true
        });
    }

    income() {
        this.scene.gold += this.moneyGain;
        console.log(`🌾 Farm income: +${this.moneyGain} gold (Total: ${this.scene.gold})`);
    }

    // income() {
    //     this.cWave = this.scene.currentWave;
    //     if(this.scene.currentWave > this.cWave) {
    //         this.scene.gold += this.moneyGain;
    //         this.cWave += 1;
    //         console.log('money earned');
    //     }
        
    // }

    attack() {
        const enemies = this.scene.enemies.getChildren();
        
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                enemy.x, enemy.y
            );

            if (dist <= this.range) {
                enemy.hp -= this.damage;
                enemy.healthBar.setScale(enemy.hp / enemy.maxHp, 1);

                    if (enemy.isFlying && this.scene.anims.exists('flying_hurt')) {
                        enemy.play('flying_hurt');
                        enemy.once('animationcomplete', () => {
                            if (enemy.active) {
                                // Check if currently moving by checking if there's a movement tween
                                const hasTween = this.scene.tweens.getTweensOf(enemy).length > 0;
                                if (hasTween && this.scene.anims.exists('flying_fly')) {
                                    enemy.play('flying_fly');
                                } else if (this.scene.anims.exists('flying_walk')) {
                                    enemy.play('flying_walk');
                                }
                            }
                        });
                    }

                // Tower flash effect on attack
                this.flashTower();

                // Create kill effect
                this.createKillEffect(enemy.x, enemy.y);
                
                // Play attack sound
                if (this.audioManager) {
                    this.audioManager.playTowerAttack();
                }

                // Knockback effect on enemy
                const angle = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, enemy.x, enemy.y);
                const knockbackDistance = 20;
                const knockbackX = Math.cos(angle) * knockbackDistance;
                const knockbackY = Math.sin(angle) * knockbackDistance;

                this.scene.tweens.add({
                    targets: enemy,
                    x: enemy.x + knockbackX,
                    y: enemy.y + knockbackY,
                    duration: 100,
                    ease: 'Power2.easeOut',
                    yoyo: true
                });

                // Damage popup
                if (this.scene.effectsManager) {
                    this.scene.effectsManager.createDamageNumber(enemy.x, enemy.y, this.damage);
                }

                if (enemy.hp <= 0) {
                    // Play kill sound
                    if (this.audioManager) {
                        this.audioManager.playEnemyKilled();
                    }

                    // Award gold for kill
                    const goldReward = Math.floor(this.scene.baseGoldReward * (1 + this.scene.currentWave * 0.5));
                    this.scene.gold += goldReward;
                    
                    // Create floating text
                    this.createFloatingText(enemy.x, enemy.y, `+${goldReward}`, '#FFD700');
                    
                    // Play gold collection sound
                    if (this.audioManager) {
                        this.audioManager.playGoldCollected();
                    }
                    
                    const finalizeKill = () => {
                        enemy.healthBar.destroy();
                        enemy.destroy();
                        this.scene.enemies.remove(enemy);
                        this.scene.enemiesAlive--;
                        console.log(`🎯 Enemy killed! Gold: +${goldReward} (Total: ${this.scene.gold})`);
                        if (this.scene.effectsManager) {
                            this.scene.effectsManager.confetti(enemy.x, enemy.y);
                        }
                    };

                    if (enemy.isFlying && this.scene.anims.exists('flying_dead')) {
                        enemy.play('flying_dead');
                        enemy.once('animationcomplete', finalizeKill);
                        // Fallback timeout in case animation never completes (500ms max)
                        this.scene.time.delayedCall(500, () => {
                            if (enemy.active) finalizeKill();
                        });
                    } else {
                        finalizeKill();
                    }
                }

                break;
            }
        }
    }

    flashTower() {
        const originalTint = this.sprite.tint;
        this.sprite.setTint(0xffffff);
        
        // Add glow effect to range circle
        this.rangeCircle.setStrokeStyle(3, 0xffff00, 0.8);
        
        this.scene.time.delayedCall(50, () => {
            this.sprite.clearTint();
            this.rangeCircle.setStrokeStyle(2, 0x00ffff, 0.2);
        });
    }

    createKillEffect(x, y) {
        // Add a quick flash effect
        const circle = this.scene.add.circle(x, y, 30, 0xffff00, 0.6)
            .setDepth(1000);
        
        this.scene.tweens.add({
            targets: circle,
            scale: 2,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => circle.destroy()
        });

        // Add particle-like effect with multiple circles
        for (let i = 0; i < 6; i++) {
            const particle = this.scene.add.circle(x, y, 4, 0xffaa00, 0.8)
                .setDepth(1000);
            
            const angle = (Math.PI * 2 * i) / 6;
            const vx = Math.cos(angle) * 100;
            const vy = Math.sin(angle) * 100;
            
            this.scene.tweens.add({
                targets: particle,
                x: x + vx,
                y: y + vy,
                alpha: 0,
                scale: 0,
                duration: 400,
                ease: 'Power2.easeOut',
                onComplete: () => particle.destroy()
            });
        }
    }

    createFloatingText(x, y, text, color) {
        const floatingText = this.scene.add.text(x, y, text, {
            fontSize: '28px',
            fill: color,
            fontStyle: 'bold',
            fontFamily: 'Arial',
            stroke: '#000000',
            strokeThickness: 3,
            shadow: {
                offsetX: 2,
                offsetY: 2,
                color: '#000000',
                blur: 5,
                fill: true
            }
        }).setOrigin(0.5).setDepth(2000);

        const shadowOffset = 4;
        const shadow = this.scene.add.text(x + shadowOffset, y + shadowOffset, text, {
            fontSize: '28px',
            fill: '#000000',
            fontStyle: 'bold',
            fontFamily: 'Arial',
            alpha: 0.3
        }).setOrigin(0.5).setDepth(1999);

        this.scene.tweens.add({
            targets: [floatingText, shadow],
            y: y - 80,
            alpha: 0,
            duration: 1200,
            ease: 'Quad.easeOut',
            onComplete: () => {
                floatingText.destroy();
                shadow.destroy();
            }
        });
    }

    upgrade() {
        // Check if tower has reached max upgrade level (level represents total upgrades + 1)
        if (this.level - 1 >= this.maxUpgradesPerType) {
            console.log('❌ Tower has reached maximum upgrade level!');
            return false;
        }
        
        this.level++;
        this.damage += 1;  // Power tower gets better damage
        this.attackSpeed = Math.max(200, this.attackSpeed - 75);  // More aggressive improvement
        
        // Visual feedback - much more visible increase in size
        this.sprite.setScale(2 + this.level * 0.3);
        
        // Play upgrade sound
        if (this.audioManager) {
            this.audioManager.playUpgrade();
        }
        
        // Update attack timer with new speed
        if (this.timer) {
            this.timer.destroy();
            this.timer = this.scene.time.addEvent({
                delay: this.attackSpeed,
                loop: true,
                callback: this.attack,
                callbackScope: this
            });
        }
        
        console.log(`🔧 Tower upgraded to level ${this.level}! Damage: ${this.damage.toFixed(1)}, Size: ${(2 + this.level * 0.3).toFixed(1)}x, Speed: ${this.attackSpeed}ms`);
        return true;
    }
}
