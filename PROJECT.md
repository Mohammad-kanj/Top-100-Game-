# Project: Top 100 Background, Networking, Voting, Navigation & Layout Redesign (R1–R7)

## Architecture
- **Frontend**: React 18 + TypeScript + Tailwind CSS (`top-100-ui`).
  - Screen navigation: `MENU`, `MATCH_SETUP`, `ARENA` in `App.tsx`.
  - Modals: `SettingsModal.tsx`, `OnlineLobbyModal.tsx`, `PostGameCelebrationModal.tsx`, `RoundSummaryModal.tsx`.
  - Online state synchronization: `useOnlineGame.ts` WebSocket hook managing room state, surrender voting, player lists, and turn actions.
  - Background rendering: `WhirlpoolBackground.tsx` canvas component at `z-0` across all screens.
- **Backend**: FastAPI + WebSockets + Python asyncio (`main.py`).
  - `OnlineRoom`: manages room status (`LOBBY`, `PLAYING`), room code, players, turn order, game state, and `surrender_vote`.
  - Static asset serving: FastAPI mounts `top-100-ui/dist/assets` under `/assets` and serves SPA routes from `top-100-ui/dist/index.html`.
  - WebSocket protocol: handles `VOTE_SURRENDER`, `PASS_TURN`, `PLAY_AGAIN`, `RETURN_TO_LOBBY`, `SUBMIT_GUESS`, `UPDATE_CONFIG`, `START_GAME`.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | R1.1 Background Loading | Ensure background canvas renders properly on all screens whether launched from `.bat`, localhost, or WiFi client; ensure build verification and reduce-motion polish. | M1 | ORIGINAL_REQUEST §R1 |
| 2 | R1.2 WiFi Lobby Joining | Enable remote WiFi clients to join using room code; auto-mount lobby from URL query params; provide reachable IP for invite links. | M1 | ORIGINAL_REQUEST §R1 |
| 3 | R2.1 Remove Center Voting Button | Remove the center-screen surrender banner below the guess input form (`App.tsx:1475-1492`). | M1 | ORIGINAL_REQUEST §R2 |
| 4 | R2.2 Top-Right Surrender Flag Icon | Display surrender flag button in top-right header controls from match start (remove 3-miss gate; preserve SVG emoji purity). | M1 | ORIGINAL_REQUEST §R2 |
| 5 | R2.3 Rocket League-Style Voting Box | Position active surrender voting notification box in the symmetrical right-side slot of the controls row with yes/no options. | M1 | ORIGINAL_REQUEST §R2 |
| 6 | R2.4 Unanimous Surrender Agreement | Enforce unanimous agreement (100% of connected players must vote YES; any NO terminates vote immediately; remove initiation miss-gate). | M1 | ORIGINAL_REQUEST §R2 |
| 7 | R3.1 Pre-typing Prompt Label | Update placeholder in `App.tsx:1445` to "pre-type your guess". | M1 | ORIGINAL_REQUEST §R3 |
| 8 | R3.2 Guessing Prompt Label | Update placeholder in `App.tsx:1448` to "type your guess". | M1 | ORIGINAL_REQUEST §R3 |
| 9 | R3.3 Inspect Board Button Label | Update text in `PostGameCelebrationModal.tsx:499` to "Inspect Board". | M1 | ORIGINAL_REQUEST §R3 |
| 10 | R4.1 Turn Timer Online Transition | Ensure turn timer expiration in online play transitions turn state properly across players and avoids stalls in solo or throttled clients. | M1 | ORIGINAL_REQUEST §R4 |
| 11 | R4.2 Play Again Recent Guess Reset | Ensure clicking "play again" clears `lastGuess` and `lastOnlineResult` display across all clients in addition to resetting the board. | M1 | ORIGINAL_REQUEST §R4 |
| 12 | R5.1 Host Return to Lobby with Team | Provide "Return to lobby with team" action in host Settings modal and game controls, transitioning room to LOBBY for all players. | M1 | ORIGINAL_REQUEST §R5 |
| 13 | R5.2 Host Leave Alone Confirmation | Display confirmation dialog when host attempts to leave to main menu alone, warning of host departure/transfer. | M1 | ORIGINAL_REQUEST §R5 |
| 14 | R6 End-Game Board Cleanliness | Clean up end-game board layout so bottom section is tidy, readable, and fits cleanly without vertical page scrolling. | M1 | ORIGINAL_REQUEST §R6 |
| 15 | R7 Verification & Test Suite Updates | Update `test_e2e_r1_r7.py` across Tiers 1–5 and WebSocket tests for R1–R7; verify clean `npm run build` in `top-100-ui`. | M1 | ORIGINAL_REQUEST §R7 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Backgrounds, Networking, Voting, Navigation & Layout (R1–R7) | Complete implementation of R1 through R7 across frontend (`top-100-ui`), backend (`main.py`), and test suite (`test_e2e_r1_r7.py`). | Phase 0 Survey complete | DONE |

## Code Layout
- **Backend**:
  - `main.py`:
    - `VOTE_SURRENDER`: remove initiation miss-gate, enforce unanimous consensus (all active players YES; any NO fails immediately).
    - `PASS_TURN`: ensure robust turn advancement and avoid stalls.
    - `PLAY_AGAIN`: broadcast guess-reset signal and reset match state.
    - `RETURN_TO_LOBBY`: transition status to `LOBBY`, sync teams, broadcast `RETURNED_TO_LOBBY`.
- **Frontend (`top-100-ui`)**:
  - `src/App.tsx`:
    - Remove center surrender banner (lines 1475-1492).
    - Enable top-right surrender flag from match start (lines 1046-1061).
    - Render Rocket League-styled voting box in the right slot of controls row (replacing dummy spacer, lines 1518-1520).
    - Update input placeholders to "pre-type your guess" and "type your guess".
    - Auto-mount `OnlineLobbyModal` if `?room=` parameter is present in URL.
    - Implement host leave confirmation dialog and "Return to lobby with team" action.
    - Reset `lastGuess` on online play again.
    - Tidy end-game board layout (hide disabled input controls row on game over, add tidy bottom action bar, eliminate vertical scrolling).
  - `src/components/SettingsModal.tsx`:
    - Add `isOnline`, `isHost`, `onReturnToLobby` props.
    - Render "Return to Lobby with Team" button for host in online matches.
  - `src/components/PostGameCelebrationModal.tsx`:
    - Update button text to "Inspect Board" (line 499).
  - `src/components/OnlineLobbyModal.tsx`:
    - Format invite link with host LAN IP when available.
  - `src/hooks/useOnlineGame.ts`:
    - Clear `lastOnlineResult` on `GAME_STARTED`.
    - Provide `returnToLobby` action.
- **Tests**:
  - `test_e2e_r1_r7.py`:
    - Update Tier 1–5 tests to assert unanimous surrender voting (100% YES required; 1 NO fails).
    - Verify surrender flag active from match start.
    - Test static asset routes (`/`, `/assets/`, `/favicon.svg`).
    - Verify label text AST/regex assertions.
    - Test turn timer transition and play-again guess reset.
    - Test `RETURN_TO_LOBBY` WebSocket action.

## Interface Contracts
### `SettingsModal` ↔ `App.tsx`
- `isOnline?: boolean;`
- `isHost?: boolean;`
- `onReturnToLobby?: () => void;`
- `onQuitGame?: () => void;`

### `OnlineLobbyModal` ↔ `App.tsx`
- Auto-mounts when `window.location.search` includes `?room=CODE`.

### WebSocket Action Contracts (`main.py` ↔ `useOnlineGame.ts`)
- `VOTE_SURRENDER`:
  - Request: `{"action": "VOTE_SURRENDER", "vote": boolean}`
  - Broadcasts: `SURRENDER_VOTE_STARTED`, `SURRENDER_VOTE_UPDATE`, `SURRENDER_PASSED`, `SURRENDER_VOTE_FAILED`, `SURRENDER_VOTE_EXPIRED`
  - Rule: Unanimous agreement required.
- `RETURN_TO_LOBBY`:
  - Request: `{"action": "RETURN_TO_LOBBY"}` (host only)
  - Broadcast: `RETURNED_TO_LOBBY`
  - State: `room.status = "LOBBY"`
- `PLAY_AGAIN`:
  - Request: `{"action": "PLAY_AGAIN"}` (host only)
  - Broadcast: `GAME_STARTED` with guess reset indicator.
