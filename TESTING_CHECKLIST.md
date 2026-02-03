# Testing Checklist for Boomerang and Game Over Fixes

## How to Test

1. Open `index.html` in a web browser
2. Open the browser's Developer Console (F12) to see debug logs

## Test 1: Boomerang Functionality

### Setup
1. Start the game
2. Select the **🪃 ブーメラン (Boomerang)** weapon
3. Let enemies spawn

### Test Steps
- [ ] ✅ Throw boomerang (should throw automatically at enemies)
- [ ] ✅ Boomerang hits enemies on outward path
- [ ] ✅ Boomerang reaches max distance and turns around
- [ ] ✅ Boomerang returns to player
- [ ] ✅ Boomerang hits enemies on return path
- [ ] ✅ Boomerang reaches player and disappears
- [ ] ✅ **Game does NOT freeze** when boomerang returns
- [ ] ✅ Wait 0.7 seconds (700ms)
- [ ] ✅ Next boomerang throws successfully

### Expected Console Output
```
Weapon created successfully: Boomerang {...}
```

### What to Check
- Game should continue running smoothly after boomerang returns
- No freezing or hanging
- Next boomerang should throw after cooldown
- Frame rate should stay consistent

## Test 2: Game Over and Return to Menu

### Setup
1. Start the game with any weapon
2. Let enemies hit you until HP reaches 0
3. Game Over screen should appear

### Test Steps
- [ ] ✅ Game Over screen displays with stats (time, level, kills)
- [ ] ✅ Click "メニューに戻る" (Return to Menu) button
- [ ] ✅ Game Over screen disappears
- [ ] ✅ Weapon selection screen appears
- [ ] ✅ Three weapon cards are visible (⚔️ 剣, 🪃 ブーメラン, ✨ 魔法)
- [ ] ✅ Hover over weapon cards - they should highlight
- [ ] ✅ Cursor changes to pointer when hovering over cards
- [ ] ✅ Click a weapon card to select it
- [ ] ✅ Game starts successfully with selected weapon

### Expected Console Output
```
Game Over - Time: X.Xs, Level: X, Kills: X
=== Resetting game ===
Game reset complete
=== Setting up weapon selection ===
Loading weapons from plugin system...
Plugin weapons found: [...]
Available weapons for selection: [...]
Weapon selection data prepared: [...]
State changed to: weapon_select
Weapon clicked: sword (or boomerang, or magic)
=== Selecting weapon: sword ===
=== Starting game ===
Weapon created successfully: [...]
```

### What to Check
- No console errors
- Weapon selection is fully functional
- Mouse events work correctly (hover and click)
- Game starts properly after weapon selection

## Test 3: Multiple Game Over Cycles

### Test Steps
1. Play game → die → return to menu
2. Select weapon → play game → die → return to menu
3. Repeat 2-3 times

### What to Check
- [ ] ✅ Each cycle works correctly
- [ ] ✅ No duplicate event listeners (check by looking for multiple responses to single click)
- [ ] ✅ No memory leaks or performance degradation
- [ ] ✅ Console logs show proper cleanup each time

## Known Issues (Should NOT Occur)

### ❌ Boomerang Freeze (FIXED)
- **Symptom**: Game freezes when boomerang returns to player
- **Cause**: Time unit mismatch (undefined vs milliseconds)
- **Fix**: Use Date.now() consistently

### ❌ Weapon Selection Freeze (FIXED)
- **Symptom**: After game over, weapon cards don't respond to clicks
- **Cause**: Stale event listeners not cleaned up
- **Fix**: resetGame() method cleans up listeners before re-adding

## Debug Commands

Open browser console and try these:

```javascript
// Check boomerang state
game.weapons[0].lastReturnTime
game.weapons[0].cooldownAfterReturn
game.weapons[0].activeBoomerangs

// Check game state
game.state
game.weaponSelectionData
game.hoveredWeaponIndex

// Check event listeners (should be present only when in weapon_select state)
game.weaponSelectionMouseMove
game.weaponSelectionClick
```

## Success Criteria

✅ All tests pass without errors  
✅ No freezing or hanging behavior  
✅ Smooth gameplay experience  
✅ Console shows expected log messages  
✅ No JavaScript errors in console
