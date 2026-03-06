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
        this.baseCost = config.cost || 50; // Store original cost for sell price calculation
        this.imageKey = config.image || 'tower_izanami'; // Get image key from config
        this.frameCount = config.frames || 1; // Number of animation frames

        this.moneyGain = config.moneyGain || 0;
        this.projectileKey = config.projectile || null; // For towers that shoot projectiles
        
        // Track upgrades (max 10 levels total)
        this.maxLevel = 10;
        this.upgradeCost = 100; // Standard cost per upgrade
        
        // Tower scaling for visual variety
        const scale = config.scaleMult || 1;

        // Create sprite using the image key from tower config
        this.sprite = scene.add.sprite(x, y, this.imageKey)
            .setOrigin(0.5)
            .setScale(2 * scale)
            .setDepth(5200);

        // draw a placement base underneath the tower so it rests on the marker
        this.baseSprite = scene.add.image(x, y, 'tower_placement')
            .setOrigin(0.5)
            .setDisplaySize(scene.tileSize * 1.2, scene.tileSize * 1.2)
            .setDepth(5199); // just below tower sprite

        // Create animation if tower has frames
        if (this.frameCount > 1) {
            const animKey = `${this.imageKey}_idle`;
            if (!scene.anims.exists(animKey)) {
                scene.anims.create({
                    key: animKey,
                    frames: scene.anims.generateFrameNumbers(this.imageKey, { start: 0, end: this.frameCount - 1 }),
                    frameRate: 10,
                    repeat: -1
                });
            }
            this.sprite.play(animKey);
        }

        // Draw visible range circle
        this.rangeCircle = scene.add.circle(x, y, this.range, 0x00ffff, 0.2)
            .setDepth(5150);

        this.timer = scene.time.addEvent({
            delay: this.attackSpeed,
            loop: true,
            callback: this.attack,
            callbackScope: this
        });

        if(this.type == 'Farm')
        {
            this.incInterval = 30000;
            this.incomeStart();
        }

    }

    incomeStart() {
        this.incomeTimer = this.scene.time.addEvent({
            delay: this.incInterval,
            callback: this.income,
            callbackScope: this,
            loop: true
        });
    }

    income() {
        this.scene.gold += this.moneyGain;
        if (this.scene.debug) {
            if (this.scene.debug) console.log(`🌾 Farm income: +${this.moneyGain} gold (Total: ${this.scene.gold})`);
        }
        
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
                // Use projectile attack if tower has projectile, otherwise direct attack
                if (this.projectileKey) {
                    this.shootProjectile(enemy);
                } else {
                    this.directAttack(enemy);
                }
                break;
            }
        }
    }

    /**
     * Direct attack - damages single enemy immediately
     */
    directAttack(enemy) {
        // Defensive check: validate enemy still exists and is active
        if (!enemy || !enemy.active || !enemy.healthBar) {
            return;
        }

        enemy.hp -= this.damage;
        enemy.healthBar.setScale(Math.max(0, enemy.hp / enemy.maxHp), 1);

        // Tower flash effect on attack
        this.flashTower();
        
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
                        useFrames: false,
            yoyo: true
        });

        // Damage popup
        if (this.scene.effectsManager) {
            this.scene.effectsManager.createDamageNumber(enemy.x, enemy.y, this.damage);
        }

        this.finalizeEnemyDeath(enemy);
    }

    /**
     * Projectile attack - shoots projectile that pierces through enemies
     */
    shootProjectile(targetEnemy) {
        // Create projectile as a container with graphics inside
        const projectile = this.scene.add.container(this.sprite.x, this.sprite.y);
        // ensure the projectile is drawn above enemies so it's always visible
        projectile.setDepth(5200);
        
        // Add circle graphics to the container (increased size)
        const graphics = this.scene.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x3b82f6, 0.8); // Blue water fill
        graphics.fillCircle(0, 0, 16); // 16px radius circle (was 8)
        projectile.add(graphics);
        // Store graphics reference for cleanup
        projectile.graphicsObject = graphics;

        // Calculate direction to target
        const angle = Phaser.Math.Angle.Between(
            this.sprite.x, this.sprite.y,
            targetEnemy.x, targetEnemy.y
        );

        const speed = 400;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;

        // Track enemies hit by this projectile
        projectile.enemiesHit = [];

        // Move projectile
        this.scene.tweens.add({
            targets: projectile,
            x: { from: this.sprite.x, to: targetEnemy.x + vx * 0.5 },
            y: { from: this.sprite.y, to: targetEnemy.y + vy * 0.5 },
            duration: 500,
            ease: 'Linear',
                        useFrames: false,
            onUpdate: () => {
                // Check collision with enemies
                const enemies = this.scene.enemies.getChildren();
                for (const enemy of enemies) {
                    // Validate enemy is still active and not already hit
                    if (!enemy?.active || projectile.enemiesHit.includes(enemy)) continue;

                    const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, enemy.x, enemy.y);
                    if (dist < 40) {
                        // Hit enemy - validate healthBar exists
                        if (!enemy.healthBar) continue;
                        
                        projectile.enemiesHit.push(enemy);
                        enemy.hp -= this.damage;
                        enemy.healthBar.setScale(Math.max(0, enemy.hp / enemy.maxHp), 1);

                        // tiny water splash so you notice impacts from any direction
                        const splash = this.scene.add.circle(enemy.x, enemy.y, 12, 0x3b82f6, 0.7).setDepth(5200);
                        this.scene.tweens.add({
                            targets: splash,
                            alpha: 0,
                            scale: 1.5,
                            duration: 200,
                            ease: 'Cubic.easeOut',
                                                        useFrames: false,
                            onComplete: () => splash.destroy()
                        });

                        // Damage effect
                        if (this.scene.effectsManager) {
                            this.scene.effectsManager.createDamageNumber(enemy.x, enemy.y, this.damage);
                        }

                        this.finalizeEnemyDeath(enemy);
                    }
                }
            },
            onComplete: () => {
                // Clean up graphics object before destroying container
                if (projectile.graphicsObject) {
                    projectile.graphicsObject.destroy();
                }
                projectile.destroy();
            }
        });

        // Tower flash effect
        this.flashTower();

        // Play attack sound
        if (this.audioManager) {
            this.audioManager.playTowerAttack();
        }
    }

    /**
     * Handle enemy death (shared between direct and projectile attacks)
     */
    finalizeEnemyDeath(enemy) {
        // Validate enemy still exists and is active before processing
        if (!enemy || !enemy.active || enemy.destroyed || enemy._exited) {
            return;
        }

        if (enemy.hp <= 0) {
            // Immediately mark as exited to prevent double-processing
            enemy._exited = true;
            enemy.setActive(false);
            
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
            
            // Destroy enemy
            if (enemy.healthBar) {
                try { enemy.healthBar.destroy(); } catch(e) {}
            }
            try { enemy.destroy(); } catch(e) {}
            if (this.scene.enemies) {
                this.scene.enemies.remove(enemy);
            }
            this.scene.enemiesAlive--;
            // CRITICAL FIX: Also decrement waveEnemyCount when enemy is killed
            if (this.scene.waveEnemyCount > 0) {
                this.scene.waveEnemyCount--;
            }
            if (this.scene.debug) console.log(`🎯 Enemy killed! Gold: +${goldReward} (Total: ${this.scene.gold})`);
            if (this.scene.effectsManager) {
                this.scene.effectsManager.confetti(enemy.x, enemy.y);
            }
        }
    }

    // called every scene update
    update() {
        // find closest active enemy within range
        let enemies;
        if (this.scene.queryEnemyBuckets) {
            enemies = this.scene.queryEnemyBuckets(this.sprite.x, this.sprite.y, this.range);
        } else {
            enemies = this.scene.enemies.getChildren();
        }
        let closest = null;
        let minDist = Infinity;
        for (const enemy of enemies) {
            if (!enemy.active) continue;
            const dist = Phaser.Math.Distance.Between(
                this.sprite.x, this.sprite.y,
                enemy.x, enemy.y
            );
            if (dist <= this.range && dist < minDist) {
                minDist = dist;
                closest = enemy;
            }
        }

        // pause or resume attack timer and animation depending on visibility
        if (closest) {
            if (this.timer && this.timer.paused) {
                this.timer.paused = false;
            }
            if (this.sprite.anims && this.sprite.anims.isPaused) {
                this.sprite.anims.resume();
            }
        } else {
            if (this.timer && !this.timer.paused) {
                this.timer.paused = true;
            }
            if (this.sprite.anims && !this.sprite.anims.isPaused) {
                this.sprite.anims.pause();
            }
        }

        if (closest) {
            // compute displacement
            const dx = closest.x - this.sprite.x;
            const dy = closest.y - this.sprite.y;

            // simple horizontal facing: flip sprite based on left/right
            const flipX = dx < 0;
            this.sprite.setFlipX(flipX);

            // only allow a small tilt up/down; full vertical rotation is disabled
            // use absolute dx so the tilt magnitude doesn't invert when flipping
            let angle = Math.atan2(dy, Math.abs(dx));
            const maxTilt = Math.PI / 6; // 30° max up/down
            angle = Phaser.Math.Clamp(angle, -maxTilt, maxTilt);

            this.sprite.setRotation(angle);
        }
        // if no enemy is in range we simply leave sprite rotation as-is (tower stops turning)
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
                useFrames: false,
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
                               useFrames: false,
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
                       useFrames: false,
            onComplete: () => {
                floatingText.destroy();
                shadow.destroy();
            }
        });
    }

    upgrade() {
        // Check if tower has reached max upgrade level
        if (this.level >= this.maxLevel) {
            if (this.scene.debug) console.log('❌ Tower has reached maximum upgrade level!');
            return false;
        }
        
        this.level++;
        
        // Different upgrade effects based on tower type
        if (this.type === 'Farm') {
            // Farm towers generate more gold with each upgrade (5 per level)
            this.moneyGain += 5;  // Add 5 gold/sec per upgrade
            if (this.scene.debug) console.log(`🌾 Farm upgraded! Now generates ${this.moneyGain} gold/sec`);
        } else {
            // Combat towers get more damage and attack speed
            // All combat towers (including Izanami) increase damage on upgrade
            this.damage += 1;  // Increase damage per level
            if (this.scene.debug) {
                if (this.imageKey === 'tower_izanami') {
                    console.log(`🏹 Izanami upgraded! Damage now: ${this.damage}`);
                } else {
                    console.log(`⚔️ Tower upgraded! Damage now: ${this.damage}`);
                }
            }
            this.attackSpeed = Math.max(200, this.attackSpeed - 50);  // Slight attack speed increase
        }
        
        // Visual feedback - increase in size
        this.sprite.setScale(2 + this.level * 0.15);
        
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
        
        if (this.scene.debug) console.log(`🔧 Tower upgraded to level ${this.level}/${this.maxLevel}! Damage: ${this.damage.toFixed(1)}, Speed: ${this.attackSpeed}ms`);
        return true;
    }

    /**
     * Calculate the sell price of this tower (50% of total investment)
     */
    getSellPrice() {
        const investedGold = this.baseCost + ((this.level - 1) * this.upgradeCost);
        const sellPrice = Math.floor(investedGold * 0.5);
        return sellPrice;
    }

    /**
     * Sell/destroy the tower and return gold to player
     */
    sell() {
        const sellPrice = this.getSellPrice();
        
        // Stop and remove any active animations on the sprite
        if (this.sprite) {
            if (this.sprite.anims && this.sprite.anims.isPlaying) {
                this.sprite.anims.stop();
            }
            this.sprite.destroy();
        }
        // remove base marker under tower
        if (this.baseSprite) {
            this.baseSprite.destroy();
        }

        // Destroy visual components
        if (this.rangeCircle) this.rangeCircle.destroy();
        if (this.timer) this.timer.destroy();
        
        // Stop and destroy the farm income timer if it exists
        if (this.incomeTimer) {
            this.incomeTimer.destroy();
            this.incomeTimer = null;
        }
        
        if (this.scene.debug) console.log(`💰 Tower sold for ${sellPrice}G (Invested: ${this.baseCost + (this.level - 1) * this.upgradeCost}G)`);
        
        return sellPrice;
    }
}
