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
        this.maxPlayerHealth = 20;
        this.maxTowers = 6;
        this.gold = 0;
        this.baseGoldReward = 10;

        // Store DOM UI elements for updates
        this.healthBarElement = document.getElementById('health-bar');
        this.healthTextElement = document.getElementById('health-text');
        this.waveNumberElement = document.getElementById('wave-number');
        this.waveStatusElement = document.getElementById('wave-status');
        this.towersCountElement = document.getElementById('towers-count');
        this.goldElement = document.getElementById('gold-count');
        this.pauseButton = document.getElementById('pause-btn');

        // Setup pause button click handler
        this.pauseButton.addEventListener('click', () => {
            this.scene.launch('PauseScene');
            this.scene.pause();
        });

        // Setup speed button handlers
        this.setupSpeedButtons();

        // ---------- WAVE SYSTEM ----------
        this.currentWave = 0;
        this.maxWaves = 5;
        this.waveInProgress = false;
        this.enemiesAlive = 0;
        this.waveTimer = null;
        this.waveSpawningComplete = false;
        this._starting = false;
        this._winTriggered = false;
        this._debugLogged = false;

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

        // ---------- TOWER PLACEMENT ZONES ----------
        this.towerZones = [
            {x: 1, y: 10},
            {x: 1, y: 12},
            {x: 3, y: 9},
            {x: 3, y: 13},
            {x: 6, y: 11},
            {x: 8, y: 5},
            {x: 10, y: 7},
            {x: 10, y: 13},
            {x: 13, y: 4},
            {x: 13, y: 13},
            {x: 18, y: 5},
            {x: 18, y: 13},
            {x: 23, y: 14},
            {x: 25, y: 7},
            {x: 29, y: 6},
            {x: 35, y: 7}
        ];

        // Draw tower placement zones
        for (const zone of this.towerZones) {
            this.add.circle(zone.x * this.tileSize + this.tileSize/2, zone.y * this.tileSize + this.tileSize/2, 25, 0x00ff00, 0.3)
                .setDepth(10);
        }

        // ---------- TOWERS ----------
        this.towers = [];
        this.input.on('pointerdown', pointer => {
            if(this.towers.length < this.maxTowers) {
                const towerPos = this.findNearestZone(pointer.worldX, pointer.worldY);
                if (towerPos) {
                    const tower = new Tower(this, towerPos.x, towerPos.y);
                    this.towers.push(tower);
                }
            }
        });

        // ---------- PAUSE ----------
        this.input.keyboard.on('keydown-ESC',()=>{ this.scene.launch('PauseScene'); this.scene.pause(); });

        // ---------- UI VISIBILITY ----------
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'flex';

        this.events.on('shutdown', () => {
            if (uiBar) uiBar.style.display = 'none';
        });
        this.events.on('sleep', () => {
            if (uiBar) uiBar.style.display = 'none';
        });

        // ---------- START FIRST WAVE ----------
        this.startNextWave();
    }

    update() {
        // Update UI
        this.updateUI();
        
        // Check win condition after all waves are spawned
        if(this.currentWave >= this.maxWaves && this.waveSpawningComplete && this.enemiesAlive <= 0 && this.playerHealth > 0) {
            if(!this._winTriggered) {
                this._winTriggered = true;
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('VICTORY CONDITION MET!');
                console.log(`Wave: ${this.currentWave}/${this.maxWaves}`);
                console.log(`Enemies: ${this.enemiesAlive}`);
                console.log(`Health: ${this.playerHealth}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
                this.time.delayedCall(500, ()=> this.winGame());
            }
        } else if(this.currentWave >= this.maxWaves) {
            // Debug info if win condition not met
            if(!this._debugLogged) {
                console.log(`Wave complete check: Wave=${this.currentWave}, SpawningDone=${this.waveSpawningComplete}, Enemies=${this.enemiesAlive}, Health=${this.playerHealth}`);
                this._debugLogged = true;
            }
        }
    }

    setupSpeedButtons() {
        const scene = this;
        const topBar = document.getElementById('top-bar');
        
        // Use event delegation on the top-bar
        if (topBar) {
            console.log('Setting up speed buttons with delegation...');
            topBar.addEventListener('click', (e) => {
                if (e.target.classList.contains('speed-btn')) {
                    const speed = parseFloat(e.target.getAttribute('data-speed'));
                    console.log(`SPEED BUTTON CLICKED: ${speed}x`);
                    scene.time.timeScale = speed;
                    console.log(`✓ Game speed changed to: ${speed}x`);
                    
                    // Update active state
                    document.querySelectorAll('.speed-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                }
            });
        } else {
            console.warn('TOP-BAR NOT FOUND');
        }
    }

    updateUI() {
        // Update health bar and text
        const healthPercent = (this.playerHealth / this.maxPlayerHealth) * 100;
        if (this.healthBarElement) {
            this.healthBarElement.style.setProperty('--health-width', healthPercent + '%');
        }
        if (this.healthTextElement) {
            this.healthTextElement.textContent = `${Math.max(this.playerHealth, 0)}/${this.maxPlayerHealth}`;
        }

        // Update wave info
        if (this.waveNumberElement) {
            this.waveNumberElement.textContent = `${this.currentWave}/${this.maxWaves}`;
        }
        if (this.waveStatusElement) {
            this.waveStatusElement.textContent = `Enemies: ${this.enemiesAlive}`;
        }

        // Update towers count
        if (this.towersCountElement) {
            this.towersCountElement.textContent = `${this.towers.length}/${this.maxTowers}`;
            // Add visual indicator when maxed
            if (this.towers.length >= this.maxTowers) {
                this.towersCountElement.classList.add('maxed');
            } else {
                this.towersCountElement.classList.remove('maxed');
            }
        }

        // Update gold display
        if (this.goldElement) {
            this.goldElement.textContent = `${this.gold}`;
        }
    }

    findNearestZone(x, y) {
        const ZONE_RADIUS = 50;
        for (const zone of this.towerZones) {
            const zoneWorldX = zone.x * this.tileSize + this.tileSize/2;
            const zoneWorldY = zone.y * this.tileSize + this.tileSize/2;
            const dist = Phaser.Math.Distance.Between(x, y, zoneWorldX, zoneWorldY);
            if (dist <= ZONE_RADIUS) {
                return {x: zoneWorldX, y: zoneWorldY};
            }
        }
        return null;
    }

    // ---------- WAVE SYSTEM ----------
    startNextWave() {
        // guard re-entrancy
        if(this._starting) return;
        this._starting = true;

        // Check if all waves are complete
        if(this.currentWave >= this.maxWaves) {
            console.log(`✓✓✓ All ${this.maxWaves} waves have been started.`);
            console.log(`Remaining enemies: ${this.enemiesAlive}`);
            this._starting = false;
            return;
        }

        this.currentWave++;
        console.log(`\n STARTING WAVE ${this.currentWave}/${this.maxWaves}`);
        this.waveInProgress = true;
        this.waveSpawningComplete = false;

        // Increase tower slots per wave
        this.maxTowers = 6 + this.currentWave - 1;

        const waveCounts = [5,8,12,16,25];
        const spawnCount = waveCounts[this.currentWave-1] || 5;

        // Spawn enemies sequentially (1.5 second delay between spawns)
        this.waveTimer = this.time.addEvent({
            delay: 1500,
            repeat: spawnCount - 1,
            callback: ()=>{ this.spawnEnemy(); },
            onComplete: ()=>{ 
                this.waveSpawningComplete = true;
                console.log(`✓ Wave ${this.currentWave} spawning complete. Enemies alive: ${this.enemiesAlive}`);
            }
        });

        // 30 second timer per wave - automatically moves to next wave
        this.time.delayedCall(30000, ()=>{
            if(this.waveInProgress) {
                console.log(`30 second wave timer expired! Wave ${this.currentWave} complete.`);
                this.waveInProgress = false;
                this.waveSpawningComplete = true; // Important: Mark spawning as complete for win check
                
                // Kill remaining enemies
                this.enemies.getChildren().forEach(enemy => {
                    if(enemy.active) {
                        if(enemy.healthBar) enemy.healthBar.destroy();
                        enemy.destroy();
                        this.enemies.remove(enemy);
                        this.enemiesAlive--;
                    }
                });
                console.log(`Killed remaining enemies. Total alive: ${this.enemiesAlive}`);
                
                // Move to next wave only if not the final wave
                if(this.currentWave < this.maxWaves) {
                    this.time.delayedCall(1000, ()=> this.startNextWave());
                }
            }
        });

        this._starting = false;
    }

    checkWaveComplete() {
        // Not needed anymore - using timer-based system
    }

    setGameSpeed(speed) {
        this.time.timeScale = speed;
    }
    spawnEnemy() {
        const offset = this.tileSize * 0.3;
        const enemy = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            'enemy'
        ).setDisplaySize(this.tileSize*0.5,this.tileSize*0.5).setDepth(1000);

        enemy.hp = 15 + (this.currentWave * 3);
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
        const duration = Math.max(300, 800 - this.currentWave*80);

        this.tweens.add({
            targets: enemy,
            x: next.x*this.tileSize + this.tileSize/2,
            y: next.y*this.tileSize + this.tileSize/2,
            duration: duration,
            ease:'Linear',
            onUpdate: ()=>{ if(enemy.healthBar) enemy.healthBar.setPosition(enemy.x, enemy.y-40); },
            onComplete: ()=>{
                enemy.pathIndex++;
                if(enemy.pathIndex>=this.path.length-1){
                    // Enemy has reached the end of path
                    this.playerHealth -= enemy.damage;
                    if(enemy.healthBar) enemy.healthBar.destroy();
                    enemy.destroy();
                    this.enemiesAlive--;
                    console.log(`Enemy escaped! Alive: ${this.enemiesAlive}`);
                    if(this.playerHealth<=0) {
                        this.loseGame();
                    }
                } else {
                    this.moveEnemy(enemy);
                }
            }
        });
    }

    loseGame(){
        console.log('GAME OVER...');
        this.waveInProgress = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        this.scene.launch('LoseScene');
        this.scene.pause('MainScene');
    }

    winGame(){
        console.log('WINNING GAME...');
        this.waveInProgress = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        this.scene.launch('WinScene');
        this.scene.pause('MainScene');
    }
}
