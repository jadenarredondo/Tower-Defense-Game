export default class Tower {
    constructor(scene, x, y) {
        this.scene = scene;
        this.range = 200;      // tower attack range in pixels
        this.damage = 1;       // damage per attack
        this.attackSpeed = 500; // milliseconds between attacks

        // Create tower sprite
        this.sprite = scene.add.sprite(x, y, 'tower')
            .setOrigin(0.5)
            .setScale(2) 
            .setDepth(500);

        // Animation
        if (!scene.anims.exists('tower_attack')) {
            scene.anims.create({
                key: 'tower_attack',
                frames: scene.anims.generateFrameNumbers('tower', { start: 0, end: 15 }),
                frameRate: 10,
                repeat: -1
            });
        }
        this.sprite.play('tower_attack');

        // Attack loop
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
                enemy.hp -= this.damage; // damage
                enemy.healthBar.setScale(enemy.hp / enemy.maxHp, 1); // update health bar

                // Destroy enemy if dead
                if (enemy.hp <= 0) {
                    enemy.healthBar.destroy();
                    enemy.destroy();
                    this.scene.enemies.remove(enemy);
                }
                break; // attack one enemy per tick
            }
        }
    }
}
