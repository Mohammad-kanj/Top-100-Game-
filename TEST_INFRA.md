# Test Infrastructure & Dual Track E2E Test Suite Specification

## 1. Architecture Overview

The Top 100 Cyber Arcade Multiplayer platform employs a **Dual Track End-to-End (E2E) Test Architecture** designed to comprehensively validate all 7 requirements (R1–R7) spanning 15 functional features across both server-authoritative state logic and client reactive interfaces.

```
+-----------------------------------------------------------------------------------------+
|                                    PROJECT SPECIFICATION                                |
|                        (ORIGINAL_REQUEST.md & PROJECT.md Contracts)                     |
+-----------------------------------------------------------------------------------------+
                                             |
                     +-----------------------+-----------------------+
                     |                                               |
                     v                                               v
   +------------------------------------+          +------------------------------------+
   |         TRACK 1: BACKEND E2E       |          |        TRACK 2: FRONTEND E2E       |
   |      `test_e2e_r1_r7.py` (Py)      |          |  `top-100-ui/test_e2e_frontend.mjs`|
   +------------------------------------+          +------------------------------------+
   | - In-Memory GameState Engine       |          | - Component Hierarchy & AST Scan   |
   | - Starlette WebSocket TestClient  |          | - Reactive Hook Protocol Contracts |
   | - Network Concurrency & Sync       |          | - Tailwind CSS & Layering Audits   |
   | - Adversarial Fuzzing & Injection  |          | - Cross-Feature Modal Interaction  |
   +------------------------------------+          +------------------------------------+
                     |                                               |
                     +-----------------------+-----------------------+
                                             |
                                             v
                           +-----------------------------------+
                           |       5-TIER QUALITY PYRAMID      |
                           |  Tier 1: Feature Coverage (F1-F15)|
                           |  Tier 2: Boundary & Corner Cases  |
                           |  Tier 3: Pairwise Interactions    |
                           |  Tier 4: End-to-End User Sessions |
                           |  Tier 5: Adversarial Hardening    |
                           +-----------------------------------+
```

---

## 2. Authoritative Specification Sources

All test assertions, expected payloads, and boundary thresholds are authoritatively derived from:
1. **`ORIGINAL_REQUEST.md`**: Primary requirements R1 through R7 and explicit acceptance criteria.
2. **`PROJECT.md`**: Architectural breakdown, milestones M1–M4, WebSocket action protocols, and component interface contracts.

---

## 3. Test Tier Breakdown

The test suite is structured into 5 rigorous testing tiers ensuring deep verification and adversarial resilience:

| Tier | Name | Scope & Requirement | Backend Tests (`test_e2e_r1_r7.py`) | Frontend Tests (`test_e2e_frontend.mjs`) |
|------|------|---------------------|--------------------------------------|-------------------------------------------|
| **Tier 1** | **Feature Coverage** | $\ge 5$ test cases per feature for Features 1–15 | 85 tests | 75 tests |
| **Tier 2** | **Boundary & Corner Cases** | Edge cases, timing thresholds, host transfer dynamics, modal z-index layering | 37 tests | 29 tests |
| **Tier 3** | **Cross-Feature Combinations** | Pairwise interactions between game modes, voting, host controls, and state preservation | 10 tests | 5 tests |
| **Tier 4** | **Real-World Scenarios** | Multi-player tournament sessions, Boss Rush co-op matches, non-host safeguard flows | 10 tests | 5 tests |
| **Tier 5** | **Adversarial Hardening** | Security injection payloads, XSS, control/null byte fuzzing, buffer limits, zero-emoji compliance | 22 tests | 11 tests |
| **TOTAL** | | | **164 Tests** | **125 Tests** |

---

## 4. Test Runners & Execution Commands

### 4.1 Progressive Milestone Execution (Completed Milestone M1)
To verify currently completed milestones without triggering failures on future pending milestones:

```bash
# Track 1: Backend E2E (Milestone M1)
python test_e2e_r1_r7.py --milestone M1

# Track 2: Frontend E2E (Milestone M1)
cd top-100-ui && node test_e2e_frontend.mjs --milestone M1
```
*Current Result*: 100% Pass rate on both tracks (162/162 passed in backend; 60/60 passed in frontend; 0 failures).

### 4.2 Comprehensive Multi-Milestone Probing (Full Suite M1–M4)
To run all test tiers across all project milestones to verify existing features and probe future milestone gaps:

```bash
# Track 1: Backend E2E (All Milestones M1-M4)
python test_e2e_r1_r7.py

# Track 2: Frontend E2E (All Milestones M1-M4)
cd top-100-ui && node test_e2e_frontend.mjs
```

### 4.3 Production Build Cleanliness Check
Validates TypeScript compilation and Vite bundling integrity:

```bash
cd top-100-ui && npm run build
```
*Current Result*: Build completes with 0 errors / 0 warnings in $< 500\text{ ms}$.

---

## 5. Feature Coverage Matrix (R1 – R7)

| Req | Feature # | Description | Milestone | Backend Test IDs | Frontend Test IDs | Current State |
|:---:|:---:|---|:---:|---|---|:---:|
| **R1** | **F1** | Host Background Rendering (Vortex canvas, translucent overlay, tuned vignette) | M1 | `F1.1`–`F1.5` | `F1.1`–`F1.5` | **VERIFIED** |
| **R2** | **F2** | Compact Surrender Trigger Button (w-9 h-9, no emojis) | M1 | `F2.1`–`F2.5` | `F2.1`–`F2.5` | **VERIFIED** |
| **R2** | **F3** | Compact Surrender Voting Prompt (w-8 h-8 buttons, no emojis) | M1 | `F3.1`–`F3.5` | `F3.1`–`F3.5` | **VERIFIED** |
| **R2** | **F4** | Surrender 60s Auto-Dismissal & Timer Expiration | M1 | `F4.1`–`F4.5` | `F4.1`–`F4.5` | **VERIFIED** |
| **R6** | **F5** | Emoji Removal (👑, 🚀, 🏳️, 👥 removed from all UI controls) | M1 | `F5.1`–`F5.5` | `F5.1`–`F5.5` | **VERIFIED** |
| **R6** | **F6** | Single-Line Post-Game Button Layout (`flex-nowrap`, `overflow-x-auto`) | M1 | `F6.1`–`F6.5` | `F6.1`–`F6.5` | **VERIFIED** |
| **R3** | **F7** | Turn Input Auto-Focus (`useRef`, `focus()` guarded by modal state) | M2 | `F7.1`–`F7.5` | `F7.1`–`F7.5` | *Pending M2* |
| **R3** | **F8** | Off-Turn Pre-Typing & Editing (enabled off-turn, draft preserved) | M2 | `F8.1`–`F8.5` | `F8.1`–`F8.5` | **VERIFIED** |
| **R4** | **F9** | Host-Exclusive Progression Button Visibility (`isHost` guards) | M2 | `F9.1`–`F9.5` | `F9.1`–`F9.5` | *Pending M2* |
| **R4** | **F10**| Host "Play Again" Room Restart (`PLAY_AGAIN` action & state reset) | M2 | `F10.1`–`F10.5`, `WS.9` | `F10.1`–`F10.5` | *Pending M2 WS* |
| **R4** | **F11**| Host "Next Round" Advancement (`NEXT_ROUND` action & playlist sync) | M2 | `F11.1`–`F11.5`, `WS.8` | `F11.1`–`F11.5` | *Pending M2 WS* |
| **R5** | **F12**| Main Menu Exit Confirmation Modal (`LeaveLobbyConfirm` at `z-[70]`) | M2 | `F12.1`–`F12.5` | `F12.1`–`F12.5` | *Pending M2* |
| **R7** | **F13**| Boss Rush Surrender Voting by Majority (`(total // 2) + 1`) | M3 | `F13.1`–`F13.5` | `F13.1`–`F13.5` | *Pending M3* |
| **R7** | **F14**| Boss Rush Selectable Score Goals (1k, 1.5k, 2k, 3k, 4k, 5k) | M3 | `F14.1000`–`F14.5000` | `F14.1`–`F14.5` | *Pending M3* |
| **R7** | **F15**| Boss Rush Score Goal Victory Trigger (`scores[0] >= target`) | M3 | `F15.1`–`F15.5` | `F15.1`–`F15.5` | *Pending M3* |

---

## 6. Adversarial Verification Methodology (Tier 5)

Tier 5 subjects both backend and frontend layers to adversarial fuzzing, boundary stress, and security integrity audits:

1. **Security & Injection Robustness**:
   - Injected `<script>alert('xss')</script>` into player names and verified safe serialization into JSON without unescaped execution or server fault (`T5.ADV.1`, `T5.ADV.2`).
   - Injected SQL/NoSQL tokens (`'; DROP TABLE users; --`, `1 OR 1=1`) and verified safe string normalization (`T5.ADV.4.1`–`T5.ADV.4.5`).
   - Audited all frontend components to verify zero instances of `dangerouslySetInnerHTML` (`T5.ADV.1`).
2. **Payload Sanitization & Control Characters**:
   - Tested zero-width spaces (`\u200b`), bidirectional text overrides (`\u202e`), ANSI escape codes, CRLF sequences, and null bytes (`\x00`) in guess strings without crashing the match runner (`T5.ADV.3.1`–`T5.ADV.3.5`).
3. **Resource Stress & Extreme Buffers**:
   - Sent 100,000 character extreme-length guess payloads; verified graceful evaluation and rejection without memory spikes or thread starvation (`T5.ADV.5.1`).
4. **State Corruption & Stacking Invariance**:
   - Verified surrender votes are strictly rejected when room status is `LOBBY` (`T5.ADV.6.1`).
   - Verified empty room (`player_order = []`) returns `None` for active player without `IndexError` (`T5.ADV.7.1`).
   - Verified negative (`-500`) and zero (`0`) score thresholds do not falsely trigger victory (`T5.ADV.8.1`, `T5.ADV.8.2`).
   - Audited all frontend and backend source files for 100% pure ASCII identifiers and zero forbidden emojis (`👑`, `🚀`, `🏳️`, `👥`).
