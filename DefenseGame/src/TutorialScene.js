export default class TutorialScene extends Phaser.Scene {
    constructor() {
        super('TutorialScene');
    }

    create() {
        const { width, height } = this.scale;

        // Background
        const gradient = this.make.graphics({ x: 0, y: 0, add: false });
        gradient.fillGradientStyle(0x1a1a3e, 0x1a1a3e, 0x2d5f6f, 0x2d5f6f, 1);
        gradient.fillRect(0, 0, width, height);
        gradient.generateTexture('gradientBG3', width, height);
        this.add.image(0, 0, 'gradientBG3').setOrigin(0, 0).setDepth(-1);
        gradient.destroy();

        // Title
        this.add.text(width / 2, 50, 'HOW TO PLAY', {
            fontSize: '56px',
            color: '#64d5ff',
            fontStyle: 'bold',
            stroke: '#0a3f5c',
            strokeThickness: 5,
            fontFamily: 'Arial'
        }).setOrigin(0.5);

        // Tutorial content - now with more advanced tips
        const tutorials = [
            { title: '💰 FARMING', desc: 'Earn 2-3 gold per second passively' },
            { title: '🎯 PLACEMENT', desc: 'Click anywhere off the path to place towers' },
            { title: '⬆️ UPGRADE', desc: 'Click existing towers to upgrade (max 3 per type)' },
            { title: '🌊 WAVES', desc: 'Defeat all enemies in each wave to progress' },
            { title: '❤️ HEALTH', desc: 'Protect your base! 0 health = game over' },
            { title: '⚡ SPEED', desc: 'Use speed buttons (1x, 2x, 4x) to control game pace' },
            { title: '🎯 TOWER TYPES', desc: 'Basic: balanced | Power: high damage | Sniper: long range' },
            { title: '🔄 RANGE CIRCLES', desc: 'Overlapping ranges are more effective against groups' },
            { title: '📊 STRATEGY', desc: 'Upgrade range first, then damage as you earn gold' },
            { title: '🏆 TIPS', desc: 'Build towers ahead of the path for better coverage' }
        ];

        const cardsPerRow = 2;
        const cardWidth = 340;
        const cardHeight = 140;
        const cardGap = 30;
        const startX = (width - (cardsPerRow * cardWidth + (cardsPerRow - 1) * cardGap)) / 2 + cardWidth / 2;
        const contentStartY = 150;
        const contentHeight = height - 300;  // Space for scrolling
        const totalContentHeight = Math.ceil(tutorials.length / cardsPerRow) * (cardHeight + cardGap);
        let maxScroll = Math.max(0, totalContentHeight - contentHeight); // will be recalculated after controls

        // Track scroll offset
        let scrollOffset = 0;

        // container will hold all items so we can mask and move them easily
        const scrollContainer = this.add.container(0, 0);

        // Create individual cards and add to container
        const cardElements = [];
        tutorials.forEach((tutorial, idx) => {
            const row = Math.floor(idx / cardsPerRow);
            const col = idx % cardsPerRow;
            const x = startX + col * (cardWidth + cardGap);
            const baseY = contentStartY + row * (cardHeight + cardGap);

            // Card background
            const card = this.add.rectangle(x, baseY, cardWidth, cardHeight, 0x0f1534, 0.7)
                .setStrokeStyle(2, 0x64d5ff, 0.6);

            // Title
            const title = this.add.text(x - cardWidth / 2 + 15, baseY - cardHeight / 2 + 15, tutorial.title, {
                fontSize: '14px',
                color: '#64d5ff',
                fontStyle: 'bold',
                fontFamily: 'Arial'
            }).setOrigin(0);

            // Description
            const desc = this.add.text(x - cardWidth / 2 + 15, baseY - cardHeight / 2 + 50, tutorial.desc, {
                fontSize: '12px',
                color: '#a8daff',
                fontFamily: 'Arial',
                wordWrapWidth: cardWidth - 30
            }).setOrigin(0);

            cardElements.push({ card, title, desc, baseY });
            scrollContainer.add([card, title, desc]);
        });

        // Scroll handler function
        const updateScroll = (newOffset) => {
            scrollOffset = Phaser.Math.Clamp(newOffset, 0, maxScroll);
            scrollContainer.y = -scrollOffset;
        };

        // Mouse wheel scroll
        this.input.on('wheel', (pointer, over, deltaX, deltaY) => {
            updateScroll(scrollOffset + deltaY * 0.5);
        });

        // Keyboard scroll
        this.input.keyboard.on('keydown-UP', () => {
            updateScroll(scrollOffset - 40);
        });
        this.input.keyboard.on('keydown-DOWN', () => {
            updateScroll(scrollOffset + 40);
        });

        // Bottom info/controls - make them scrollable with content
        const controlsStartY = contentStartY + totalContentHeight + 30;
        
        const controlsTitle = this.add.text(width / 2, controlsStartY, 'GAME CONTROLS', {
            fontSize: '14px',
            color: '#64d5ff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        cardElements.push({ card: null, title: controlsTitle, desc: null, baseY: controlsStartY });
        scrollContainer.add(controlsTitle);

        // after we know how tall the full content is (including controls and start button) update scroll limit
        const extraBottom = 150; // allow a bit of padding past last element
        const fullHeight = controlsStartY + extraBottom;
        maxScroll = Math.max(0, fullHeight - contentHeight);

        // apply a mask to clip the container area
        const maskShape = this.make.graphics().fillStyle(0xffffff).fillRect(0, contentStartY - cardHeight/2, width, contentHeight);
        const mask = new Phaser.Display.Masks.GeometryMask(this, maskShape);
        scrollContainer.setMask(mask);


        const controls = [
            'ESC = Pause   |   Mouse Wheel = Zoom   |   Drag = Pan Camera',
            '1/2/3 = Select Tower Type   |   Speed 1x/2x/4x = Game Speed'
        ];

        controls.forEach((ctrl, idx) => {
            const controlY = controlsStartY + 30 + idx * 22;
            const controlText = this.add.text(width / 2, controlY, ctrl, {
                fontSize: '10px',
                color: '#a8daff',
                fontFamily: 'Arial'
            }).setOrigin(0.5);
            cardElements.push({ card: null, title: controlText, desc: null, baseY: controlY });
            scrollContainer.add(controlText);
        });

        // Start button - scrollable
        const startY = controlsStartY + 100;
        const startBtn = this.add.rectangle(width / 2, startY, 180, 45, 0x1a5f3e);
        startBtn.setStrokeStyle(2, 0x64d5ff);
        startBtn.setInteractive({ useHandCursor: true });
        cardElements.push({ card: startBtn, title: null, desc: null, baseY: startY });
        scrollContainer.add(startBtn);

        const startText = this.add.text(width / 2, startY, 'START GAME', {
            fontSize: '18px',
            color: '#ffffff',
            fontStyle: 'bold',
            fontFamily: 'Arial'
        }).setOrigin(0.5);
        cardElements.push({ card: null, title: startText, desc: null, baseY: startY });
        scrollContainer.add(startText);

        startBtn.on('pointerover', () => {
            startBtn.setFillStyle(0x2d7f5e);
            startText.setScale(1.1);
        });
        startBtn.on('pointerout', () => {
            startBtn.setFillStyle(0x1a5f3e);
            startText.setScale(1);
        });
        startBtn.on('pointerdown', () => {
            // Mark tutorial as completed
            localStorage.setItem('mythological_defense_tutorial_seen', 'true');
            this.scene.start('LevelSelectScene');
        });
        startText.setInteractive({ useHandCursor: true });
        startText.on('pointerdown', () => {
            localStorage.setItem('mythological_defense_tutorial_seen', 'true');
            this.scene.start('LevelSelectScene');
        });
        startText.on('pointerover', () => startText.setScale(1.1));
        startText.on('pointerout', () => startText.setScale(1));
    }
}
