export default class Tower {
    constructor(scene, x, y) {
        this.scene = scene;
        this.range = 220;
        this.damage = 1;
        this.attackSpeed = 500;
        this.level = 1;
        this.totalDamage = 0;

        this.sprite = scene.add.sprite(x, y, 'tower')
            .setOrigin(0.5)
            .setScale(2)
            .setDepth(500);

        // Draw visible range circle
        this.rangeCircle = scene.add.circle(x, y, this.range, 0x00ffff, 0.2)
            .setDepth(100);

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
    }

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

                // Create kill effect
                this.createKillEffect(enemy.x, enemy.y);

                if (enemy.hp <= 0) {
                    // Award gold for kill
                    const goldReward = Math.floor(this.scene.baseGoldReward * (1 + this.scene.currentWave * 0.5));
                    this.scene.gold += goldReward;
                    
                    // Create floating text
                    this.createFloatingText(enemy.x, enemy.y, `+${goldReward}`, '#FFD700');
                    
                    enemy.healthBar.destroy();
                    enemy.destroy();
                    this.scene.enemies.remove(enemy);
                    this.scene.enemiesAlive--;
                    console.log(`🎯 Enemy killed! Gold: +${goldReward} (Total: ${this.scene.gold})`);
                }

                break;
            }
        }
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
    }

    createFloatingText(x, y, text, color) {
        const floatingText = this.scene.add.text(x, y, text, {
            fontSize: '24px',
            fill: color,
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5).setDepth(2000);

        this.scene.tweens.add({
            targets: floatingText,
            y: y - 60,
            alpha: 0,
            duration: 1000,
            ease: 'Quad.easeOut',
            onComplete: () => floatingText.destroy()
        });
    }

    upgrade() {
        this.level++;
        this.damage += 0.5;
        this.attackSpeed = Math.max(250, this.attackSpeed - 50);
        
        // Visual feedback
        this.sprite.setScale(2 + this.level * 0.15);
        console.log(`🔧 Tower upgraded to level ${this.level}!`);
    }
}
