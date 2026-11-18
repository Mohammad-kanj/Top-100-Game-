# TOP 100 - Arcade Trivia Party Game

An arcade-inspired multiplayer trivia party game built for competitive game nights and online play with friends. Teams face off to uncover items on massive 100-answer leaderboards across 100 diverse categories (10,000 verified answers in total).

Featuring a cyber-arcade aesthetic with tactile 3D buttons, dynamic whirlpool background matrix, studio-grade Web Audio synthesis, customizable color themes, and real-time multiplayer powered by FastAPI WebSockets.

---

## Game Overview

In **Top 100**, teams compete to identify items ranked from **#1 down to #100** in a selected category (e.g. *Highest Grossing Movies, Best-Selling Video Games, Most Populated Countries, Fortune 500, Most Streamed Songs*).

### Scoring & Rules
- **Rank Points**: Each revealed tile awards points equal to its rank value (Rank 1 = 1 pt, Rank 100 = 100 pts, or custom scoring modes).
- **Target Point Threshold**: First team to hit the target score (e.g. 100, 300, 500, or unlimited) wins the match.
- **Turn Timers**: Adjustable turn timers (15s, 30s, 45s, 60s, or disabled) with mechanical stopwatch audio cues.
- **Pre-Type Guessing**: Active players can type their next guess even during the opposing team's turn, allowing instant submission the moment their turn begins.
- **Surrender Vote (Rocket League Style)**: Teams that find themselves stuck can initiate a 60-second unanimous surrender vote. To prevent spamming, initiating a vote requires a cooldown of 3 consecutive incorrect guesses before another vote can be called.
- **Host Override System**: Hosts have full authority to mark close guesses correct, award or deduct points, and reveal specific tiles.
- **Post-Game Board Inspection**: After a round concludes, players can inspect every hidden rank on the board, view stats, and celebrate on the team podium.

### Game Modes
1. **Single Round**: Classic head-to-head showdown on a single 100-tile board.
2. **Multi-Round Championship**: 2 to 5 consecutive categories with cumulative team leaderboards and crowning champion.
3. **Boss Rush**: Co-op squad sprint or solo challenge against an intense 5, 10, or 15-minute countdown clock.

### Theme & Audio Customization
- **Cyber Crimson (Red Mode)**: Rich obsidian black, deep crimson borders, coral accents, and lemon-chiffon text.
- **Sapphire Cobalt (Blue Mode)**: Deep navy, electric cyan highlights, sapphire outlines, and icy blue indicators.
- **Studio-Grade Synthesized Audio**: Built-in Web Audio engine with realistic mechanical switch clicks, pure two-tone acoustic mallet chimes, and gentle organic woodblock taps.

---

## How to Run the Game

### Option 1: One-Click Instant Launch (Windows)
Double-click either of the included batch scripts in the project root:
- **`Play Top 100 (Local & Wi-Fi).bat`**: Starts the server, builds the UI, detects your local Wi-Fi IP, and opens your browser. Anyone on the same Wi-Fi can join from a phone, tablet, or laptop by typing the displayed IP into their browser!
- **`Play Top 100 (Online Friends).bat`**: Launches the game and creates a free Cloudflare Tunnel URL so friends anywhere in the world can play for free without port forwarding.

---

### Option 2: Python Launcher CLI (`launch.py`)

Run the unified Python launcher directly:

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Launch Local / Wi-Fi LAN session
python launch.py

# 3. Or launch with free Cloudflare Tunnel for online play
python launch.py --tunnel
```

The launcher will:
1. Verify Python & FastAPI dependencies.
2. Detect your local Wi-Fi network IP.
3. Start the FastAPI WebSocket server on port `8000`.
4. Automatically open your default web browser to the game.

---

### Option 3: Developer Setup (Hot Reloading)

If you are developing or modifying the game, run the backend and frontend in separate terminal windows:

#### Terminal 1: Backend (FastAPI + WebSockets)
```bash
# Install Python packages
pip install -r requirements.txt

# Run FastAPI server with auto-reload
python -m uvicorn main:app --reload --port 8000
```
*Backend runs on `http://localhost:8000` with interactive API docs at `/docs`.*

#### Terminal 2: Frontend (React + Vite)
```bash
cd top-100-ui

# Install dependencies
npm install

# Start Vite dev server with Hot Module Replacement (HMR)
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### Option 4: Free 24/7 Cloud Deployment (Render / Docker / Railway)

The repository includes a production-ready `Dockerfile` and `render.yaml` for one-click free hosting on Render.com or Railway:

1. Push this repository to your GitHub account.
2. In [Render.com](https://render.com), click **New +** -> **Blueprint** (or **Web Service**).
3. Connect your repository. Render will automatically detect `render.yaml` or `Dockerfile`.
4. Deploy! Your game will have a permanent public HTTPS URL with WebSocket support.

---

## Playing Online with Friends (100% Free, Zero Hosting Cost)

You do **NOT** need to pay for any servers to play online with friends!

1. Run **`Play Top 100 (Online Friends).bat`** (or `python launch.py --tunnel`).
2. The terminal will generate a free public link:
   ```
   ====================================================
      TOP 100 CYBER ARCADE - ONLINE LINK FOR FRIENDS
   ====================================================
   LINK: https://your-game-tunnel.trycloudflare.com
   ```
3. Send that link to your friends.
4. Friends open the link on their phones, tablets, or computers, click **Online Play**, and enter the 4-letter Room Code generated by the Host.

---

## Tech Stack & Architecture

- **Backend**:
  - [FastAPI](https://fastapi.tiangolo.com/): High-concurrency Python ASGI framework.
  - [Starlette WebSockets](https://www.starlette.io/websockets/): Full-duplex real-time state synchronization.
  - [Pydantic v2](https://docs.pydantic.dev/): Strict data validation and room serialization.
  - [Uvicorn](https://www.uvicorn.org/): Production ASGI web server.
- **Frontend**:
  - [React 19](https://react.dev/): Modern component architecture with TypeScript.
  - [Vite](https://vitejs.dev/): Ultra-fast frontend build tooling and HMR.
  - [Tailwind CSS v4](https://tailwindcss.com/): Custom cyber-arcade design system.
  - [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API): Custom synthesized haptic and acoustic SFX with zero external audio assets.
  - [HTML5 Canvas](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API): High-performance animated matrix whirlpool particle background.

---

## Project Directory Structure

```
Top 100/
├── main.py                      # FastAPI server, WebSockets, room state, matching engine
├── launch.py                    # One-click launcher (local Wi-Fi detection + cloudflare tunnel)
├── rounds_data.json             # 100 complete categories with 10,000 verified rankings
├── requirements.txt             # Python dependencies
├── Dockerfile                   # Multi-stage production container build
├── render.yaml                  # 1-click Render cloud deployment blueprint
├── Play Top 100 (Local & Wi-Fi).bat
├── Play Top 100 (Online Friends).bat
├── test_e2e_r1_r7.py            # Comprehensive 176-test Python E2E verification suite
│
└── top-100-ui/                  # React 19 + TypeScript frontend
    ├── src/
    │   ├── App.tsx              # Main arena controller, game state, keyboard routing
    │   ├── soundFx.ts           # Studio-grade Web Audio synthesizer
    │   ├── index.css            # Arcade theme styles (Cyber Crimson & Sapphire Cobalt)
    │   ├── types.ts             # TypeScript definitions for rooms, players, categories
    │   └── components/
    │       ├── MainMenu.tsx     # 3D pixel buttons, glowing chevrons, fullscreen control
    │       ├── MatchSetup.tsx   # Category selection, match rules, timers, team sizing
    │       ├── OnlineLobbyModal.tsx # Room codes, player rosters, real-time ready status
    │       ├── WhirlpoolBackground.tsx # Canvas retro vortex matrix animation
    │       ├── SettingsModal.tsx    # Audio controls, volume slider, color theme toggle
    │       ├── HostOverrideModal.tsx# In-game referee controls (award points, reveal tiles)
    │       ├── PostGameCelebrationModal.tsx # End-game screen, podium, and board inspection
    │       ├── RoundSummaryModal.tsx    # Round transition overview and rankings
    │       ├── HowToPlayModal.tsx       # Interactive rules tutorial
    │       └── TeamsModal.tsx           # Custom team names and color assignment
    └── package.json
```

---

## Automated Test Suite

Top 100 includes an exhaustive 176-test Python automated test harness ([`test_e2e_r1_r7.py`](file:///C:/Users/yoyo2/OneDrive/Desktop/Projects/Top%20100/test_e2e_r1_r7.py)) covering all features across Tiers 1 through 5:

```bash
python test_e2e_r1_r7.py
```

### Test Coverage Highlights:
- **Tier 1 (Feature Coverage)**: Room creation, joining, lobby configuration, turn rotations, timers, scoring calculations, surrender votes, WebSocket protocol validation.
- **Tier 2 (Boundary & Concurrency)**: 60.0s vote expiry boundary, player reconnects, host migration on disconnect, adversarial input payloads.
- **Tier 3 (Multi-Round Championships)**: Cumulative score tracking, sequential round state preservation, podium resolution.
- **Tier 4 (Stress & Invariant Testing)**: Concurrent guess handling, sudden host departure recovery, unanimous vote state transitions.
- **Tier 5 (Adversarial Security & Zero-Crash)**: Script injection sanitization, memory stress tests, serialization determinism.

**Current Test Status**: `176 Passed / 0 Failed (100.0% Success Rate)`.

---

## License

Developed with love for ultimate party game nights. Free to use, modify, and enjoy with friends!
