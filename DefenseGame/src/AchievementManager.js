export default class AchievementManager {
    static ACHIEVEMENTS = {
        first_win: {
            id: 'first_win',
            name: 'First Victory',
            desc: 'Win your first level',
            icon: '🏆'
        },
        speedrun: {
            id: 'speedrun',
            name: 'Speedrunner',
            desc: 'Complete a level in under 120 seconds',
            icon: '⚡'
        },
        no_damage: {
            id: 'no_damage',
            name: 'Perfect Defense',
            desc: 'Complete a level without taking damage',
            icon: '🛡️'
        },
        tower_master: {
            id: 'tower_master',
            name: 'Tower Master',
            desc: 'Upgrade a tower to level 5',
            icon: '📈'
        },
        rich: {
            id: 'rich',
            name: 'Rich!',
            desc: 'End a level with 500+ gold',
            icon: '💰'
        },
        all_levels: {
            id: 'all_levels',
            name: 'Legend',
            desc: 'Complete all levels',
            icon: '👑'
        }
    };

    static getAchievements() {
        const saved = localStorage.getItem('mythological_defense_achievements');
        try {
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            console.error('❌ Failed to parse achievements:', e);
            return {};
        }
    }

    static unlockAchievement(achievementId) {
        const achievements = this.getAchievements();
        if (!achievements[achievementId]) {
            achievements[achievementId] = {
                id: achievementId,
                unlockedAt: new Date().toISOString()
            };
            try {
                localStorage.setItem('mythological_defense_achievements', JSON.stringify(achievements));
                console.log(`🏆 Achievement Unlocked: ${this.ACHIEVEMENTS[achievementId]?.name || 'Unknown'}`);
                return true;
            } catch (e) {
                console.error('❌ Failed to save achievement:', e);
                return false;
            }
        }
        return false;
    }

    static isUnlocked(achievementId) {
        const achievements = this.getAchievements();
        return !!achievements[achievementId];
    }

    static getUnlockedCount() {
        return Object.keys(this.getAchievements()).length;
    }
}
