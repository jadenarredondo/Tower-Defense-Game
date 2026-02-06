export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        // Optional: load any assets for menu background or buttons
    }

    create() {
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

        // ---------- TITLE ----------
        this.title = this.add.text(width / 2, height / 4 - 40, 'MYTHOLOGICAL DEFENSE', {
            fontSize: '68px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 8,
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // Subtitle
        this.add.text(width / 2, height / 4 + 30, 'Tower Defense Game', {
            fontSize: '24px',
            color: '#a8daff',
            fontStyle: 'italic',
            fontFamily: 'Arial, sans-serif'
        }).setOrigin(0.5);

        // ---------- BUTTONS ----------
        const buttonData = [
            { text: 'START GAME', action: () => this.startGame() },
            { text: 'SETTINGS', action: () => this.settingsGame() },
            { text: 'EXIT GAME', action: () => this.exitGame() }
        ];

        this.buttons = [];
        buttonData.forEach((b, idx) => {
            const btn = this.add.text(width / 2, height / 2 + 40 + idx * 90, b.text, {
                fontSize: '44px',
                color: '#64d5ff',
                fontStyle: 'bold',
                align: 'center',
                fontFamily: 'Arial, sans-serif'
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });
            btn.on('pointerover', () => {
                btn.setColor('#ffffff');
                btn.setScale(1.1);
            });
            btn.on('pointerout', () => {
                btn.setColor('#64d5ff');
                btn.setScale(1);
            });
            btn.on('pointerdown', b.action);

            this.buttons.push(btn);
        });

        // ---------- KEYBOARD START ----------
        this.input.keyboard.once('keydown-ENTER', () => this.startGame());
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

    startGame() {
        this.scene.start('MainScene');
    }

    exitGame() {
        const { width, height } = this.scale;

        // Disable all buttons
        this.buttons.forEach(btn => btn.disableInteractive());

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
            this.buttons.forEach(btn => btn.setInteractive());
        });
    }

    settingsGame() {
        this.scene.start('SettingsScene');
    }
}
