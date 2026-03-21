export default class ProgressManager {
    static STORAGE_KEY = 'mythological_defense_progress';
    static SAVE_GAME_KEY = 'mythological_defense_save';
    static MAX_LEVELS = 4;

    static initProgress() {
        if (!localStorage.getItem(this.STORAGE_KEY)) {
            const defaultProgress = {
                levelsCompleted: [],
                totalGold: 0,
                lastPlayedLevel: 1
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(defaultProgress));
        }
    }

    static getProgress() {
        const data = localStorage.getItem(this.STORAGE_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('❌ Failed to parse progress data:', e);
            return null;
        }
    }

    static saveProgress(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('❌ Failed to save progress:', e);
        }
    }

    static completeLevel(levelNum) {
        const progress = this.getProgress();
        // make sure earlier levels are also treated as done for safety
        for (let i = 1; i < levelNum; i++) {
            if (!progress.levelsCompleted.includes(i)) {
                progress.levelsCompleted.push(i);
            }
        }
        if (!progress.levelsCompleted.includes(levelNum)) {
            progress.levelsCompleted.push(levelNum);
        }
        progress.levelsCompleted.sort((a, b) => a - b);
        progress.lastPlayedLevel = levelNum;
        this.saveProgress(progress);
        console.log(`✓ Level ${levelNum} marked as complete!`);
    }

    static isLevelCompleted(levelNum) {
        const progress = this.getProgress();
        return progress.levelsCompleted.includes(levelNum);
    }

    static isLevelUnlocked(levelNum) {
        // Progressive unlocking: unlock if previous level completed
        if (levelNum === 1) return true;
        return this.isLevelCompleted(levelNum - 1);
    }

    static getUnlockedLevels() {
        // Use MAX_LEVELS constant - easily configurable for adding new levels
        return Array.from({ length: this.MAX_LEVELS }, (_, i) => i + 1)
            .filter(level => this.isLevelUnlocked(level));
    }

    static resetProgress() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.SAVE_GAME_KEY);
        this.initProgress();
        console.log('✓ Progress reset!');
    }

    // Game save/load system
    static saveGameState(gameState) {
        try {
            localStorage.setItem(this.SAVE_GAME_KEY, JSON.stringify(gameState));
            console.log('✓ Game saved!');
        } catch (e) {
            console.error('❌ Failed to save game state:', e);
        }
    }

    static loadGameState() {
        const data = localStorage.getItem(this.SAVE_GAME_KEY);
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('❌ Failed to load game state:', e);
            return null;
        }
    }

    static hasSavedGame() {
        return localStorage.getItem(this.SAVE_GAME_KEY) !== null;
    }

    static clearSavedGame() {
        localStorage.removeItem(this.SAVE_GAME_KEY);
        console.log('✓ Saved game cleared!');
    }
}
