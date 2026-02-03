class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        // Grass tiles
        this.load.image('grass1', 'assets/tiles/grass1.png');
        this.load.image('grass2', 'assets/tiles/grass2.png');
        this.load.image('grass3', 'assets/tiles/grass3.png');
        this.load.image('grass4', 'assets/tiles/grass4.png');
        this.load.image('grass5', 'assets/tiles/grass5.png');

        // Path tiles
        this.load.image('stone_horizontal', 'assets/tiles/stone_horizontal.png');
        this.load.image('stone_vertical', 'assets/tiles/stone_vertical.png');
        this.load.image('corner_tl', 'assets/tiles/corner_tl.png');
        this.load.image('corner_tr', 'assets/tiles/corner_tr.png');
        this.load.image('corner_bl', 'assets/tiles/corner_bl.png');
        this.load.image('corner_br', 'assets/tiles/corner_br.png');

        // Decorations
        this.load.image('tree1', 'assets/decorations/tree1.png');
        this.load.image('tree2', 'assets/decorations/tree2.png');
        this.load.image('rock1', 'assets/decorations/rock1.png');
        this.load.image('rock2', 'assets/decorations/rock2.png');
        this.load.image('temple1', 'assets/decorations/ruined_temple1.png');
        this.load.image('temple2', 'assets/decorations/ruined_temple2.png');
        this.load.image('temple3', 'assets/decorations/ruined_temple3.png');

        // Enemy
        this.load.image('enemy', 'assets/decorations/enemy.png');
    }

    create() {
        const tileSize = 50;

        // ---------- GRASS ----------
        const grassTiles = ['grass1','grass2','grass3','grass4','grass5'];
        for (let y = 0; y < 12; y++) {
            for (let x = 0; x < 16; x++) {
                const grass = Phaser.Utils.Array.GetRandom(grassTiles);
                this.add.image(x*tileSize + tileSize/2, y*tileSize + tileSize/2, grass)
                    .setDisplaySize(tileSize, tileSize)
                    .setDepth(y);
            }
        }

        // ---------- PATH ----------
        const pathTiles = [
            {x:0,y:4}, {x:3,y:4}, {x:3,y:1}, {x:6,y:1},
            {x:6,y:6}, {x:10,y:6}, {x:10,y:3}, {x:13,y:3},
            {x:13,y:9}, {x:15,y:9}
        ];

        const pathPositions = [];
        for (let i = 0; i < pathTiles.length - 1; i++) {
            const curr = pathTiles[i];
            const next = pathTiles[i+1];
            const dx = next.x - curr.x;
            const dy = next.y - curr.y;
            const stepX = Math.sign(dx);
            const stepY = Math.sign(dy);

            if(dx !== 0){
                const startX = (i === 0) ? curr.x : curr.x + stepX;
                for(let x = startX; stepX>0? x <= next.x : x >= next.x; x += stepX){
                    pathPositions.push({x: x, y: curr.y});
                }
            } else if(dy !== 0){
                const startY = (i === 0) ? curr.y : curr.y + stepY;
                for(let y = startY; stepY>0? y <= next.y : y >= next.y; y += stepY){
                    pathPositions.push({x: curr.x, y: y});
                }
            }
        }

        // ---------- Corner Detection ----------
        // Build a quick lookup set for path positions to test neighbors
        const pathSet = new Set(pathPositions.map(p => `${p.x},${p.y}`));

        // Draw path tiles
        for (let i = 0; i < pathPositions.length; i++) {
            const pos = pathPositions[i];
            const prev = pathPositions[i-1];
            const next = pathPositions[i+1];

            let spriteKey = null;

            if(!prev && next){
                spriteKey = (next.x === pos.x) ? 'stone_vertical' : 'stone_horizontal';
            } else if(!next && prev){
                spriteKey = (prev.x === pos.x) ? 'stone_vertical' : 'stone_horizontal';
            } else {
                // Determine neighbors directly from the path set so corners depend on both sides
                const left = pathSet.has(`${pos.x-1},${pos.y}`);
                const right = pathSet.has(`${pos.x+1},${pos.y}`);
                const up = pathSet.has(`${pos.x},${pos.y-1}`);
                const down = pathSet.has(`${pos.x},${pos.y+1}`);

                if ((left || right) && (up || down)) {
                    if (up && left) spriteKey = 'corner_tl';
                    else if (up && right) spriteKey = 'corner_tr';
                    else if (down && left) spriteKey = 'corner_bl';
                    else if (down && right) spriteKey = 'corner_br';
                } else {
                    spriteKey = (left || right) ? 'stone_horizontal' : 'stone_vertical';
                }
            }

            if(spriteKey){
                this.add.image(pos.x*tileSize + tileSize/2, pos.y*tileSize + tileSize/2, spriteKey)
                    .setDisplaySize(tileSize, tileSize)
                    .setDepth(pos.y + 1);
            }
        }

        // ---------- DECORATIONS ----------
        const treeTiles = ['tree1','tree2'];
        const rockTiles = ['rock1','rock2'];
        const templeTiles = ['temple1','temple2','temple3'];

        const usedPositions = new Set(pathPositions.map(p => `${p.x},${p.y}`));
        for (const p of pathPositions){
            for(let ox=-1; ox<=1; ox++){
                for(let oy=-1; oy<=1; oy++){
                    const bx = p.x + ox;
                    const by = p.y + oy;
                    if(bx>=0 && bx<=15 && by>=0 && by<=11) usedPositions.add(`${bx},${by}`);
                }
            }
        }

        // Trees
        for(let i=0;i<30;i++){
            let pos;
            do { pos = {x: Phaser.Math.Between(0,15), y: Phaser.Math.Between(0,11)}; }
            while(usedPositions.has(`${pos.x},${pos.y}`));
            usedPositions.add(`${pos.x},${pos.y}`);
            this.add.image(pos.x*tileSize + tileSize/2, pos.y*tileSize + tileSize/2, Phaser.Utils.Array.GetRandom(treeTiles))
                .setScale(1.2)
                .setDepth(pos.y+20);
        }

        // Rocks
        for(let i=0;i<18;i++){
            let pos;
            do { pos = {x: Phaser.Math.Between(0,15), y: Phaser.Math.Between(0,11)}; }
            while(usedPositions.has(`${pos.x},${pos.y}`));
            usedPositions.add(`${pos.x},${pos.y}`);
            this.add.image(pos.x*tileSize + tileSize/2, pos.y*tileSize + tileSize/2, Phaser.Utils.Array.GetRandom(rockTiles))
                .setScale(0.8)
                .setDepth(pos.y+20);
        }

        // Temples
        for(let i=0;i<5;i++){
            let pos;
            do { pos = {x: Phaser.Math.Between(0,15), y: Phaser.Math.Between(0,11)}; }
            while(usedPositions.has(`${pos.x},${pos.y}`));
            usedPositions.add(`${pos.x},${pos.y}`);
            this.add.image(pos.x*tileSize + tileSize/2, pos.y*tileSize + tileSize/2, Phaser.Utils.Array.GetRandom(templeTiles))
                .setScale(1)
                .setDepth(pos.y+20);
        }

        // ---------- ENEMY ----------
        const enemyStart = pathPositions[0];
        const enemy = this.add.sprite(enemyStart.x*tileSize + tileSize/2, enemyStart.y*tileSize + tileSize/2, 'enemy')
            .setDisplaySize(tileSize*0.6, tileSize*0.6)
            .setDepth(50);

        let pathIndex = 0;
        this.time.addEvent({
            delay: 300,
            loop: true,
            callback: ()=>{
                pathIndex = (pathIndex + 1) % pathPositions.length;
                const nextPos = pathPositions[pathIndex];
                this.tweens.add({
                    targets: enemy,
                    x: nextPos.x*tileSize + tileSize/2,
                    y: nextPos.y*tileSize + tileSize/2,
                    duration: 250,
                    ease: 'Linear'
                });
            }
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#2b1a0f',
    scene: [MainScene]
};

new Phaser.Game(config);