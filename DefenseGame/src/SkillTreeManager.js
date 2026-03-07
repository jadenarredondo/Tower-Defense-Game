export default class SkillTreeManager {
    // Define all available skills
    static SKILLS = {
        damage_boost: {
            name: 'Damage Boost',
            description: '+10% tower damage',
            icon: '⚔️',
            maxLevel: 5,
            costPerLevel: (level) => Math.pow(2, level - 1), // 1, 2, 4, 8, 16
            effect: (level) => 1 + (level * 0.15) // 1.15x, 1.3x, 1.45x, 1.6x, 1.75x
        },
        gold_multiplier: {
            name: 'Gold Collector',
            description: '+10% gold per level',
            icon: '💰',
            maxLevel: 5,
            costPerLevel: (level) => Math.pow(2, level - 1),
            effect: (level) => 1 + (level * 0.15) // 1.15x, 1.3x, etc
        },
        attack_speed: {
            name: 'Quick Draw',
            description: '+8% attack speed',
            icon: '⚡',
            maxLevel: 4,
            costPerLevel: (level) => Math.pow(2, level - 1),
            effect: (level) => 1 + (level * 0.12) // 1.12x, 1.24x, 1.36x, 1.48x
        },
        cost_reduction: {
            name: 'Economical',
            description: '-5% tower cost',
            icon: '🏧',
            maxLevel: 4,
            costPerLevel: (level) => Math.pow(2, level - 1),
            effect: (level) => 1 - (level * 0.08) // 0.92x, 0.84x, 0.76x, 0.68x cost
        },
        tower_range: {
            name: 'Far Sight',
            description: '+10% tower range',
            icon: '🎯',
            maxLevel: 3,
            costPerLevel: (level) => Math.pow(2, level - 1),
            effect: (level) => 1 + (level * 0.1) // 1.1x, 1.2x, 1.3x
        }
    };

    static SKILL_POINTS_PER_LEVEL = 3; // Earn 3 points per level won

    static initSkills() {
        if (!localStorage.getItem('tower_defense_skills')) {
            const defaultSkills = {};
            Object.keys(this.SKILLS).forEach(skillId => {
                defaultSkills[skillId] = { level: 0 };
            });
            localStorage.setItem('tower_defense_skills', JSON.stringify({
                availablePoints: 0,
                skills: defaultSkills,
                totalPointsEarned: 0
            }));
        }
    }

    static getSkillData() {
        const data = localStorage.getItem('tower_defense_skills');
        try {
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('❌ Failed to parse skill data:', e);
            return null;
        }
    }

    static saveSkillData(data) {
        try {
            localStorage.setItem('tower_defense_skills', JSON.stringify(data));
        } catch (e) {
            console.error('❌ Failed to save skill data:', e);
        }
    }

    // Award points for completing a level
    static addSkillPoints(numPoints) {
        const skillData = this.getSkillData();
        skillData.availablePoints += numPoints;
        skillData.totalPointsEarned += numPoints;
        this.saveSkillData(skillData);
    }

    // Purchase a skill level
    static purchaseSkill(skillId, skillData) {
        if (!this.SKILLS[skillId]) return false;
        
        const skillDef = this.SKILLS[skillId];
        const currentLevel = skillData.skills[skillId].level;
        
        // Check if max level reached
        if (currentLevel >= skillDef.maxLevel) return false;
        
        // Check if enough points
        const cost = skillDef.costPerLevel(currentLevel + 1);
        if (skillData.availablePoints < cost) return false;
        
        // Purchase
        skillData.availablePoints -= cost;
        skillData.skills[skillId].level += 1;
        this.saveSkillData(skillData);
        return true;
    }

    // Get all active skill modifiers as an object
    static getActiveModifiers() {
        const skillData = this.getSkillData();
        if (!skillData) return {};
        
        const modifiers = {
            damageMultiplier: 1,
            goldMultiplier: 1,
            attackSpeedMultiplier: 1,
            costMultiplier: 1,
            rangeMultiplier: 1
        };

        if (skillData.skills.damage_boost.level > 0) {
            modifiers.damageMultiplier = this.SKILLS.damage_boost.effect(skillData.skills.damage_boost.level);
        }
        if (skillData.skills.gold_multiplier.level > 0) {
            modifiers.goldMultiplier = this.SKILLS.gold_multiplier.effect(skillData.skills.gold_multiplier.level);
        }
        if (skillData.skills.attack_speed.level > 0) {
            modifiers.attackSpeedMultiplier = this.SKILLS.attack_speed.effect(skillData.skills.attack_speed.level);
        }
        if (skillData.skills.cost_reduction.level > 0) {
            modifiers.costMultiplier = this.SKILLS.cost_reduction.effect(skillData.skills.cost_reduction.level);
        }
        if (skillData.skills.tower_range.level > 0) {
            modifiers.rangeMultiplier = this.SKILLS.tower_range.effect(skillData.skills.tower_range.level);
        }

        return modifiers;
    }

    static resetSkills() {
        localStorage.removeItem('tower_defense_skills');
        this.initSkills();
    }
}
