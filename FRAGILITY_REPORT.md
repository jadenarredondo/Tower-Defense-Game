# Code Fragility Report - Defensive Patterns Needed

## 🚨 CRITICAL FRAGILE PATTERNS

### 1. **Hard-Coded Level Numbers** (Breaking Change Risk: HIGH)
**Files**: `ProgressManager.js`, `AchievementManager.js`
**Issue**: `getUnlockedLevels()` returns `[1, 2, 3]` - adding Level 4 requires code changes
```javascript
// FRAGILE
static getUnlockedLevels() {
    return [1, 2, 3].filter(level => this.isLevelUnlocked(level));
}
```
**Fix**: Use MAX_LEVELS constant
```javascript
static getUnlockedLevels() {
    const maxLevels = 3; // Configuration
    return Array.from({length: maxLevels}, (_, i) => i + 1)
        .filter(level => this.isLevelUnlocked(level));
}
```

---

### 2. **Unvalidated JSON Parsing** (Breaking Change Risk: HIGH)
**Files**: `ProgressManager.js`, `AchievementManager.js`
**Issue**: `JSON.parse()` called without try-catch - corrupted localStorage crashes game
```javascript
// FRAGILE
static getProgress() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;  // Could throw
}
```
**Fix**: Add error handling
```javascript
static getProgress() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    try {
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to parse progress:', e);
        return null;
    }
}
```

---

### 3. **No DOM Element Validation** (Breaking Change Risk: MEDIUM)
**Files**: All scene files (`MainScene.js`, `Level2Scene.js`, `Level3Scene.js`, `MenuScene.js`)
**Issue**: DOM selectors used without null checks before property access
```javascript
// FRAGILE - No check if element exists
const uiBar = document.getElementById('game-ui');
if (uiBar) uiBar.style.display = 'flex';  // What if selector changes?
```
**Fix**: Use safe accessors
```javascript
// SAFER
const uiBar = document.getElementById('game-ui');
uiBar?.style?.setProperty?.('display', 'flex');
```

---

### 4. **Direct Array Index Without Bounds Check** (Breaking Change Risk: MEDIUM)
**Files**: `Level3Scene.js` (line 214)
**Issue**: Direct access to `pathNodes[pathNodes.length-1]` assumes array non-empty
```javascript
// FRAGILE
this.path.push(pathNodes[pathNodes.length-1]);  // Could be undefined
```
**Fix**: Add validation
```javascript
// SAFER
if (pathNodes.length > 0) {
    this.path.push(pathNodes[pathNodes.length-1]);
}
```

---

### 5. **MenuScene Button Grid Hard-Coded** (Breaking Change Risk: HIGH)
**Files**: `MenuScene.js` (line 97-104)
**Issue**: Button layout assumes exactly 5 buttons in 2x2 grid + 1 exit
```javascript
// FRAGILE
if (idx < 4) {
    const row = Math.floor(idx / 2);
    const col = idx % 2;  // Assumes exactly 2 columns
} else {
    // Exit button centered on its own row
}
```
**Fix**: Use configuration-driven layout
```javascript
const buttonLayout = { columns: 2, spacing: 120 }; // Config
const row = Math.floor(idx / buttonLayout.columns);
const col = idx % buttonLayout.columns;
```

---

### 6. **Colors Hard-Coded in Multiple Places** (Breaking Change Risk: MEDIUM)
**Files**: `MenuScene.js`, `EffectsManager.js`, `Tower.js`, and others
**Issue**: Colors defined inline in many places - changing theme requires grep+replace
```javascript
// FRAGILE
const colors = ['#00d9ff', '#7c3aed', '#06b6d4'];
const color = colors[idx % colors.length];
```
**Fix**: Use constants file
```javascript
// colors.js
export const COLORS = {
    primary: '#00d9ff',
    secondary: '#7c3aed',
    accent: '#06b6d4'
};
```

---

### 7. **No Enemy Existence Check Before Property Access** (Breaking Change Risk: HIGH)
**Files**: `MainScene.js`, `Level2Scene.js`, `Level3Scene.js`
**Issue**: Enemy properties accessed without checking if enemy still exists
```javascript
// FRAGILE - In attack() method
enemy.hp -= this.damage;
enemy.healthBar.setScale(enemy.hp / enemy.maxHp, 1);  // What if enemy.healthBar is null?
```
**Fix**: Add validations
```javascript
if (enemy && enemy.active && enemy.healthBar) {
    enemy.hp -= this.damage;
    enemy.healthBar.setScale(Math.max(0, enemy.hp / enemy.maxHp), 1);
}
```

---

### 8. **Brittle Scene Transition Keys** (Breaking Change Risk: HIGH)
**Files**: `game.js` - scene array definition
**Issue**: Scene keys must match scene `key` property - typo causes silent failure
```javascript
// FRAGILE - String duplication
scene: [MenuScene, LevelSelectScene, ..., LoseScene]
// And in MainScene:
this.scene.launch('LoseScene');
// If string mismatch, scene won't launch - hard to debug
```
**Fix**: Use scene constants
```javascript
const SCENES = {
    MENU: 'MenuScene',
    LEVEL_1: 'MainScene',
    LOSE: 'LoseScene'
};
```

---

### 9. **Wave Configuration Fragility** (Breaking Change Risk: MEDIUM)
**Files**: `Level2Scene.js`, `Level3Scene.js`
**Issue**: Wave array accessed without bounds checking, error messages don't say which level
```javascript
// FRAGILE - In startWave()
const wave = this.waves[this.currentWave];  // Could be undefined
const isFinalWave = this.currentWave >= this.waves.length - 1;
```
**Fix**: Add defensive checks
```javascript
if (!Array.isArray(this.waves) || this.currentWave >= this.waves.length) {
    console.error(`Invalid wave #${this.currentWave} for level`);
    return;
}
```

---

### 10. **Menu Button Elements Array Mutation** (Breaking Change Risk: MEDIUM)
**Files**: `MenuScene.js` (line 150-250)
**Issue**: `buttonElements` array has objects with `null` fields - `.forEach()` assumes all fields exist
```javascript
// FRAGILE
buttonElements.push({ baseY, buttonBox, glowBox, ..., isTagline: true });
// Later:
buttonElements.forEach(elem => {
    if (!elem.isTagline) {
        elem.buttonBox.setY(newY);  // What if buttonBox is null?
    }
});
```
**Fix**: Use consistent structure
```javascript
if (elem.buttonBox && !elem.isTagline) {
    elem.buttonBox.setY(newY);
}
```

---

### 11. **Audio Context Null Without Safe Calls** (Breaking Change Risk: MEDIUM)
**Files**: `AudioManager.js`
**Issue**: Every sound method checks `if (!this.audioContext)` - brittle pattern
```javascript
// FRAGILE - Repeated pattern everywhere
playTowerAttack() {
    if (!this.audioContext || this.isMuted) return;
    // ...
}
```
**Fix**: Create helper method
```javascript
canPlayAudio() {
    return this.audioContext?.state === 'running' && !this.isMuted;
}
// Then:
if (!this.canPlayAudio()) return;
```

---

### 12. **Tower Type Reference Fragility** (Breaking Change Risk: MEDIUM)
**Files**: `MainScene.js`, `Level2Scene.js`, tower upgrade logic
**Issue**: Tower types accessed as `this.towerTypes[this.selectedTowerType]` with no validation
```javascript
// FRAGILE
const towerConfig = this.towerTypes[this.selectedTowerType];
if (this.gold >= towerConfig.cost) {  // What if towerConfig is undefined?
```
**Fix**: Add validation
```javascript
const towerConfig = this.towerTypes[this.selectedTowerType];
if (!towerConfig) {
    console.error(`Unknown tower type: ${this.selectedTowerType}`);
    return;
}
```

---

### 13. **Assumed DOM IDs Without Fallback** (Breaking Change Risk: HIGH)
**Files**: All scene files
**Issue**: Specific DOM IDs required: `game-ui`, `tower-selection-panel`, `mute-btn`, etc.
```javascript
// FRAGILE
const uiBar = document.getElementById('game-ui');
if (uiBar) uiBar.style.display = 'flex';
// No fallback if HTML structure changes
```
**Fix**: Create DOM config file with validation
```javascript
const DOM_IDS = {
    UI_BAR: 'game-ui',
    TOWER_PANEL: 'tower-selection-panel'
};

function getElement(id) {
    const elem = document.getElementById(DOM_IDS[id]);
    if (!elem) console.warn(`Missing DOM element: ${id}`);
    return elem;
}
```

---

## 🛠️ RECOMMENDED FIXES PRIORITY

| Priority | Pattern | Impact | Files Affected |
|----------|---------|--------|-----------------|
| 🔴 CRITICAL | Hard-coded level numbers | Can't add levels | ProgressManager, Game |
| 🔴 CRITICAL | JSON parse without error handling | Crash on corrupted save | ProgressManager, Achievement |
| 🔴 CRITICAL | Scene key string literals | Silent failures | All scenes |
| 🟠 HIGH | No enemy validation | Crashes during gameplay | Tower, Level scenes |
| 🟠 HIGH | Hard-coded DOM IDs | UI breaks on HTML change | All scenes |
| 🟠 HIGH | MenuScene button layout | Can't modify menu structure | MenuScene |
| 🟡 MEDIUM | Tower type validation | Crashes if type undefined | MainScene |
| 🟡 MEDIUM | Button array with null fields | NPE on menu update | MenuScene |
| 🟡 MEDIUM | Direct array index access | Potential undefined access | Level3Scene |
| 🟢 LOW | Colors hard-coded | Theme changes difficult | Multiple |
| 🟢 LOW | Audio context checks | Repetitive code | AudioManager |
| 🟢 LOW | Wave config validation | Error messages unclear | Level scenes |

---

## 📋 TESTING DEGRADATION RISKS

Adding features could break:
1. ✅ **New levels** - Breaks if level number > 3 not handled
2. ✅ **New tower types** - Breaks if type not in towerTypes object
3. ✅ **DOM changes** - Breaks if HTML IDs change
4. ✅ **New buttons** - Breaks MenuScene grid layout
5. ✅ **Save data migration** - Breaks if JSON format changes
6. ✅ **Audio changes** - Could fail silently if audioContext null
7. ✅ **New waves** - Breaks if wave data malformed
8. ✅ **Enemy variations** - Breaks if enemy missing properties

---

## ✅ NEXT STEPS

1. Create constants files for hard-coded values
2. Add input validation to all public methods
3. Create helper functions for common patterns (DOM access, audio checks)
4. Add configuration objects instead of magic numbers
5. Wrap JSON operations in try-catch
6. Document assumed DOM structure
7. Add defensive programming to enemy/tower access
