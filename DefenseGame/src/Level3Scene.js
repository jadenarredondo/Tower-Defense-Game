import Tower from './Tower.js';
import AudioManager from './AudioManager.js';
import ProgressManager from './ProgressManager.js';
import EffectsManager from './EffectsManager.js';

export default class Level3Scene extends Phaser.Scene {
    constructor() {
        super({
            key: 'Level3Scene',
            physics: {
                default: 'arcade',
                arcade: { gravity: { y: 0 }, debug: false }
            }
        });
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
        this.load.on('complete', () => {
            if (this.textures.exists('enemy'))
                this.textures.get('enemy').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });

        this.load.spritesheet('tower','assets/tower/tower.png',{ frameWidth: 64, frameHeight: 64 });
        this.load.on('complete', () => {
            this.textures.get('tower').setFilter(Phaser.Textures.FilterMode.NEAREST);
        });

        // flying enemy animations – each animation is its own spritesheet
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
        const MAP_WIDTH = 60;
        const MAP_HEIGHT = 32;

        // ---------- CAMERA ----------
        this.cameras.main.setBounds(0,0,MAP_WIDTH*this.tileSize,MAP_HEIGHT*this.tileSize);
        this.cameras.main.centerOn(MAP_WIDTH*this.tileSize/2, MAP_HEIGHT*this.tileSize/2);
        this.cameras.main.setZoom(0.6);

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
        this.playerHealth = 15;
        this.maxPlayerHealth = 15;
        this.maxTowers = 8;
        this.gold = 400;
        this.baseGoldReward = 15;

        // Tower types definition
        this.towerTypes = {
            basic: { name: 'Basic', cost: 50, damage: 1, range: 220, attackSpeed: 500, attackSpeedMult: 1, scaleMult: 1, description: 'Standard tower' },
            power: { name: 'Power', cost: 100, damage: 4, range: 200, attackSpeed: 350, attackSpeedMult: 0.7, scaleMult: 1.5, description: 'High damage output' },
            sniper: { name: 'Sniper', cost: 80, damage: 2.5, range: 300, attackSpeed: 800, attackSpeedMult: 1.6, scaleMult: 1, description: 'Long range specialist' },
            farm: {name: 'Farm', cost: 50, damage: 0, range: 10, attackSpeed: 1000, attackSpeedMult: 1.6, scaleMult: 1, moneyGain: 50, description: 'Income generator'}
        };
        this.selectedTowerType = 'basic';

        // Farm/Gold generation system
        this.farmGoldPerSecond = 3;
        this.lastFarmTick = 0;
        this.farmTickInterval = 1000;

        // Store DOM UI elements for updates
        this.healthBarElement = document.getElementById('health-bar');
        this.healthTextElement = document.getElementById('health-text');
        this.waveNumberElement = document.getElementById('wave-number');
        this.waveStatusElement = document.getElementById('wave-status');
        this.towersCountElement = document.getElementById('towers-count');
        this.goldElement = document.getElementById('gold-count');
        this.pauseButton = document.getElementById('pause-btn');

        // Initialize effects manager
        this.effectsManager = new EffectsManager(this);

        // Setup pause button click handler
        this.pauseButton.addEventListener('click', () => {
            if (this.audioManager) this.audioManager.playClick();
            this.scene.launch('PauseScene', { pausedScene: 'Level3Scene' });
            this.scene.pause();
        });

        // Setup speed button handlers
        this.setupSpeedButtons();

        // Setup keyboard hotkeys for tower selection
        this.setupKeyboardHotkeys();

        // ---------- TILES & MAP ----------
        this.walls = this.physics.add.staticGroup();
        this.tiles = [];

        // Draw map
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                const grassIndex = Phaser.Math.Between(1, 5);
                this.add.image(x*this.tileSize+this.tileSize/2, y*this.tileSize+this.tileSize/2, `grass${grassIndex}`).setDepth(-1);
            }
        }

        // ---------- ENEMIES ----------
        this.enemies = this.physics.add.group();
        this.enemiesAlive = 0;

        // Define path as tile-coordinate array (like Level2)
        const pathNodes = [
            { x: 12, y: 6 },    { x: 13, y: 6 },    { x: 14, y: 6 },
            { x: 15, y: 7 },    { x: 15, y: 8 },    { x: 15, y: 9 },
            { x: 15, y: 10 },   { x: 14, y: 11 },   { x: 13, y: 11 },
            { x: 12, y: 11 },   { x: 11, y: 11 },   { x: 10, y: 11 },
            { x: 9, y: 11 },    { x: 9, y: 10 },    { x: 9, y: 9 },
            { x: 9, y: 8 },     { x: 9, y: 7 },     { x: 10, y: 6 },
            { x: 11, y: 6 },    { x: 12, y: 6 },    { x: 12, y: 5 },
            { x: 13, y: 4 },    { x: 14, y: 3 },    { x: 15, y: 3 },
            { x: 16, y: 3 },    { x: 17, y: 3 },    { x: 18, y: 4 },
            { x: 18, y: 5 },    { x: 18, y: 6 },    { x: 17, y: 8 }
        ];

        // expand pathNodes to full path array
        this.path = [];
        for(let i=0;i<pathNodes.length-1;i++){
            const a=pathNodes[i], b=pathNodes[i+1];
            const dx=Math.sign(b.x-a.x), dy=Math.sign(b.y-a.y);
            if(dx!==0){
                for(let x=a.x;x!==b.x+dx;x+=dx) this.path.push({x, y:a.y});
            } else {
                for(let y=a.y;y!==b.y+dy;y+=dy) this.path.push({x:a.x, y});
            }
        }
        this.path.push(pathNodes[pathNodes.length-1]);

        // Draw path visually
        this.pathGraphics = this.add.graphics();
        this.pathGraphics.lineStyle(8, 0x3d3d5c, 1);
        for(let i=0;i<this.path.length;i++){
            const p = this.path[i];
            if(i===0) this.pathGraphics.moveTo(p.x*this.tileSize+this.tileSize/2, p.y*this.tileSize+this.tileSize/2);
            else this.pathGraphics.lineTo(p.x*this.tileSize+this.tileSize/2, p.y*this.tileSize+this.tileSize/2);
        }
        this.pathGraphics.setDepth(0);

        // ---------- TOWERS ----------
        this.towers = [];

        // Tower placement zones - increased for Level 3
        this.towerZones = [];
        const zonePaddingX = 200;
        const zonePaddingY = 200;
        const zoneSpacingX = 280;
        const zoneSpacingY = 280;

        for (let y = zonePaddingY; y < MAP_HEIGHT * this.tileSize - zonePaddingY; y += zoneSpacingY) {
            for (let x = zonePaddingX; x < MAP_WIDTH * this.tileSize - zonePaddingX; x += zoneSpacingX) {
                this.towerZones.push({ x, y, tower: null, id: this.towerZones.length });
            }
        }

        // Draw tower zones
        this.zones = this.add.graphics();
        this.zones.lineStyle(3, 0x00ff00, 0.3);
        this.towerZones.forEach(zone => {
            this.zones.strokeCircle(zone.x, zone.y, 50);
        });
        this.zones.setDepth(1);

        // Tower zone click handler
        this.input.on('pointerdown', pointer => {
            for (const zone of this.towerZones) {
                const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, zone.x, zone.y);
                if (dist < 50) {
                    this.handleTowerPlacement(zone);
                    break;
                }
            }
        });

        // ---------- WAVES ----------
        this.waves = [
            { count: 20, delay: 1200, duration: 30000 },
            { count: 25, delay: 1000, duration: 30000 },
            { count: 30, delay: 900, duration: 30000 },
            { count: 35, delay: 800, duration: 30000 },
            { count: 40, delay: 800, duration: 35000 },
            { count: 45, delay: 700, duration: 35000 }
        ];
        this.currentWave = 0;
        this.waveActive = false;
        this.waveEnemyCount = 0;
        this.nextWaveCountdown = 0;

        // ---------- UI ----------
        this.updateUI();
        
        // Setup audio controls
        this.setupAudioControls();

        // ESC to pause
        this.input.keyboard.on('keydown-ESC', () => { 
            this.scene.launch('PauseScene', { pausedScene: 'Level3Scene' }); 
            this.scene.pause(); 
        });

        // UI Visibility
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
        
        // Start first wave
        this.startWave();
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

    update(time, delta) {
        // Keyboard camera movement (arrow keys and WASD)
        if (this.keyW.isDown) this.cameras.main.scrollY -= this.cameraSpeed;
        if (this.keyS.isDown) this.cameras.main.scrollY += this.cameraSpeed;
        if (this.keyA.isDown) this.cameras.main.scrollX -= this.cameraSpeed;
        if (this.keyD.isDown) this.cameras.main.scrollX += this.cameraSpeed;

        // Farm gold generation
        this.lastFarmTick += delta;
        if (this.lastFarmTick >= this.farmTickInterval) {
            this.gold += this.farmGoldPerSecond;
            this.lastFarmTick = 0;
            this.updateUI();
        }

        // Wave management
        if (!this.waveActive && this.currentWave < this.waves.length) {
            this.nextWaveCountdown += delta;
            if (this.nextWaveCountdown >= 2000) {
                this.startWave();
                this.nextWaveCountdown = 0;
            }
        }

        // Active wave management
        if (this.waveActive) {
            if (this.enemiesAlive === 0 && this.waveEnemyCount === 0) {
                this.waveActive = false;
                if (this.currentWave < this.waves.length) {
                    this.currentWave++;
                    this.updateUI();
                }
            }
        }

        // Win condition
        if (this.currentWave >= this.waves.length && this.enemiesAlive === 0 && !this._winTriggered) {
            this._winTriggered = true;
            this.time.delayedCall(500, () => this.winGame());
        }

        // Lose condition (immediate scene transition before loseGame is called from moveEnemy)
        // loseGame is called directly from moveEnemy when playerHealth <= 0

        // Update UI
        this.updateUI();
    }

    startWave() {
        const wave = this.waves[this.currentWave];
        const isFinalWave = this.currentWave >= this.waves.length - 1;
        
        this.waveActive = true;
        this.waveEnemyCount = wave.count;

        // Spawn boss on final wave
        if (isFinalWave) {
            this.spawnBoss();
            console.log(`🌊 Final Wave ${this.currentWave + 1}: BOSS INCOMING!`);
        }

        let spawnedCount = 0;
        const spawnInterval = this.time.addEvent({
            delay: wave.delay,
            repeat: wave.count - 1,
            callback: () => {
                this.spawnEnemy();
                spawnedCount++;
            }
        });

        this.updateUI();
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

    handleTowerPlacement(zone) {
        // Check for existing tower
        const existingTower = this.towers.find(t => 
            Math.abs(t.sprite.x - zone.x) < 5 && 
            Math.abs(t.sprite.y - zone.y) < 5
        );

        if (existingTower) {
            // Show upgrade menu for existing tower
            this.showTowerUpgradeMenu(existingTower);
        } else if (this.towers.length < this.maxTowers) {
            // Place new tower
            const cost = this.towerTypes[this.selectedTowerType].cost;
            if (this.gold >= cost) {
                const config = this.towerTypes[this.selectedTowerType];
                const tower = new Tower(this, zone.x, zone.y, config);
                this.towers.push(tower);
                this.gold -= cost;
                zone.tower = tower;
                this.audioManager.playClick();
                console.log(`✅ Tower placed! Type: ${config.name}, Cost: ${cost}, Remaining gold: ${this.gold}`);
            } else {
                console.log(`❌ Not enough gold! Need: ${cost}, Have: ${this.gold}`);
            }
        } else {
            console.log(`❌ Max towers (${this.maxTowers}) reached!`);
        }
        this.updateUI();
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
            console.log(`❌ Not enough gold! Need ${cost}, Have ${this.gold}`);
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

        if (this.audioManager) this.audioManager.playClick();
        this.updateUI();
    }

    updateUI() {
        this.healthBarElement.style.width = (this.playerHealth / this.maxPlayerHealth * 100) + '%';
        this.healthTextElement.textContent = `${this.playerHealth}/${this.maxPlayerHealth}`;
        this.waveNumberElement.textContent = `Wave ${this.currentWave + 1}/${this.waves.length}`;
        this.waveStatusElement.textContent = this.waveActive ? `Enemies: ${this.enemiesAlive}` : 'Ready';
        this.towersCountElement.textContent = `${this.towers.length}/${this.maxTowers}`;
        this.goldElement.textContent = this.gold;
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

    loseGame(){
        console.log('💀 GAME OVER...');
        if (this.audioManager) this.audioManager.playGameOver();
        this.waveActive = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        this.scene.launch('LoseScene');
        this.scene.pause('Level3Scene');
    }

    winGame(){
        console.log('🎉 WINNING LEVEL 3...');
        if (this.audioManager) this.audioManager.playVictory();
        ProgressManager.completeLevel(3);
        this.waveActive = false;
        const uiBar = document.getElementById('game-ui');
        if (uiBar) uiBar.style.display = 'none';
        const towerSelectionPanel = document.getElementById('tower-selection-panel');
        if (towerSelectionPanel) towerSelectionPanel.style.display = 'none';
        this.scene.launch('WinScene', { level: 3, gold: this.gold });
        this.scene.pause('Level3Scene');
    }

    setupSpeedButtons() {
        const scene = this;
        const topBar = document.getElementById('top-bar');
        
        if (topBar) {
            topBar.addEventListener('click', (e) => {
                if (e.target.classList.contains('speed-btn')) {
                    const speed = parseFloat(e.target.getAttribute('data-speed'));
                    scene.time.timeScale = speed;
                    
                    // Update active state
                    document.querySelectorAll('.speed-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    e.target.classList.add('active');
                }
            });
        }
    }

    setupKeyboardHotkeys() {
        // 1 = Basic tower
        this.input.keyboard.on('keydown-ONE', () => {
            this.selectedTowerType = 'basic';
            console.log('⌨️ Selected: Basic Tower (hotkey 1)');
        });

        // 2 = Power tower
        this.input.keyboard.on('keydown-TWO', () => {
            this.selectedTowerType = 'power';
            console.log('⌨️ Selected: Power Tower (hotkey 2)');
        });

        // 3 = Sniper tower
        this.input.keyboard.on('keydown-THREE', () => {
            this.selectedTowerType = 'sniper';
            console.log('⌨️ Selected: Sniper Tower (hotkey 3)');
        });
    }
}
