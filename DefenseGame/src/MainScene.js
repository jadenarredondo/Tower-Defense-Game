export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        for (let i = 1; i <= 5; i++) {
            this.load.image(`grass${i}`, `assets/tiles/grass${i}.png`);
        }

        this.load.image('stone_horizontal', 'assets/tiles/stone_horizontal.png');
        this.load.image('stone_vertical', 'assets/tiles/stone_vertical.png');
        this.load.image('corner_tl', 'assets/tiles/corner_tl.png');
        this.load.image('corner_tr', 'assets/tiles/corner_tr.png');
        this.load.image('corner_bl', 'assets/tiles/corner_bl.png');
        this.load.image('corner_br', 'assets/tiles/corner_br.png');

        this.load.image('tree1', 'assets/decorations/tree1.png');
        this.load.image('tree2', 'assets/decorations/tree2.png');
        this.load.image('rock1', 'assets/decorations/rock1.png');
        this.load.image('rock2', 'assets/decorations/rock2.png');
        this.load.image('temple1', 'assets/decorations/ruined_temple1.png');
        this.load.image('temple2', 'assets/decorations/ruined_temple2.png');
        this.load.image('temple3', 'assets/decorations/ruined_temple3.png');

        this.load.image('enemy', 'assets/decorations/enemy.png');
    }

    create() {

        const tileSize = 96;
        const MAP_WIDTH = 40;
        const MAP_HEIGHT = 22;

        /* ---------- GRASS ---------- */
        const grassKeys = ['grass1','grass2','grass3','grass4','grass5'];
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.add.image(
                    x * tileSize + tileSize / 2,
                    y * tileSize + tileSize / 2,
                    Phaser.Utils.Array.GetRandom(grassKeys)
                )
                .setDisplaySize(tileSize, tileSize)
                .setDepth(y);
            }
        }

        /* ---------- PATH (LEFT → RIGHT EXIT) ---------- */
        const pathNodes = [
            { x: 0,  y: 11 },
            { x: 6,  y: 11 },
            { x: 6,  y: 4  },
            { x: 14, y: 4  },
            { x: 14, y: 16 },
            { x: 24, y: 16 },
            { x: 24, y: 8  },
            { x: 34, y: 8  },
            { x: 39, y: 8  } // exit on right edge
        ];

        const path = [];
        for (let i = 0; i < pathNodes.length - 1; i++) {
            const a = pathNodes[i];
            const b = pathNodes[i + 1];
            const dx = Math.sign(b.x - a.x);
            const dy = Math.sign(b.y - a.y);

            if (dx !== 0) {
                for (let x = a.x; x !== b.x + dx; x += dx) {
                    path.push({ x, y: a.y });
                }
            } else {
                for (let y = a.y; y !== b.y + dy; y += dy) {
                    path.push({ x: a.x, y });
                }
            }
        }

        const pathSet = new Set(path.map(p => `${p.x},${p.y}`));

        /* ---------- DRAW PATH ---------- */
        for (const p of path) {
            const L = pathSet.has(`${p.x-1},${p.y}`);
            const R = pathSet.has(`${p.x+1},${p.y}`);
            const U = pathSet.has(`${p.x},${p.y-1}`);
            const D = pathSet.has(`${p.x},${p.y+1}`);

            let key;
            if ((L || R) && (U || D)) {
                if (U && L) key = 'corner_tl';
                else if (U && R) key = 'corner_tr';
                else if (D && L) key = 'corner_bl';
                else key = 'corner_br';
            } else {
                key = (L || R) ? 'stone_horizontal' : 'stone_vertical';
            }

            this.add.image(
                p.x * tileSize + tileSize / 2,
                p.y * tileSize + tileSize / 2,
                key
            )
            .setDisplaySize(tileSize, tileSize)
            .setDepth(p.y + 1);
        }

        /* ---------- DECORATIONS ---------- */
        const used = new Set(path.map(p => `${p.x},${p.y}`));
        const trees = ['tree1','tree2'];
        const rocks = ['rock1','rock2'];
        const temples = ['temple1','temple2','temple3'];

        const place = (count, keys, scale) => {
            let placed = 0;
            while (placed < count) {
                const x = Phaser.Math.Between(0, MAP_WIDTH - 1);
                const y = Phaser.Math.Between(0, MAP_HEIGHT - 1);
                const id = `${x},${y}`;
                if (!used.has(id)) {
                    this.add.image(
                        x * tileSize + tileSize / 2,
                        y * tileSize + tileSize / 2,
                        Phaser.Utils.Array.GetRandom(keys)
                    )
                    .setScale(scale)
                    .setDepth(y + 10);
                    used.add(id);
                    placed++;
                }
            }
        };

        place(65, trees, 1.3);
        place(40, rocks, 0.8);
        place(10, temples, 1.15);

        /* ---------- ENEMY ---------- */
        const enemy = this.add.sprite(
            path[0].x * tileSize + tileSize / 2,
            path[0].y * tileSize + tileSize / 2,
            'enemy'
        )
        .setDisplaySize(tileSize * 0.6, tileSize * 0.6)
        .setDepth(1000);

        let idx = 0;
        this.time.addEvent({
            delay: 220,
            loop: true,
            callback: () => {
                idx = (idx + 1) % path.length;
                const p = path[idx];
                this.tweens.add({
                    targets: enemy,
                    x: p.x * tileSize + tileSize / 2,
                    y: p.y * tileSize + tileSize / 2,
                    duration: 200,
                    ease: 'Linear'
                });
            }
        });

        /* ---------- CAMERA ---------- */
        this.cameras.main.setBounds(
            0, 0,
            MAP_WIDTH * tileSize,
            MAP_HEIGHT * tileSize
        );
        this.cameras.main.centerOn(
            MAP_WIDTH * tileSize / 2,
            MAP_HEIGHT * tileSize / 2
        );
        this.cameras.main.setZoom(0.35);

        this.input.keyboard.on('keydown-ESC', () => {
            this.scene.launch('PauseScene');
            this.scene.pause();
        });

    }
}
