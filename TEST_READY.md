# TEST_READY: Dual Track E2E Test Suite Manifest

**Status**: READY FOR VERIFICATION & CONTINUOUS PROGRESSION  
**Last Updated**: 2026-11-14T05:40:00Z  
**Author**: E2E Test Writer (`test_writer_e2e_2`)  
**Integrity Mode**: Development (Zero Cheating / Genuine Assertions)

---

## 1. Quick Runner Commands

### Track 1: Backend & WebSocket Test Suite
```bash
# Verify current completed Milestone M1 (100% Pass)
python test_e2e_r1_r7.py --milestone M1

# Full Multi-Milestone E2E Suite (Probes M1-M4)
python test_e2e_r1_r7.py
```

### Track 2: Frontend & Reactive Component Test Suite
```bash
# Verify current completed Milestone M1 (100% Pass)
cd top-100-ui && node test_e2e_frontend.mjs --milestone M1

# Full Multi-Milestone E2E Suite (Probes M1-M4)
cd top-100-ui && node test_e2e_frontend.mjs
```

### Build & Compilation Verification
```bash
cd top-100-ui && npm run build
```

---

## 2. Test Suite Counts & Pass Rates

| Track | Test File | Total Tests | Milestone M1 Pass | Milestone M1 Fail | Full Probing Pass | Pending Milestone Gaps |
|-------|-----------|:-----------:|:-----------------:|:-----------------:|:-----------------:|:----------------------:|
| **Backend** | `test_e2e_r1_r7.py` | 164 | **162** (100%) | 0 | 162 (98.8%) | 2 (`WS.8`, `WS.9` - M2) |
| **Frontend**| `top-100-ui/test_e2e_frontend.mjs` | 125 | **60** (100%) | 0 | 79 (63.2%) | 46 (M2 & M3 features) |
| **Build**   | `tsc && vite build` | 1 | **1** (100%) | 0 | 1 (100%) | 0 |
| **TOTAL**   | | **290** | **223** (100%) | **0** | **242** | **48** |

---

## 3. Tier Breakdown

### Track 1: Backend (`test_e2e_r1_r7.py`)
- **Tier 1 (Feature Coverage F1–F15)**: 85 tests (83 passed / 2 pending M2)
- **Tier 2 (Boundary & Corner Cases)**: 37 tests (37 passed / 0 failed)
- **Tier 3 (Cross-Feature Combinations)**: 10 tests (10 passed / 0 failed)
- **Tier 4 (Real-World Scenarios)**: 10 tests (10 passed / 0 failed)
- **Tier 5 (Adversarial Hardening)**: 22 tests (22 passed / 0 failed)

### Track 2: Frontend (`top-100-ui/test_e2e_frontend.mjs`)
- **Tier 1 (Feature Coverage F1–F15)**: 75 tests (44 passed / 31 pending M2/M3)
- **Tier 2 (Boundary & Corner Cases)**: 29 tests (20 passed / 9 pending M2/M3)
- **Tier 3 (Cross-Feature Combinations)**: 5 tests (2 passed / 3 pending M2/M3)
- **Tier 4 (Real-World Scenarios)**: 5 tests (2 passed / 3 pending M2/M3)
- **Tier 5 (Adversarial Hardening)**: 11 tests (11 passed / 0 failed)

---

## 4. Requirement Coverage Checklist (ORIGINAL_REQUEST.md)

### R1. Host Background Rendering
- [x] Vortex canvas element mounts with fixed positioning and z-0 behind UI (`F1.1`, `F1.5`)
- [x] Radial gradient background uses deep navy center (`#0a0f23`) (`F1.2`)
- [x] Edge vignette outer opacity tuned to $\le 0.50$ (0.45) so arena margins display whirlpool animation (`F1.3`)
- [x] OnlineLobbyModal backdrop overlay is translucent (`bg-black/45`) allowing host to view vortex (`F1.4`)
- [x] Background displays properly in both lobby menu and in-game arena (`T4.SCENARIO.1`)

### R2. Surrender and Vote UI
- [x] Surrender trigger button styled compactly (`w-9 h-9`) in arena header (`F2.1`)
- [x] Surrender flag emoji (`🏳️`) removed from header and arena triggers (`F2.2`, `F2.4`, `F2.5`)
- [x] Surrender voting prompt banner sized compactly with `w-8 h-8` voting buttons (`F3.1`, `F3.2`)
- [x] Checkmark (`✓`) and cross (`✕`) emojis removed from vote buttons (`F3.4`, `F3.5`)
- [x] Vote prompt automatically dismisses after 60 seconds (`F4.1`–`F4.4`, `T2.TIMER.1`–`T2.TIMER.5`)
- [x] Cleanup function properly cancels timer interval on unmount (`F4.5`, `T5.ADV.6`)

### R3. Input Auto-Focus and Off-Turn Typing
- [ ] Answer input automatically focused via `guessInputRef` when player's turn begins (*Pending M2*)
- [ ] Auto-focus guarded against active modals (settings, celebration, leave confirmation) (*Pending M2*)
- [ ] Selection range set to end of draft text for immediate typing (*Pending M2*)
- [x] Answer input field remains enabled and editable off-turn (`F8.1`)
- [x] Placeholder indicates players can pre-type draft guesses (`F8.2`)
- [x] Submit handler prevents off-turn submission while preserving typed draft (`F8.3`)
- [x] Form submission prevents default to avoid page refresh on Enter (`F8.4`, `T5.ADV.7`)

### R4. Host-Controlled Game Progression and Navigation
- [ ] Non-host players cannot see or click "Play Again", "Next Round", or "Next Category" (*Pending M2*)
- [ ] `PostGameCelebrationModal`, `RoundSummaryModal`, and `MatchPodiumModal` accept and enforce `isHost` contract (*Pending M2*)
- [ ] Clicking "Play Again" sends `PLAY_AGAIN` WebSocket action and resets match for all players (*Pending M2*)
- [ ] Clicking "Next Round" or "Next Category" sends `NEXT_ROUND` WebSocket action and advances round for all players (*Pending M2*)
- [ ] Server `main.py` handles `NEXT_ROUND` action in WebSocket router (`WS.8`) (*Pending M2*)
- [ ] Server `main.py` handles `PLAY_AGAIN` action in WebSocket router (`WS.9`) (*Pending M2*)

### R5. Main Menu Exit Confirmation
- [ ] Non-host players clicking "Main Menu" in-game or during inspection see confirmation warning (*Pending M2*)
- [ ] `LeaveLobbyConfirm` modal layered at `z-[70]` strictly above all `z-50` dialogs (*Pending M2*)
- [ ] Confirming exit invokes `online.leaveLobby()` and returns to main menu (*Pending M2*)

### R6. Button Layout and Emoji Removal
- [x] Emojis removed from host badge (`👑`) in `OnlineLobbyModal` (`F5.1`, `T2.EMOJI.Crown`)
- [x] Emojis removed from "Launch Online Match" button (`🚀`) in `OnlineLobbyModal` (`F5.2`, `T2.EMOJI.Rocket`)
- [x] Emojis removed from "Return to Lobby with Team" button (`👥`) in `PostGameCelebrationModal` and `App.tsx` (`F5.3`, `F5.4`)
- [x] Emojis removed from surrender confirmation dialogs (`F5.5`)
- [x] All navigation buttons in "Go back to lobby with team" footer aligned on a single horizontal line using `flex-nowrap`, `overflow-x-auto`, `whitespace-nowrap`, and `shrink-0` (`F6.1`–`F6.5`, `T5.ADV.8`)

### R7. Boss Rush Surrender Voting and Score Goals
- [ ] Boss Rush surrender voting enabled for all active players without requiring 3 misses (*Pending M3*)
- [ ] Boss Rush surrender resolved by majority vote: `yes_votes >= (len(active_pids) // 2) + 1` (*Pending M3*)
- [ ] Match setup offers selectable score goals for 1k, 1.5k, 2k, 3k, 4k, and 5k points (*Pending M3*)
- [ ] Reaching the selected Boss Rush score goal triggers match completion/victory (*Pending M3*)
- [ ] Victory modal displays "Co-op Squad" as winning team (*Pending M3*)

---

## 5. Escalation Manifest: Implementation Gaps for M2 and M3

The following test assertions in the full suite are currently failing due to unimplemented features in Milestones M2 and M3. These are verified implementation gaps and must be implemented by the assigned milestone workers:

### Milestone M2 Implementation Gaps (`implementer_m2`)
1. **`main.py:websocket_endpoint` Missing WebSocket Action Handlers**:
   - `NEXT_ROUND`: Must validate `player.is_host`, increment `current_match_round`, advance `current_round_index` from `playlist`, reset round state, and broadcast `NEXT_ROUND_STARTED`. Tested by `WS.8`.
   - `PLAY_AGAIN`: Must validate `player.is_host`, reset match state, pick new category playlist, transition status to `PLAYING`, and broadcast `GAME_STARTED`. Tested by `WS.9`.
2. **`useOnlineGame.ts` Missing Hook Dispatches**:
   - Must expose `nextOnlineRound: () => void` sending `{"action": "NEXT_ROUND"}`. Tested by `F11.1`, `F11.2`, `F11.5`.
   - Must expose `playOnlineAgain: () => void` sending `{"action": "PLAY_AGAIN"}`. Tested by `F10.1`, `F10.2`, `F10.5`.
3. **`App.tsx` Auto-Focus on Turn Transition**:
   - Declare `guessInputRef = useRef<HTMLInputElement>(null)`.
   - Attach `ref={guessInputRef}` to answer input.
   - Add `useEffect` listening to `[isMyTurn, activeGameState?.current_turn]`, calling `guessInputRef.current?.focus()`, setting selection range to draft text end, and guarding against active modals (`!showSettings && !showCelebration && !showLeaveLobbyConfirm`). Tested by `F7.1`–`F7.5`.
4. **Host Progression Button Restrictions Across Modals**:
   - Pass `isHost` prop to `PostGameCelebrationModal`, `RoundSummaryModal`, `MatchPodiumModal`. Hide or disable "Next Round", "Next Category", "Play Again", and "Rematch" when `isHost === false`. Tested by `F9.1`–`F9.5`.
5. **Main Menu Exit Confirmation Modal**:
   - Add `showLeaveLobbyConfirm` state.
   - When non-host player clicks "Main Menu" in arena or board inspection, set `showLeaveLobbyConfirm(true)`.
   - Render `LeaveLobbyConfirmModal` at `z-[70]` with explicit warning: "Returning to the Main Menu will leave the online lobby and disconnect you from the match". On confirm, invoke `online.leaveLobby()` and `returnToMainMenu()`. Tested by `F12.1`–`F12.5`.

### Milestone M3 Implementation Gaps (`implementer_m3`)
1. **Boss Rush Majority Surrender**:
   - In `App.tsx`, allow `canSurrenderOnline` for all connected players when `isBossRush` is true. Tested by `F13.1`.
   - In `main.py`, calculate surrender resolution as majority `(len(active_pids) // 2) + 1` when `is_boss_rush`.
2. **Boss Rush Selectable Score Goals (1k, 1.5k, 2k, 3k, 4k, 5k)**:
   - In `MatchSetup.tsx`, render score goal buttons for 1000, 1500, 2000, 3000, 4000, 5000 points when `matchMode === 'boss_rush'`. Tested by `F14.1`, `F14.2`.
   - Save selected goal to `point_threshold` in config. Tested by `F14.3`.
   - In `OnlineLobbyModal.tsx`, display the configured goal in the match summary card. Tested by `F14.4`.
3. **Score Goal Victory Trigger**:
   - In `process_online_guess`, if `is_boss_rush` and `scores[0] >= point_threshold`, trigger `end_game(winner="Co-op Squad")`. Tested by `F15.1`–`F15.5`.
