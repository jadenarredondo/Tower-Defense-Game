/**
 * Game Constants - Centralized configuration to prevent fragility
 * Update these values instead of searching through code
 */

export const GAME = {
    // Level Configuration
    MAX_LEVELS: 3,
    LEVEL_KEYS: ['MainScene', 'Level2Scene', 'Level3Scene'],
    
    // Scene Names (use instead of string literals)
    SCENES: {
        MENU: 'MenuScene',
        LEVEL_SELECT: 'LevelSelectScene',
        DIFFICULTY_SELECT: 'DifficultySelectScene',
        TUTORIAL: 'TutorialScene',
        MAIN: 'MainScene',
        LEVEL_2: 'Level2Scene',
        LEVEL_3: 'Level3Scene',
        PAUSE: 'PauseScene',
        SETTINGS: 'SettingsScene',
        WIN: 'WinScene',
        LOSE: 'LoseScene'
    },

    // DOM Element IDs (single source of truth)
    DOM: {
        GAME_CONTAINER: 'game-container',
        GAME_UI: 'game-ui',
        TOP_BAR: 'top-bar',
        TOWER_SELECTION_PANEL: 'tower-selection-panel',
        TOWER_LIST: 'tower-list',
        MUTE_BTN: 'mute-btn',
        VOLUME_SLIDER: 'volume-slider',
        HEALTH_BAR: 'health-bar',
        HEALTH_TEXT: 'health-text',
        WAVE_NUMBER: 'wave-number',
        WAVE_STATUS: 'wave-status',
        TOWERS_COUNT: 'towers-count',
        GOLD_COUNT: 'gold-count',
        PAUSE_BTN: 'pause-btn'
    },

    // Color Theme (update for theme changes)
    COLORS: {
        PRIMARY: '#00d9ff',
        SECONDARY: '#7c3aed',
        ACCENT: '#06b6d4',
        SUCCESS: '#10b981',
        DANGER: '#ff6b6b',
        WARNING: '#fbbf24',
        GOLD: '#ffd700',
        TEXT_LIGHT: '#ffffff',
        TEXT_DIM: '#a8daff'
    },

    // UI Dimensions
    UI: {
        HEALTH_BAR_HEIGHT: 20,
        WAVE_STATUS_FONT_SIZE: '28px'
    },

    // Game Rules
    RULES: {
        MAX_TOWERS: 6,
        INITIAL_GOLD: 200,
        BASE_GOLD_REWARD: 10,
        INITIAL_HEALTH: 20
    }
};

export const SAFE_DOM = {
    /**
     * Safely get a DOM element with fallback logging
     */
    getElement(id) {
        const elem = document.getElementById(id);
        if (!elem) {
            console.warn(`⚠️ Missing DOM element: ${id}`);
        }
        return elem;
    },
    
    /**
     * Safely set CSS property on element
     */
    setStyle(elem, prop, value) {
        if (!elem || !elem.style) return false;
        try {
            elem.style[prop] = value;
            return true;
        } catch (e) {
            console.warn(`Failed to set ${prop} on element:`, e);
            return false;
        }
    },
    
    /**
     * Safely set display property
     */
    setDisplay(elemId, displayValue) {
        const elem = this.getElement(elemId);
        return this.setStyle(elem, 'display', displayValue);
    }
};

export const SAFE_STORAGE = {
    /**
     * Safely parse JSON from localStorage with error handling
     */
    getJSON(key, fallback = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : fallback;
        } catch (e) {
            console.error(`Failed to parse localStorage[${key}]:`, e);
            return fallback;
        }
    },
    
    /**
     * Safely store JSON to localStorage
     */
    setJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error(`Failed to store to localStorage[${key}]:`, e);
            return false;
        }
    },
    
    /**
     * Safely remove item
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error(`Failed to remove localStorage[${key}]:`, e);
            return false;
        }
    }
};

export default { GAME, SAFE_DOM, SAFE_STORAGE };
