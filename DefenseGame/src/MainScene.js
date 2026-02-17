import Tower from './Tower.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
    }

    preload() {
        for (let i = 1; i <= 5; i++) this.load.image(`grass${i}`, `assets/tiles/grass${i}.png`);
        this.load.image('stone_horizontal','assets/tiles/stone_horizontal.png');
        this.load.image('stone_vertical','assets/tiles/stone_vertical.png');
        this.load.image('corner_tl','assets/tiles/corner_tl.png');
        this.load.image('corner_tr','assets/tiles/corner_tr.png');
        this.load.image('corner_bl','assets/tiles/corner_bl.png');
        this.load.image('corner_br','assets/tiles/corner_br.png');

        this.load.image('tree1','assets/decorations/tree1.png');
        this.load.image('tree2','assets/decorations/tree2.png');
        this.load.image('rock1','assets/decorations/rock1.png');
        this.load.image('rock2','assets/decorations/rock2.png');
        this.load.image('temple1','assets/decorations/ruined_temple1.png');
        this.load.image('temple2','assets/decorations/ruined_temple2.png');
        this.load.image('temple3','assets/decorations/ruined_temple3.png');

        this.load.image('enemy','assets/decorations/enemy.png');
        this.load.on('complete', () => {
            this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);  
        });

        this.load.spritesheet('tower','assets/tower/tower.png',{ frameWidth: 64, frameHeight: 64 });
        this.load.on('complete', () => {
            this.textures.get('tower').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });
    }

    create() {
        // ---------- CONFIG ----------
        this.tileSize = 80;
        const MAP_WIDTH = 40;
        const MAP_HEIGHT = 22;

        // ---------- CAMERA ----------
        this.cameras.main.setBounds(0,0,MAP_WIDTH*this.tileSize,MAP_HEIGHT*this.tileSize);
        this.cameras.main.centerOn(MAP_WIDTH*this.tileSize/2, MAP_HEIGHT*this.tileSize/2);
        this.cameras.main.setZoom(0.7);

        // Camera drag
        this.input.on('pointermove', pointer => {
            if(pointer.isDown){
                this.cameras.main.scrollX -= (pointer.x - pointer.prevPosition.x);
                this.cameras.main.scrollY -= (pointer.y - pointer.prevPosition.y);
            }
        });

        // Camera zoom
        this.input.on('wheel', pointer => {
            let zoom = this.cameras.main.zoom - pointer.deltaY * 0.001;
            zoom = Phaser.Math.Clamp(zoom, 0.4, 2);
            this.cameras.main.setZoom(zoom);
        });

        // ---------- PLAYER ----------
        this.playerHealth = 20;
        this.maxTowers = 6;

        // UI
        this.healthText = this.add.text(16,16,'Health: '+this.playerHealth,{
            fontSize:'40px', fill:'#ff0000', fontStyle:'bold'
        }).setScrollFactor(0).setDepth(2000);

        this.waveText = this.add.text(16,60,'Wave: 0',{
            fontSize:'40px', fill:'#ffffff', fontStyle:'bold'
        }).setScrollFactor(0).setDepth(2000);

        // ---------- WAVE SYSTEM ----------
        this.currentWave = 0;
        this.maxWaves = 5;
        this.waveInProgress = false;
        this.enemiesAlive = 0;

        // ---------- MAP GRASS ----------
        const grassKeys = ['grass1','grass2','grass3','grass4','grass5'];
        for(let y=0;y<MAP_HEIGHT;y++){
            for(let x=0;x<MAP_WIDTH;x++){
                this.add.image(x*this.tileSize+this.tileSize/2, y*this.tileSize+this.tileSize/2,
                    Phaser.Utils.Array.GetRandom(grassKeys))
                    .setDisplaySize(this.tileSize,this.tileSize).setDepth(y);
            }
        }

        // ---------- PATH ----------
        this.pathNodes=[
            {x:0,y:11},{x:6,y:11},{x:6,y:4},{x:14,y:4},
            {x:14,y:16},{x:24,y:16},{x:24,y:8},{x:34,y:8},{x:39,y:8}
        ];

        this.path = [];
        for(let i=0;i<this.pathNodes.length-1;i++){
            const a=this.pathNodes[i], b=this.pathNodes[i+1];
            const dx=Math.sign(b.x-a.x), dy=Math.sign(b.y-a.y);
            if(dx!==0){
                for(let x=a.x;x!==b.x+dx;x+=dx) this.path.push({x, y:a.y});
            } else {
                for(let y=a.y;y!==b.y+dy;y+=dy) this.path.push({x:a.x, y});
            }
        }

        // Path tiles
        const pathSet = new Set(this.path.map(p=>`${p.x},${p.y}`));
        for(const p of this.path){
            const L=pathSet.has(`${p.x-1},${p.y}`), R=pathSet.has(`${p.x+1},${p.y}`);
            const U=pathSet.has(`${p.x},${p.y-1}`), D=pathSet.has(`${p.x},${p.y+1}`);
            let key;
            if((L||R)&&(U||D)){
                if(U&&L) key='corner_tl';
                else if(U&&R) key='corner_tr';
                else if(D&&L) key='corner_bl';
                else if(D&&R) key='corner_br';
            } else key=(L||R)?'stone_horizontal':'stone_vertical';
            this.add.image(p.x*this.tileSize+this.tileSize/2, p.y*this.tileSize+this.tileSize/2, key)
                .setDisplaySize(this.tileSize,this.tileSize).setDepth(p.y+1);
        }

        // ---------- DECORATIONS ----------
        const used = new Set(this.path.map(p=>`${p.x},${p.y}`));
        const place = (count, keys, scale) => {
            let placed=0;
            while(placed<count){
                const x=Phaser.Math.Between(0,MAP_WIDTH-1);
                const y=Phaser.Math.Between(0,MAP_HEIGHT-1);
                const id=`${x},${y}`;
                if(!used.has(id)){
                    this.add.image(x*this.tileSize+this.tileSize/2, y*this.tileSize+this.tileSize/2,
                        Phaser.Utils.Array.GetRandom(keys)).setScale(scale).setDepth(y+10);
                    used.add(id); placed++;
                }
            }
        };
        place(65,['tree1','tree2'],1.3);
        place(40,['rock1','rock2'],0.8);
        place(10,['temple1','temple2','temple3'],1.15);

        // ---------- ENEMIES ----------
        this.enemies = this.add.group();

        // ---------- TOWERS ----------
        this.towers = [];
        this.input.on('pointerdown', pointer=>{
            if(this.towers.length<this.maxTowers){
                const tower = new Tower(this, pointer.worldX, pointer.worldY);
                this.towers.push(tower);
            }
        });

        // ---------- PAUSE ----------
        this.input.keyboard.on('keydown-ESC',()=>{ this.scene.launch('PauseScene'); this.scene.pause(); });

        // ---------- START FIRST WAVE ----------
        this.startNextWave();
    }

    // ---------- WAVE SYSTEM ----------
    startNextWave() {
        if(this.currentWave >= this.maxWaves) return;

        this.currentWave++;
        this.waveText.setText('Wave: ' + this.currentWave);
        this.waveInProgress = true;

        // Increase tower slots per wave
        this.maxTowers = 6 + this.currentWave - 1;

        const waveCounts = [5,8,12,16,25];
        const spawnCount = waveCounts[this.currentWave-1];
        let spawned = 0;

        // Spawn enemies sequentially
        this.waveTimer = this.time.addEvent({
            delay: 600,
            repeat: spawnCount - 1,
            callback: ()=>{
                this.spawnEnemy();
                spawned++;
                // Start next wave after all enemies spawned and cleared
                if(spawned === spawnCount){
                    this.time.addEvent({
                        delay: 2000,
                        callback: ()=>{ 
                            if(this.enemiesAlive <= 0) this.startNextWave(); 
                        }
                    });
                }
            }
        });
    }

    spawnEnemy() {
        const offset = this.tileSize * 0.3;
        const enemy = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            'enemy'
        ).setDisplaySize(this.tileSize*0.5,this.tileSize*0.5).setDepth(1000);

        enemy.hp = 5 + this.currentWave;  // lowered health
        enemy.maxHp = enemy.hp;
        enemy.damage = 1 + this.currentWave;
        enemy.pathIndex = 0;

        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y-40, 50,8,0x00ff00).setOrigin(0.5).setDepth(1500);

        this.enemies.add(enemy);
        this.enemiesAlive++;

        this.moveEnemy(enemy);
    }

    moveEnemy(enemy){
        if(!enemy.active) return;
        if(enemy.pathIndex>=this.path.length-1) return;

        const next = this.path[enemy.pathIndex+1];
        const duration = Math.max(150, 400 - this.currentWave*50);

        this.tweens.add({
            targets: enemy,
            x: next.x*this.tileSize + this.tileSize/2,
            y: next.y*this.tileSize + this.tileSize/2,
            duration: duration,
            ease:'Linear',
            onUpdate: ()=>{ enemy.healthBar.setPosition(enemy.x, enemy.y-40); },
            onComplete: ()=>{
                enemy.pathIndex++;
                if(enemy.pathIndex>=this.path.length-1){
                    this.playerHealth -= enemy.damage;
                    enemy.healthBar.destroy();
                    enemy.destroy();
                    this.enemiesAlive--;
                    this.healthText.setText('Health: '+Math.max(this.playerHealth,0));
                    if(this.playerHealth<=0) this.gameOver();
                } else this.moveEnemy(enemy);
            }
        });
    }

    gameOver(){
        this.add.text(this.cameras.main.scrollX + 400, this.cameras.main.scrollY + 300, 'GAME OVER',{
            fontSize:'80px', fill:'#ff0000', fontStyle:'bold'
        }).setDepth(3000);
        this.scene.pause();
    }
}
