export default class Tower {
    constructor(scene, x, y) {
        this.scene = scene;
        this.range = 200;
        this.damage = 1;
        this.attackSpeed = 500;

        this.sprite = scene.add.sprite(x, y, 'tower')
            .setOrigin(0.5)
            .setScale(2)
            .setDepth(500);

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

                if (enemy.hp <= 0) {

                    enemy.healthBar.destroy();
                    enemy.destroy();
                    this.scene.enemies.remove(enemy);

                    this.scene.enemiesAlive--;

                    if (this.scene.enemiesAlive <= 0 && this.scene.waveInProgress) {
                        this.scene.waveInProgress = false;

                        this.scene.time.delayedCall(2000, () => {
                            this.scene.startNextWave();
                        });
                    }
                }

                break;
            }
        }
    }
}
