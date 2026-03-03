# Testing Degradation Prevention Guide

## Overview
This document explains how to safely add new features without breaking existing functionality.

## ✅ Fixes Applied

### 1. Constants File Created
**File**: `src/Constants.js`

Centralizes all configuration:
- Scene keys (use instead of string literals)
- DOM element IDs
- Color theme
- Game rules
- Safety helper functions

**Before**:
```javascript
// Hard-coded everywhere
this.scene.launch('LoseScene');
const uiBar = document.getElementById('game-ui');
```

**After**:
```javascript
import { GAME, SAFE_DOM } from './Constants.js';
this.scene.launch(GAME.SCENES.LOSE);
SAFE_DOM.setDisplay(GAME.DOM.GAME_UI, 'flex');
```

---

### 2. JSON Parsing Protected
**Files**: `ProgressManager.js`, `AchievementManager.js`

Added try-catch to all JSON operations:
```javascript
// Catches corrupted localStorage data gracefully
static getProgress() {
    try {
        const data = localStorage.getItem(this.STORAGE_KEY);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Failed to parse progress:', e);
        return null;
    }
}
```

---

### 3. Dynamic Level System
**File**: `ProgressManager.js`

Changed from hard-coded to configurable:
```javascript
// OLD - Would need code change to add Level 4
static getUnlockedLevels() {
    return [1, 2, 3].filter(level => this.isLevelUnlocked(level));
}

// NEW - Just update MAX_LEVELS
static MAX_LEVELS = 3;  // Change to 4, 5, 6... automatically works
static getUnlockedLevels() {
    return Array.from({ length: this.MAX_LEVELS }, (_, i) => i + 1)
        .filter(level => this.isLevelUnlocked(level));
}
```

---

### 4. Enemy Validation Checks
**File**: `Tower.js`

Added defensive checks before accessing enemy properties:
```javascript
// BEFORE - Could crash if enemy destroyed mid-attack
enemy.hp -= this.damage;
enemy.healthBar.setScale(enemy.hp / enemy.maxHp, 1);

// AFTER - Safely validates
if (!enemy?.active || !enemy.healthBar) return;
enemy.hp -= this.damage;
enemy.healthBar.setScale(Math.max(0, enemy.hp / enemy.maxHp), 1);
```

---

### 5. Array Bounds Checking
**File**: `Level3Scene.js`

Protected direct array access:
```javascript
// BEFORE - Could access undefined
this.path.push(pathNodes[pathNodes.length-1]);

// AFTER - Validates first
if (pathNodes && pathNodes.length > 0) {
    this.path.push(pathNodes[pathNodes.length-1]);
}
```

---

## 📋 Safe Feature Addition Checklist

### Adding a New Level (Level 4+)

- [ ] Update `ProgressManager.MAX_LEVELS = 4`
- [ ] Create new scene file: `Level4Scene.js`
- [ ] Add to `game.js` scene array
- [ ] Add to `GAME.SCENES` in Constants
- [ ] Add to `GAME.LEVEL_KEYS` in Constants
- [ ] Test level unlock progression

### Adding a New Tower Type

- [ ] Add tower config to `towerTypes` object with all required properties:
  ```javascript
  newTower: { 
    name: 'NewTower', 
    image: 'tower_key',
    cost: 50,
    damage: 1,
    range: 200,
    attackSpeed: 500,
    // ... all other required fields
  }
  ```
- [ ] Verify tower image asset exists
- [ ] Validate tower placement logic
- [ ] Test tower selection UI

### Modifying UI Layout

- [ ] Change HTML IDs? Update `GAME.DOM` in Constants
- [ ] Update DOM reference locations in all scene files
- [ ] Test in `setupAudioControls()`, cleanup in shutdown
- [ ] Verify responsive design still works

### Adding a New Audio Sound

- [ ] Add method to `AudioManager` with proper null checks:
  ```javascript
  playNewSound() {
    if (!this.canPlayAudio()) return;
    // ... sound generation
  }
  ```
- [ ] Add corresponding cleanup in scene shutdown
- [ ] Test with audio disabled

### Changing Game Colors/Theme

- [ ] Update color values in `GAME.COLORS` in Constants
- [ ] Remove hard-coded colors from code
- [ ] Import colors from Constants instead
- [ ] Test all UI elements render correctly

---

## 🚫 DO NOT

### ❌ Hard-Code Scene Keys
```javascript
// WRONG - Will break if key changes
this.scene.launch('LoseScene');

// RIGHT - Use constants
this.scene.launch(GAME.SCENES.LOSE);
```

### ❌ Access Enemy Properties Without Checking
```javascript
// WRONG - Crashes if enemy is null/destroyed
enemy.hp -= this.damage;
enemy.healthBar.setScale(enemy.hp / enemy.maxHp, 1);

// RIGHT - Validate first
if (!enemy?.active || !enemy.healthBar) return;
enemy.hp -= this.damage;
```

### ❌ Parse JSON Without Try-Catch
```javascript
// WRONG - Crashes on corrupted data
const data = JSON.parse(localStorage.getItem(key));

// RIGHT
try {
    const data = JSON.parse(localStorage.getItem(key));
} catch (e) {
    console.error('Failed to parse:', e);
}
```

### ❌ Access DOM Without Null Checks
```javascript
// WRONG - Could be null
document.getElementById('some-id').style.display = 'flex';

// RIGHT
const elem = SAFE_DOM.getElement(GAME.DOM.UI_ELEMENT);
SAFE_DOM.setStyle(elem, 'display', 'flex');
```

### ❌ Hard-Code Level Numbers
```javascript
// WRONG - Must change code to add Level 4
if (levelNum > 3) { ... }

// RIGHT - Use constant
if (levelNum > ProgressManager.MAX_LEVELS) { ... }
```

### ❌ Access Arrays Without Bounds Checks
```javascript
// WRONG - Could be undefined
this.path.push(pathNodes[pathNodes.length - 1]);

// RIGHT
if (pathNodes?.length > 0) {
    this.path.push(pathNodes[pathNodes.length - 1]);
}
```

---

## 🔍 Testing Before New Features

Run these checks before committing new code:

1. **Level Transition Test**
   - Complete one level
   - Verify next level loads
   - Check enemies spawn correctly
   - Verify no console errors

2. **Tower Placement Test**
   - Place all tower types
   - Upgrade each tower
   - Sell towers
   - Verify gold calculations

3. **DOM Integrity Test**
   - Open DevTools
   - Search for console errors
   - Verify all UI elements render
   - Test audio on/off toggle

4. **Save Data Test**
   - Complete a level
   - Refresh page
   - Verify progress saved
   - Check localStorage isn't corrupted

5. **Memory Leak Test**
   - Complete 3 full levels
   - Check browser DevTools memory
   - Verify no growing object leaks
   - Check event listeners cleaned up

---

## 🛠️ Debugging Tools

### Enable Debug Mode
```javascript
// In create() method
this.debug = true;  // Shows extra logging
```

### Check Scene Health
```javascript
// In browser console
// Verify scene is active
Phaser.Scenes.Systems.Events
```

### Validate Game State
```javascript
// In browser console
// Check gold, health, enemies
console.log({
    gold: game.scene.getScene('MainScene').gold,
    health: game.scene.getScene('MainScene').playerHealth,
    enemiesAlive: game.scene.getScene('MainScene').enemiesAlive
});
```

---

## 📊 Common Breaking Points

| Change | Risk | Mitigation |
|--------|------|-----------|
| Add level | HIGH | Use MAX_LEVELS constant |
| Add tower type | MEDIUM | Validate tower config complete |
| Change DOM IDs | HIGH | Use GAME.DOM constants |
| Add audio | MEDIUM | Check audioContext null before use |
| Modify colors | LOW | Use GAME.COLORS constants |
| Update paths | MEDIUM | Add bounds checks |
| Modify waves | MEDIUM | Validate wave data exists |
| New enemy type | MEDIUM | Validate all properties before access |

---

## 📞 Emergency Fixes

If a feature breaks the game:

1. Check browser console for errors
2. Look for undefined property accesses
3. Verify new code has null checks
4. Check Constants are being used
5. Review shutdown handlers for cleanup
6. Test with fresh localStorage (clear cache)
7. Check scene keys match GAME.SCENES

---

## Summary

✅ **You can safely add features if you:**
- Use Constants.js for all configuration
- Add null/undefined checks before property access
- Wrap JSON operations in try-catch
- Clean up event listeners in shutdown
- Use dynamic constants instead of magic numbers
- Test level transitions and save/load

❌ **Don't:**
- Hard-code values anywhere
- Skip validation checks
- Forget to clean up listeners
- Assume objects exist
- Parse JSON without error handling
