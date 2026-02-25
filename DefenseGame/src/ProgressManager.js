export default class ProgressManager {
    static STORAGE_KEY = 'mythological_defense_progress';
    static SAVE_GAME_KEY = 'mythological_defense_save';

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
        return data ? JSON.parse(data) : null;
    }

    static saveProgress(data) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
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
        return [1, 2, 3].filter(level => this.isLevelUnlocked(level));
    }

    static resetProgress() {
        localStorage.removeItem(this.STORAGE_KEY);
        localStorage.removeItem(this.SAVE_GAME_KEY);
        this.initProgress();
        console.log('✓ Progress reset!');
    }

    // Game save/load system
    static saveGameState(gameState) {
        localStorage.setItem(this.SAVE_GAME_KEY, JSON.stringify(gameState));
        console.log('✓ Game saved!');
    }

    static loadGameState() {
        const data = localStorage.getItem(this.SAVE_GAME_KEY);
        return data ? JSON.parse(data) : null;
    }

    static hasSavedGame() {
        return localStorage.getItem(this.SAVE_GAME_KEY) !== null;
    }

    static clearSavedGame() {
        localStorage.removeItem(this.SAVE_GAME_KEY);
        console.log('✓ Saved game cleared!');
    }
}
