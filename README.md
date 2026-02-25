# Mythological Defense - Tower Defense Game

A modern, feature-rich tower defense game built with Phaser 3, featuring immersive audio, stunning visuals, and engaging gameplay mechanics.

### Core Gameplay
- **Wave-Based Combat**: Face increasingly difficult waves of enemies
- **Tower System**: Place and upgrade three different tower types with unique abilities
- **Resource Management**: Earn gold by defeating enemies and spend it strategically
- **Progressive Difficulty**: More towers unlock as waves advance

### Sound & Audio
- **Synthetic Audio Generation**: Cross-browser compatible Web Audio API sounds
- **Dynamic Sound Effects**:
  - Tower placement and upgrade sounds
  - Enemy attack and death sounds
  - Gold collection audio feedback
  - Wave start fanfares
  - Victory and defeat themes
- **Volume Control**: Individual master volume slider with mute button
- **Audio Context Management**: Automatically resumes audio after user interaction

### Visual Enhancements
- **Modern UI Design**: Gradient backgrounds, glass morphism effects, smooth animations
- **Particle Effects**:
  - Kill explosion particles
  - Gold collection popups with shadows
  - Confetti bursts on enemy defeats
  - Damage number displays
- **Tower Visuals**:
  - Flash effects on attack
  - Range indicator glow
  - Size scaling on upgrades
  - Sprite rotation animations
- **Health & Status Animations**:
  - Smooth health bar transitions
  - Gold counter pulse effects
  - Wave status updates
  - Tower count indicators

### Tower Types

**Basic Tower** (Cost: 50 gold)
- Standard all-around tower
- Good damage and attack speed
- Average range

**Power Tower** (Cost: 100 gold)
- High damage output
- Slower attack speed
- Slightly shorter range
- Aggressive gameplay style

**Sniper Tower** (Cost: 80 gold)
- Extended attack range
- Single-target specialist
- Slow fire rate but high accuracy
- Best for precision play

### Controls

**Tower Placement**
- Click on green zones to place towers
- Click existing tower to upgrade it
- Number keys 1-3 to select tower type

**Camera**
- Drag to pan the map
- Mouse wheel to zoom in/out (0.4x to 2x)
- Arrow keys for navigation

**Game Speed**
- Buttons in top bar: 0.5x, 1x, 2x, 4x
- Adjust game speed on the fly

**Pause/Resume**
- Press ESC or click PAUSE button
- View stats, save progress, or return to menu

### Audio Controls
- **Mute Button**: Icon in top-right to toggle sound
- **Volume Slider**: Fine-tune master volume (0-100%)
- Controls persist across gameplay sessions

### Gold System
- **Earn Gold**:
  - Enemy kills: 10 + (10 × current_wave) gold
  - Farm generation: 2 gold per second
- **Spend Gold**:
  - Tower placement: 50-100 gold
  - Tower upgrade: 50% of base tower cost

### Progression
- **5 Waves** of increasing difficulty
- **Wave Scaling**:
  - Enemy HP increases each wave
  - Movement speed increases
  - More enemies spawn
  - Gold rewards increase
- **Difficulty Options**: Easy, Normal, Hard modes
- **Permanent Upgrades**: Unlock bonuses as you complete levels

### Win/Lose Conditions
- **Win**: Survive all 5 waves with health > 0
- **Lose**: Health reaches 0
- **30-second wave timer**: Waves automatically reset

### Code Architecture
- **Modular Design**: Separate managers for audio, effects, and configuration
- **Scene-Based**: Clean separation of menus, levels, and UI
- **Event System**: Phaser event handling for loose coupling
- **Progress Persistence**: LocalStorage-based save system

### Performance
- **Optimized Graphics**: NEAREST filter for pixel-perfect rendering
- **Efficient Rendering**: Depth-based layering
- **Memory Management**: Proper object cleanup and destruction
- **Audio Optimization**: Synthetic sound generation (no heavy audio files)

### Browser Compatibility
- **Modern Web Standards**: ES6 modules, Web Audio API
- **Fallback Audio**: Graceful degradation if audio unavailable
- **Responsive Design**: Works on various screen sizes
- **Touch Support**: Mobile-friendly controls (with appropriate sizing)

## Scenes

1. **MenuScene**: Main menu with options
2. **LevelSelectScene**: Choose which level to play
3. **DifficultySelectScene**: Pick difficulty
4. **TutorialScene**: Learn the basics
5. **MainScene**: Level 1 gameplay
6. **Level2Scene**: Level 2 (extended)
7. **Level3Scene**: Level 3 (hard mode)
8. **PauseScene**: Pause menu with stats
9. **SettingsScene**: Game settings
10. **WinScene**: Victory screen
11. **LoseScene**: Defeat screen

## Getting Started

1. Open `index.html` in a modern web browser
2. Click "PLAY" to begin
3. Select a level and difficulty
4. Place towers and defeat enemies
5. Complete all 5 waves to win!

### Tips for Playing
- **Early game**: Save gold for power towers (higher damage)
- **Mid game**: Upgrade existing towers (costs 50% of base price)
- **Late game**: Mix tower types - use snipers for range, power for damage
- **Speed control**: Use 2x speed when learning, 4x speed for quick runs
- **Zone placement**: Strategic tower placement covers paths better

## Features Added This Week

**AudioManager** - Web Audio API-based sound system
**Synthetic Sound Generation** - No external audio files needed
**EffectsManager** - Comprehensive visual effects system
**Enhanced Particle Effects** - Explosions, confetti, damage numbers
**Modern UI** - Glass morphism, gradients, smooth animations
**Audio Controls** - Mute button and volume slider
**Visual Feedback** - Tower attacks, enemy knockback, gold animations
**GameConfig** - Centralized configuration system
**Error Handling** - Graceful degradation and fallbacks
**Performance Optimization** - Efficient rendering and audio buffering

## Sound Effects
- Tower Attack: Quick descending pitch
- Enemy Killed: Explosive burst
- Gold Collected: Ascending notes (C-E-G chord)
- Wave Start: Triumphant fanfare
- Victory: Victorious chord progression
- Defeat: Descending sad notes
- Upgrade: Encouraging ascending tones
- Click: Interface feedback sound

## Color Scheme
- Primary: Cyan (#64d5ff)
- Secondary: Purple (#7c3aed)
- Accent: Gold (#FFD700)
- Health: Green (#10b981)
- Danger: Red (#ef4444)
- Background: Dark blue (#0b102a)

## Future Enhancements
- Special tower abilities
- Enemy variety (different types)
- Upgrade paths (choose tower specialization)
- Leaderboard system
- Customizable tower colors
- Power-ups and bonuses
- Multiplayer mode
