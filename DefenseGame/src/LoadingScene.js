export default class LoadingScene extends Phaser.Scene {
    constructor() {
        super('LoadingScene');
    }

    init(data) {
        this.target = data?.target || null;
        this.payload = data?.payload || data || {};
    }

    preload() {
        // Preload tower and enemy assets for loading screen display
        this.load.image('tower_izanami_small', 'assets/Tower/Izanami.png');
        this.load.image('tower_susanoo_small', 'assets/Tower/Susanoo.png');
        this.load.image('tower_farm_small', 'assets/Tower/shrine_farm.png');
        this.load.image('enemy_small', 'assets/Enemies/enemy.png');
    }

    create() {
        const { width, height } = this.scale;

        // ============ BACKGROUND GRADIENT ============
        const gradientGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        gradientGraphics.fillGradientStyle(0x0a0e27, 0x1a3a52, 0x0a0e27, 0x2d5f6f, 1);
        gradientGraphics.fillRect(0, 0, width, height);
        gradientGraphics.generateTexture('loadingGradient', width, height);
        this.add.image(0, 0, 'loadingGradient').setOrigin(0, 0).setDepth(-1);
        gradientGraphics.destroy();

        // ============ SIDE VISUALS (TOWERS & ENEMIES) ============
        // Removed side visuals for cleaner loading screen

        // ============ LOADING CONTAINER ============
        // Semi-transparent container for loading info
        const containerWidth = 700;
        const containerHeight = 320;
        const containerBox = this.add.rectangle(width / 2, height / 2, containerWidth, containerHeight, 0x0f1534, 0.85)
            .setStrokeStyle(3, 0x64d5ff, 0.7)
            .setDepth(100);

        // ============ TITLE ============
        const title = this.add.text(width / 2, height / 2 - 120, 'Preparing Battle...', {
            fontSize: '36px',
            color: '#64d5ff',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5).setDepth(101);

        // ============ PROGRESS BAR ============
        const barX = width / 2 - 240;
        const barY = height / 2 - 20;
        const barWidth = 480;
        const barHeight = 28;

        // Bar background
        const barBg = this.add.rectangle(width / 2, barY, barWidth, barHeight, 0x1a2a3a)
            .setStrokeStyle(2, 0x64d5ff)
            .setDepth(101);

        // Bar fill
        this.barFill = this.add.rectangle(barX + 2, barY, 0, barHeight - 4, 0x00d9ff)
            .setOrigin(0, 0.5)
            .setDepth(102);

        // Percentage text
        this.percentText = this.add.text(width / 2, barY + 50, '0%', {
            fontSize: '20px',
            color: '#00d9ff',
            fontFamily: 'Arial',
            fontStyle: 'bold'
        }).setOrigin(0.5).setDepth(101);

        // ============ TIPS SECTION ============
        const tips = [
            '💡 Build towers on strategic points to block enemy paths!',
            '💡 Use Izanami for single-target damage and crowd control.',
            '💡 Susanoo excels at dealing with multiple enemies at once.',
            '💡 The Farm tower generates gold - place them wisely!',
            '💡 Save your skills for critical moments in battle.',
            '💡 Each level gets progressively harder - prepare your defenses!',
            '💡 Enemies follow predetermined paths - use this to your advantage.',
            '💡 Towers deal more damage the longer they attack the same target.'
        ];
        
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        this.add.text(width / 2, height / 2 + 70, randomTip, {
            fontSize: '16px',
            color: '#9ca3af',
            fontFamily: 'Arial',
            wordWrap: { width: containerWidth - 40 },
            align: 'center'
        }).setOrigin(0.5).setDepth(101);

        // ============ LOADING SPINNER ============
        const spinner = this.add.circle(width / 2 + 250, barY, 8, 0x64d5ff).setDepth(102);
        spinner.setAlpha(0.8);
        this.tweens.add({
            targets: spinner,
            angle: 360,
            duration: 900,
            repeat: -1,
            useFrames: false,
            ease: 'Linear'
        });

        // If no target specified, just close after a short delay
        if (!this.target) {
            this.percentText.setText('Ready');
            this.time.delayedCall(400, () => this.scene.stop());
            return;
        }

        // Launch the target scene so its preload runs while we stay visible
        this.scene.launch(this.target, this.payload);

        // Attempt to hook into target scene's loader events
        const targetScene = this.scene.get(this.target);
        if (!targetScene || !targetScene.load) {
            this.time.delayedCall(500, () => this.finish());
            return;
        }

        targetScene.load.on('progress', (value) => {
            const pct = Math.round(value * 100);
            this.percentText.setText(`${pct}%`);
            this.barFill.width = Math.max(2, Math.round(barWidth * value) - 4);
        });

        targetScene.load.on('fileprogress', (file) => {
            // Optional: show file.key
        });

        targetScene.load.on('complete', () => {
            this.percentText.setText('100%');
            this.time.delayedCall(300, () => this.finish());
        });

        // If target's loader has already completed for some reason, finish
        if (targetScene.load.totalComplete && targetScene.load.totalComplete >= targetScene.load.totalToLoad) {
            this.time.delayedCall(100, () => this.finish());
        }

        // SAFETY: sometimes the loader doesn't emit events (e.g. all assets were
        // cached and Phaser skips loading), in which case the overlay would stay
        // forever and block the view.  Add a hard timeout that closes the
        // loading scene after a couple seconds just to be sure.
        this.time.delayedCall(2000, () => {
            if (this.scene.isActive()) {
                // will also stop if already finished, but harmless
                this.finish();
            }
        });
    }

    finish() {
        // Stop the loading overlay so target scene is visible
        try {
            this.scene.stop();
        } catch (e) {
            // ignore
        }
    }
}
