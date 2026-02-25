import Tower from './Tower.js';
import AudioManager from './AudioManager.js';

export default class Level2Scene extends Phaser.Scene {
    constructor() {
        super('Level2Scene');
        this.audioManager = new AudioManager();
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
        // 'ghost' enemy is actually the flying creature, handled as animation not static image
        this.load.on('complete', () => {
            if (this.textures.exists('enemy'))
                this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });

        this.load.spritesheet('tower','assets/tower/tower.png',{ frameWidth: 64, frameHeight: 64 });
        this.load.on('complete', () => {
            this.textures.get('tower').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });

        // flying enemy animations – each animation is its own 4‑frame spritesheet
        const flyingKeys = ['flying_walk','flying_fly','flying_hurt','flying_dead'];
        flyingKeys.forEach(key => {
            this.load.spritesheet(key, `assets/decorations/${key}.png`, { frameWidth: 128, frameHeight: 128 });
        });
        this.load.on('complete', () => {
            flyingKeys.forEach(key => {
                if (this.textures.exists(key)) {
                    this.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
                }
            });
        });
    }

    create() {
        // ---------- AUDIO SETUP ----------
        this.audioManager.resume();
        this.audioManager.playBackgroundMusic();
        this.setupAudioControls();

        // create flying enemy animations (only needs to be done once)
        if (!this.anims.exists('flying_walk')) {
            const flyingKeys = ['flying_walk', 'flying_fly', 'flying_hurt', 'flying_dead'];
            console.log('📋 Checking flying textures:', flyingKeys.map(k => k + ': ' + this.textures.exists(k)));
            
            this.anims.create({
                key: 'flying_walk',
                frames: this.anims.generateFrameNumbers('flying_walk', { start: 0, end: 6 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'flying_fly',
                frames: this.anims.generateFrameNumbers('flying_fly', { start: 0, end: 5 }),
                frameRate: 8,
                repeat: -1
            });
            this.anims.create({
                key: 'flying_hurt',
                frames: this.anims.generateFrameNumbers('flying_hurt', { start: 0, end: 2 }),
                frameRate: 8,
                repeat: 0
            });
            this.anims.create({
                key: 'flying_dead',
                frames: this.anims.generateFrameNumbers('flying_dead', { start: 0, end: 4 }),
                frameRate: 8,
                repeat: 0
            });
            console.log('✅ Flying animations created');
        }
        
        // ---------- CONFIG ----------
        this.tileSize = 80;
        const MAP_WIDTH = 60;  // Expanded from 50
        const MAP_HEIGHT = 35;  // Expanded from 28

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

        // Keyboard camera movement (arrow keys and WASD)
        this.keyW = this.input.keyboard.addKey('W');
        this.keyA = this.input.keyboard.addKey('A');
        this.keyS = this.input.keyboard.addKey('S');
        this.keyD = this.input.keyboard.addKey('D');
        this.cameraSpeed = 10;

        // ---------- PLAYER ----------
        this.playerHealth = 20;
        this.maxPlayerHealth = 20;
        this.maxTowers = 7;
        this.gold = 300;
        this.baseGoldReward = 15;
        // tower selection/upgrade helpers (same style as level 1)
        this.selectedTower = null;
        this.pendingUpgrade = null;

        // Tower types definition
        this.towerTypes = {
            basic: { name: 'Basic', cost: 50, damage: 1, range: 220, attackSpeed: 500, attackSpeedMult: 1, scaleMult: 1, description: 'Standard tower' },
            power: { name: 'Power', cost: 100, damage: 4, range: 200, attackSpeed: 350, attackSpeedMult: 0.7, scaleMult: 1.5, description: 'High damage output' },
            sniper: { name: 'Sniper', cost: 80, damage: 2.5, range: 300, attackSpeed: 800, attackSpeedMult: 1.6, scaleMult: 1, description: 'Long range specialist' }
        };
        this.selectedTowerType = 'basic';

        // Farm/Gold generation system
        this.farmGoldPerSecond = 3;
        this.lastFarmTick = 0;
        this.farmTickInterval = 1000; // 1 second

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
            if (this.audioManager) this.audioManager.playClick();
            this.scene.launch('PauseScene', { pausedScene: 'Level2Scene' });
            this.scene.pause();
        });

        // Setup speed button handlers
        this.setupSpeedButtons();

        // Setup tower selection UI
        this.setupTowerSelectionUI();

        // Setup keyboard hotkeys for tower selection
        this.setupKeyboardHotkeys();

        // ---------- WAVE SYSTEM ----------
        this.currentWave = 0;
        this.maxWaves = 12;
        this.waveInProgress = false;
        this.bossDefeated = false;
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
            {x:0,y:17},{x:7,y:17},{x:7,y:5},{x:15,y:5},
            {x:15,y:12},{x:10,y:12},{x:10,y:25},{x:22,y:25},
            {x:22,y:8},{x:35,y:8},{x:35,y:28},{x:50,y:28},
            {x:50,y:15},{x:59,y:15},{x:59,y:32},{x:59,y:34}
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

        // Path tiles - must be at high depth to appear above decorations
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
                .setDisplaySize(this.tileSize,this.tileSize).setDepth(2000);
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
        place(100,['tree1','tree2'],1.3);
        place(60,['rock1','rock2'],0.8);
        place(15,['temple1','temple2','temple3'],1.15);

        // ---------- ENEMIES ----------
        this.enemies = this.add.group();

        // ---------- TOWER PLACEMENT ZONES ----------
        this.towerZones = [
            {x: 1, y: 13},
            {x: 1, y: 15},
            {x: 3, y: 12},
            {x: 3, y: 16},
            {x: 7, y: 2},
            {x: 7, y: 4},
            {x: 11, y: 2},
            {x: 11, y: 10},
            {x: 14, y: 5},
            {x: 14, y: 11},
            {x: 16, y: 18},
            {x: 20, y: 18},
            {x: 24, y: 6},
            {x: 26, y: 6},
            {x: 24, y: 21},
            {x: 26, y: 21},
            {x: 33, y: 8},
            {x: 35, y: 8},
            {x: 35, y: 13},
            {x: 37, y: 18},
            {x: 42, y: 12},
            {x: 44, y: 10},
            {x: 46, y: 20},
            {x: 48, y: 23}
        ];

        // draw tower zones and enable click handling later... (unchanged)


        // Draw tower placement zones
        for (const zone of this.towerZones) {
            this.add.circle(zone.x * this.tileSize + this.tileSize/2, zone.y * this.tileSize + this.tileSize/2, 25, 0x00ff00, 0.3)
                .setDepth(10);
        }

        // ---------- TOWERS ----------
        this.towers = [];
        this.input.on('pointerdown', pointer => {
            const towerPos = this.findNearestZone(pointer.worldX, pointer.worldY);
            if (!towerPos) return;

            // Check if a tower already sits there
            const existingTower = this.towers.find(t => 
                Math.abs(t.sprite.x - towerPos.x) < 5 && 
                Math.abs(t.sprite.y - towerPos.y) < 5
            );

            if (existingTower) {
                if (this.pendingUpgrade) {
                    // apply tool upgrade
                    const costMap = { damage: 75, range: 60, speed: 80 };
                    this.upgradeTower(existingTower, this.pendingUpgrade, costMap[this.pendingUpgrade]);
                    this.pendingUpgrade = null;
                    document.querySelectorAll('.upgrade-tool-btn').forEach(b => b.classList.remove('active'));
                    this.hideTowerUpgradeMenu();
                } else {
                    // open upgrade menu
                    this.selectedTower = existingTower;
                    this.showTowerUpgradeMenu(existingTower);
                }
            } else if (this.towers.length < this.maxTowers) {
                const towerConfig = this.towerTypes[this.selectedTowerType];
                if (this.gold >= towerConfig.cost) {
                    const tower = new Tower(this, towerPos.x, towerPos.y, towerConfig, this.audioManager);
                    this.towers.push(tower);
                    this.gold -= towerConfig.cost;
                    this.audioManager.playTowerPlace();
                    console.log(`🏗️ Tower placed! Cost: -${towerConfig.cost} (Gold: ${this.gold})`);
                    this.selectedTower = null;
                    this.hideTowerUpgradeMenu();
                } else {
                    console.log(`❌ Not enough gold! Need ${towerConfig.cost}, have ${this.gold}`);
                }
            } else {
                console.log(`❌ Max towers reached! Upgrade existing towers instead.`);
            }
        });

        // ---------- PAUSE ----------
        this.input.keyboard.on('keydown-ESC',()=>{ 
            this.scene.launch('PauseScene', { pausedScene: 'Level2Scene' }); 
            this.scene.pause(); 
        });

        // ---------- UI VISIBILITY ----------
        const uiBar = document.getElementById('game-ui');
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (uiBar) uiBar.style.display = 'flex';
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'flex';

        this.events.on('shutdown', () => {
            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
            if (this.audioManager) this.audioManager.stopBackgroundMusic();
        });
        this.events.on('sleep', () => {
            if (uiBar) uiBar.style.display = 'none';
            if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        });

        // ---------- START FIRST WAVE ----------
        this.startNextWave();
    }

    update() {
        // Keyboard camera movement (arrow keys and WASD)
        if (this.keyW.isDown) this.cameras.main.scrollY -= this.cameraSpeed;
        if (this.keyS.isDown) this.cameras.main.scrollY += this.cameraSpeed;
        if (this.keyA.isDown) this.cameras.main.scrollX -= this.cameraSpeed;
        if (this.keyD.isDown) this.cameras.main.scrollX += this.cameraSpeed;

        // Farm/Gold generation tick
        const now = this.time.now;
        if (now - this.lastFarmTick >= this.farmTickInterval) {
            this.gold += this.farmGoldPerSecond;
            console.log(`🌾 Farm tick: +${this.farmGoldPerSecond} gold (Total: ${this.gold})`);
            this.lastFarmTick = now;
            this.updateTowerSelectionUI();
        }

        // Update UI
        this.updateUI();
        
        // Check win condition after all waves are spawned
        if(this.currentWave >= this.maxWaves && this.waveSpawningComplete && this.enemiesAlive <= 0 && this.playerHealth > 0) {
            if(!this._winTriggered) {
                this._winTriggered = true;
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('🎉 LEVEL 2 COMPLETE!');
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
            console.log('📍 Setting up speed buttons with delegation...');
            topBar.addEventListener('click', (e) => {
                if (e.target.classList.contains('speed-btn')) {
                    const speed = parseFloat(e.target.getAttribute('data-speed'));
                    console.log(`⚡ SPEED BUTTON CLICKED: ${speed}x`);
                    scene.time.timeScale = speed;
                    if (scene.audioManager) scene.audioManager.playClick();
                    console.log(`✓ Game speed changed to: ${speed}x`);
                    
                    // Update active state
                    document.querySelectorAll('.speed-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                }
            });
        } else {
            console.warn('⚠️ TOP-BAR NOT FOUND');
        }
    }

    setupTowerSelectionUI() {
        const towerListContainer = document.getElementById('tower-list');
        const selectionPanel = document.getElementById('tower-selection-panel');
        
        if (!towerListContainer || !selectionPanel) return;

        // Clear existing options
        towerListContainer.innerHTML = '';

        // Show the panel
        selectionPanel.style.display = 'flex';

        // Populate tower options
        Object.entries(this.towerTypes).forEach(([key, config]) => {
            const option = document.createElement('div');
            option.className = 'tower-option';
            if (key === this.selectedTowerType) option.classList.add('selected');
            option.setAttribute('data-tower-type', key);
            option.innerHTML = `
                <div class="tower-name">${config.name}</div>
                <div class="tower-cost">💰 ${config.cost}</div>
                <div class="tower-description">${config.description}</div>
            `;

            option.addEventListener('click', () => {
                if (this.audioManager) this.audioManager.playClick();
                this.selectTowerType(key);
            });

            towerListContainer.appendChild(option);
        });

        // add upgrade tools (damage/range/speed) just like level 1
        let toolsContainer = document.getElementById('upgrade-tools');
        if (!toolsContainer) {
            toolsContainer = document.createElement('div');
            toolsContainer.id = 'upgrade-tools';
            toolsContainer.style.cssText = 'display:flex; gap:8px; margin-top:10px; padding:8px; align-items:center;';
            selectionPanel.appendChild(toolsContainer);
        }
        toolsContainer.innerHTML = '';

        const upgrades = [
            { type: 'damage', label: 'Boost Damage', cost: 75 },
            { type: 'range', label: 'Extend Range', cost: 60 },
            { type: 'speed', label: 'Faster Fire', cost: 80 }
        ];

        upgrades.forEach(u => {
            const btn = document.createElement('button');
            btn.className = 'upgrade-tool-btn';
            btn.textContent = `${u.label} (${u.cost}G)`;
            btn.style.cssText = 'padding:4px 8px; font-size:12px;';
            btn.addEventListener('click', () => {
                if (this.gold >= u.cost) {
                    this.pendingUpgrade = u.type;
                    document.querySelectorAll('.upgrade-tool-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (this.audioManager) this.audioManager.playClick();
                }
            });
            toolsContainer.appendChild(btn);
        });

        // Update UI visibility
        this.updateTowerSelectionUI();
    }

    selectTowerType(towerType) {
        this.selectedTowerType = towerType;
        console.log(`🎯 Selected tower type: ${towerType}`);
        
        // Update UI
        document.querySelectorAll('.tower-option').forEach(option => {
            option.classList.remove('selected');
            if (option.getAttribute('data-tower-type') === towerType) {
                option.classList.add('selected');
            }
        });

        this.updateTowerSelectionUI();
    }

    updateTowerSelectionUI() {
        document.querySelectorAll('.tower-option').forEach(option => {
            const towerType = option.getAttribute('data-tower-type');
            const config = this.towerTypes[towerType];
            const canAfford = this.gold >= config.cost;
            
            if (!canAfford && towerType !== this.selectedTowerType) {
                option.classList.add('disabled');
            } else {
                option.classList.remove('disabled');
            }
        });
        // disable upgrade tool buttons if player can't afford
        document.querySelectorAll('.upgrade-tool-btn').forEach(btn => {
            const text = btn.textContent || '';
            const match = text.match(/\((\d+)G\)/);
            if (match) {
                const cost = parseInt(match[1], 10);
                if (this.gold < cost) {
                    btn.disabled = true;
                    btn.style.opacity = '0.5';
                } else {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                }
            }
        });
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

    setupKeyboardHotkeys() {
        // 1 = Basic tower
        this.input.keyboard.on('keydown-ONE', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('basic');
            console.log('⌨️ Selected: Basic Tower (hotkey 1)');
        });

        // 2 = Power tower
        this.input.keyboard.on('keydown-TWO', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('power');
            console.log('⌨️ Selected: Power Tower (hotkey 2)');
        });

        // 3 = Sniper tower
        this.input.keyboard.on('keydown-THREE', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.selectTowerType('sniper');
            console.log('⌨️ Selected: Sniper Tower (hotkey 3)');
        });
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
        console.log(`\n🌊 STARTING WAVE ${this.currentWave}/${this.maxWaves}`);
        if (this.audioManager) this.audioManager.playWaveStart();
        this.waveInProgress = true;
        this.waveSpawningComplete = false;

        // Increase tower slots per wave
        this.maxTowers = 7 + this.currentWave - 1;

        // If final wave, spawn boss instead of regular enemies
        if (this.currentWave >= this.maxWaves) {
            console.log('👑 BOSS WAVE!');
            this.spawnBoss();
            this.waveSpawningComplete = true;
            return;
        }

        const waveCounts = [5,8,10,12,15,18,20,22,24,26,28,30];
        const spawnCount = waveCounts[this.currentWave-1] || 8;

        // Spawn enemies sequentially (1.5 second delay between spawns)
        this.waveTimer = this.time.addEvent({
            delay: 1200,
            repeat: spawnCount - 1,
            callback: ()=>{ this.spawnEnemy(); },
            onComplete: ()=>{ 
                this.waveSpawningComplete = true;
                console.log(`✓ Wave ${this.currentWave} spawning complete. Enemies alive: ${this.enemiesAlive}`);
            }
        });

        // 35 second timer per wave - automatically moves to next wave
        this.time.delayedCall(35000, ()=>{
            if(this.waveInProgress) {
                console.log(`⏱️ 35 second wave timer expired! Wave ${this.currentWave} complete.`);
                this.waveInProgress = false;
                this.waveSpawningComplete = true;
                
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

    // show upgrade menu copied from MainScene
    showTowerUpgradeMenu(tower) {
        this.hideTowerUpgradeMenu();
        
        const menu = document.createElement('div');
        menu.id = 'tower-upgrade-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, rgba(15, 21, 52, 0.98) 0%, rgba(11, 16, 42, 0.98) 100%);
            border: 3px solid #7c3aed;
            border-radius: 12px;
            padding: 30px;
            z-index: 20000;
            min-width: 500px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            font-family: Arial, sans-serif;
        `;

        const title = document.createElement('h2');
        title.textContent = `${tower.type} Tower - Level ${tower.level}`;
        title.style.cssText = `
            color: #64d5ff;
            margin: 0 0 20px 0;
            font-size: 24px;
            text-shadow: 0 0 10px rgba(100, 213, 255, 0.5);
        `;
        menu.appendChild(title);

        // Stats display
        const stats = document.createElement('div');
        stats.style.cssText = `
            background: rgba(124, 58, 237, 0.2);
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(167, 139, 250, 0.3);
        `;
        stats.innerHTML = `
            <p style="color: #a8daff; margin: 5px 0;"><strong>Damage:</strong> ${tower.damage.toFixed(1)}</p>
            <p style="color: #a8daff; margin: 5px 0;"><strong>Range:</strong> ${tower.range}</p>
            <p style="color: #a8daff; margin: 5px 0;"><strong>Attack Speed:</strong> ${tower.attackSpeed}ms</p>
        `;
        menu.appendChild(stats);

        // Upgrade buttons
        const upgradesDiv = document.createElement('div');
        upgradesDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 12px;
            margin-bottom: 20px;
        `;

        const upgrades = [
            { type: 'damage', name: '⚡ Boost Damage +2', cost: 75 },
            { type: 'range', name: '📍 Extend Range +50', cost: 60 },
            { type: 'speed', name: '⏱️ Faster Fire Speed', cost: 80 }
        ];

        upgrades.forEach(upgrade => {
            const btn = document.createElement('button');
            const canAfford = this.gold >= upgrade.cost;
            btn.textContent = `${upgrade.name} (${upgrade.cost}G)`;
            btn.style.cssText = `
                padding: 12px 16px;
                background: ${canAfford ? '#ffffff' : '#cccccc'};
                color: ${canAfford ? '#000' : '#666'};
                border: 2px solid ${canAfford ? '#cccccc' : '#999999'};
                border-radius: 8px;
                cursor: ${canAfford ? 'pointer' : 'not-allowed'};
                font-size: 14px;
                font-weight: bold;
                transition: all 0.2s ease;
                opacity: ${canAfford ? '1' : '0.6'};
            `;

            if (canAfford) {
                btn.addEventListener('mouseover', () => {
                    btn.style.background = '#f0f0f0';
                    btn.style.boxShadow = '0 0 8px rgba(255, 255, 255, 0.4)';
                });
                btn.addEventListener('mouseout', () => {
                    btn.style.background = '#ffffff';
                    btn.style.boxShadow = 'none';
                });

                btn.addEventListener('click', () => {
                    this.upgradeTower(tower, upgrade.type, upgrade.cost);
                    this.hideTowerUpgradeMenu();
                });
            }

            upgradesDiv.appendChild(btn);
        });

        menu.appendChild(upgradesDiv);

        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'CLOSE (ESC)';
        closeBtn.style.cssText = `
            width: 100%;
            padding: 12px;
            background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
            color: white;
            border: 2px solid #818cf8;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            font-size: 14px;
            transition: all 0.2s ease;
        `;
        closeBtn.addEventListener('click', () => this.hideTowerUpgradeMenu());
        closeBtn.addEventListener('mouseover', () => {
            closeBtn.style.background = 'linear-gradient(135deg, #818cf8 0%, #6366f1 100%)';
            closeBtn.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.6)';
        });
        closeBtn.addEventListener('mouseout', () => {
            closeBtn.style.background = 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)';
            closeBtn.style.boxShadow = 'none';
        });
        menu.appendChild(closeBtn);

        document.body.appendChild(menu);

        // Close on ESC
        const closeHandler = (e) => {
            if (e.key === 'Escape') {
                this.hideTowerUpgradeMenu();
                document.removeEventListener('keydown', closeHandler);
            }
        };
        document.addEventListener('keydown', closeHandler);
    }

    hideTowerUpgradeMenu() {
        const menu = document.getElementById('tower-upgrade-menu');
        if (menu) {
            menu.remove();
        }
        this.selectedTower = null;
    }

    upgradeTower(tower, upgradeType, cost) {
        if (this.gold < cost) {
            console.log(`❌ Not enough gold!`);
            return;
        }

        // Check upgrade limits (max 3 per type)
        if (upgradeType === 'damage' && tower.damageUpgrades >= tower.maxUpgradesPerType) {
            console.log(`❌ Damage upgrade limit reached!`);
            return;
        } else if (upgradeType === 'range' && tower.rangeUpgrades >= tower.maxUpgradesPerType) {
            console.log(`❌ Range upgrade limit reached!`);
            return;
        } else if (upgradeType === 'speed' && tower.speedUpgrades >= tower.maxUpgradesPerType) {
            console.log(`❌ Speed upgrade limit reached!`);
            return;
        }

        this.gold -= cost;

        if (upgradeType === 'damage') {
            tower.damage += 2;
            tower.damageUpgrades++;
        } else if (upgradeType === 'range') {
            tower.range += 50;
            tower.rangeUpgrades++;
            tower.rangeCircle.setRadius(tower.range);
        } else if (upgradeType === 'speed') {
            tower.attackSpeed = Math.max(100, tower.attackSpeed - 100);
            tower.speedUpgrades++;
            if (tower.timer) {
                tower.timer.destroy();
                tower.timer = this.time.addEvent({ delay: tower.attackSpeed, loop: true, callback: tower.attack, callbackScope: tower });
            }
        }

        if (this.audioManager) this.audioManager.playUpgrade();
    }

    spawnEnemy() {
        const offset = this.tileSize * 0.3;
        // decide normal vs ghost – ghost is the flying creature
        const isGhost = Phaser.Math.Between(0, 100) < 40; // 40% ghost chance
        const key = isGhost && this.textures.exists('flying_walk') ? 'flying_walk' : 'enemy';
        const spriteSize = isGhost ? 1.1 : 0.5;
        
        const enemy = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            key
        ).setOrigin(0.5).setDisplaySize(this.tileSize * spriteSize, this.tileSize * spriteSize).setDepth(5100);

        enemy.isFlying = isGhost && this.textures.exists('flying_walk');
        enemy.isGhost = isGhost;
        
        if (enemy.isFlying && this.anims.exists('flying_walk')) {
            console.log('🐉 Flying enemy spawned with walk animation');
            enemy.play('flying_walk');
        } else if (enemy.isFlying) {
            console.log('⚠️ Flying texture exists but animation missing! Texture exists:', this.textures.exists('flying_walk'), 'Animation exists:', this.anims.exists('flying_walk'));
        }

        // adjust stats
        enemy.hp = 20 + (this.currentWave * 4) + (isGhost ? -5 : 0);
        enemy.maxHp = enemy.hp;
        enemy.damage = 2 + this.currentWave;
        enemy.pathIndex = 0;

        enemy.healthBar = this.add.rectangle(enemy.x, enemy.y-40, 50,8,0x00ff00).setOrigin(0.5).setDepth(5150);

        this.enemies.add(enemy);
        this.enemiesAlive++;

        this.moveEnemy(enemy);
    }

    moveEnemy(enemy){
        if(!enemy.active) return;
        if(enemy.pathIndex>=this.path.length-1) return;
        
        if (enemy.isFlying && this.anims.exists('flying_fly')) {
            // only start flying animation if not already playing
            const current = enemy.anims.currentAnim ? enemy.anims.currentAnim.key : null;
            if (current !== 'flying_fly') {
                enemy.play('flying_fly');
            }
        }

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
                    if (this.audioManager) this.audioManager.playDamage();
                    if(enemy.healthBar) enemy.healthBar.destroy();
                    enemy.destroy();
                    this.enemies.remove(enemy);
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
        console.log('💀 GAME OVER...');
        if (this.audioManager) this.audioManager.playGameOver();
        this.waveInProgress = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        this.scene.launch('LoseScene');
        this.scene.pause('Level2Scene');
    }

    winGame(){
        console.log('🎉 WINNING LEVEL 2...');
        if (this.audioManager) this.audioManager.playVictory();
        this.waveInProgress = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        this.scene.launch('WinScene', { level: 2, gold: this.gold });
        this.scene.pause('Level2Scene');
    }

    setupAudioControls() {
        const muteBtn = document.getElementById('mute-btn');
        const volumeSlider = document.getElementById('volume-slider');

        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const isMuted = this.audioManager.toggleMute();
                muteBtn.textContent = isMuted ? '🔇' : '🔊';
                this.audioManager.playClick();
            });
        }

        if (volumeSlider) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = parseFloat(e.target.value) / 100;
                this.audioManager.setMasterVolume(volume);
            });
        }
    }

    spawnBoss() {
        const offset = this.tileSize * 0.3;
        const useFlying = true; // boss always uses flying sprite for dramatic effect
        const key = useFlying ? (this.textures.exists('flying_walk') ? 'flying_walk' : 'enemy') : 'enemy';
        const boss = this.add.sprite(
            this.path[0].x*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            this.path[0].y*this.tileSize+this.tileSize/2 + Phaser.Math.Between(-offset,offset),
            key
        ).setDisplaySize(this.tileSize*1.2,this.tileSize*1.2).setDepth(5100).setTint(0xff0000);

        if (useFlying && this.textures.exists('flying_walk')) {
            boss.isFlying = true;
            boss.play('flying_walk');
        }

        boss.hp = 200;
        boss.maxHp = 200;
        boss.damage = 5;
        boss.pathIndex = 0;
        boss.isBoss = true;

        boss.healthBar = this.add.rectangle(boss.x, boss.y-50, 80,12,0xff0000).setOrigin(0.5).setDepth(5150);

        this.enemies.add(boss);
        this.enemiesAlive++;

        console.log('👹 Boss spawned!');
        this.moveEnemy(boss);
    }
}
