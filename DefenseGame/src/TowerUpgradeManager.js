/**
 * TowerUpgradeManager - Handles tower upgrades and modifications
 */
export default class TowerUpgradeManager {
    constructor(scene, tower) {
        this.scene = scene;
        this.tower = tower;
        this.selectedUpgrade = null;
        this.upgrades = {
            damage: { name: 'Boost Damage', cost: 75, boost: 2 },
            range: { name: 'Extend Range', cost: 60, boost: 50 },
            speed: { name: 'Faster Fire', cost: 80, boost: -100 } // negative = faster (lower delay)
        };
    }

    /**
     * Apply upgrade to tower
     */
    applyUpgrade(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        
        if (!upgrade) return false;
        if (this.scene.gold < upgrade.cost) return false;

        this.scene.gold -= upgrade.cost;
        
        if (upgradeType === 'damage') {
            this.tower.damage += upgrade.boost;
        } else if (upgradeType === 'range') {
            this.tower.range += upgrade.boost;
            this.tower.rangeCircle.setRadius(this.tower.range);
        } else if (upgradeType === 'speed') {
            this.tower.attackSpeed = Math.max(100, this.tower.attackSpeed + upgrade.boost);
            if (this.tower.timer) {
                this.tower.timer.destroy();
                this.tower.timer = this.scene.time.addEvent({
                    delay: this.tower.attackSpeed,
                    loop: true,
                    callback: this.tower.attack,
                    callbackScope: this.tower
                });
            }
        }

        if (this.scene.debug) console.log(`✨ Tower upgraded! ${upgrade.name}`);
        if (this.scene.audioManager) {
            this.scene.audioManager.playUpgrade();
        }
        if (this.scene.effectsManager) {
            this.scene.effectsManager.flash(200, 0x00ff00, 0.3);
        }

        return true;
    }

    /**
     * Get cost for an upgrade
     */
    getCost(upgradeType) {
        return this.upgrades[upgradeType]?.cost || 0;
    }

    /**
     * Check if player can afford upgrade
     */
    canAfford(upgradeType) {
        return this.scene.gold >= this.getCost(upgradeType);
    }
}
