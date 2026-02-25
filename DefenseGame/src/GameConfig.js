/**
 * GameConfig - Centralized game configuration and constants
 */
export default {
    // Gameplay
    INITIAL_HEALTH: 20,
    INITIAL_GOLD: 200,
    INITIAL_TOWERS: 6,
    MAX_WAVES: 5,
    BASE_GOLD_REWARD: 10,
    FARM_GOLD_PER_SECOND: 2,

    // Tower types
    TOWER_TYPES: {
        basic: {
            name: 'Basic',
            cost: 50,
            damage: 1,
            range: 220,
            attackSpeed: 500,
            attackSpeedMult: 1,
            scaleMult: 1,
            description: 'Standard tower'
        },
        power: {
            name: 'Power',
            cost: 100,
            damage: 4,
            range: 200,
            attackSpeed: 350,
            attackSpeedMult: 0.7,
            scaleMult: 1.5,
            description: 'High damage output'
        },
        sniper: {
            name: 'Sniper',
            cost: 80,
            damage: 2.5,
            range: 300,
            attackSpeed: 800,
            attackSpeedMult: 1.6,
            scaleMult: 1,
            description: 'Long range specialist'
        }
    },

    // Wave enemy counts
    WAVE_ENEMY_COUNTS: [5, 8, 12, 16, 25],
    WAVE_SPAWN_DELAY: 1500, // milliseconds between enemy spawns
    WAVE_DURATION: 30000, // milliseconds per wave

    // Audio settings defaults
    AUDIO: {
        MASTER_VOLUME: 0.3,
        SOUND_VOLUME: 0.4,
        MUSIC_VOLUME: 0.25
    },

    // Map settings
    MAP_WIDTH: 40,
    MAP_HEIGHT: 22,
    TILE_SIZE: 80,

    // Graphics and visual settings
    PARTICLE_COUNT: 12,
    GLOW_COLORS: [0xff6b6b, 0xffd700, 0x64d5ff],
    CAMERA_MIN_ZOOM: 0.4,
    CAMERA_MAX_ZOOM: 2,
    CAMERA_INITIAL_ZOOM: 0.7
};
