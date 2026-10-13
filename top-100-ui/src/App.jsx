import { useState, useEffect, useRef } from 'react';
import SynthwaveBackground from './components/SynthwaveBackground';
import MainMenu from './components/MainMenu';
import MatchSetup from './components/MatchSetup';
import HowToPlayModal from './components/HowToPlayModal';
import SettingsModal from './components/SettingsModal';
import TeamsModal from './components/TeamsModal';
import HostOverrideModal from './components/HostOverrideModal';
import RoundSummaryModal from './components/RoundSummaryModal';
import MatchPodiumModal from './components/MatchPodiumModal';
import { soundFx } from './soundFx';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  // Screen state: 'MENU' | 'MATCH_SETUP' | 'ARENA'
  const [screen, setScreen] = useState('MENU');

  // Backend state
  const [gameState, setGameState] = useState(null);
  const [categories, setCategories] = useState([]);

  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTeams, setShowTeams] = useState(false);
  const [showHostOverride, setShowHostOverride] = useState(false);
  const [showRoundSummary, setShowRoundSummary] = useState(false);
  const [showMatchPodium, setShowMatchPodium] = useState(false);
  const [focusedTile, setFocusedTile] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, message: '' });

  // Gameplay local state
  const [guess, setGuess] = useState('');
  const [lastGuess, setLastGuess] = useState({ text: '---', status: 'none', message: '' });
  const [lastRevealedIndex, setLastRevealedIndex] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(soundFx.isMuted());

  // Turn timer
  const [timeRemaining, setTimeRemaining] = useState(null);
  const timerRef = useRef(null);

  // Fetch backend game state
  const fetchState = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/state`);
      const data = await res.json();
      setGameState(data);

      if (data.is_match_over) {
        setShowMatchPodium(true);
      } else if (data.is_round_over && !showMatchPodium) {
        setShowRoundSummary(true);
      }
    } catch (err) {
      console.error('Failed to connect to backend', err);
    }
  };

  // Fetch categories list
  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/categories`);
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Initial load & hotkey setup
  useEffect(() => {
    fetchState();
    fetchCategories();

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Secret Host console hotkey: Ctrl + Shift + H (or Cmd + Shift + H)
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'H' || e.key === 'h')) {
        e.preventDefault();
        soundFx.playClick();
        setShowHostOverride((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Turn timer handler
  useEffect(() => {
    if (screen !== 'ARENA' || !gameState || gameState.is_round_over) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const timerSetting = gameState.settings?.turn_timer || 0;
    if (timerSetting <= 0) {
      setTimeRemaining(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    // Reset timer on turn change
    setTimeRemaining(timerSetting);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          // Timer expired!
          soundFx.playIncorrect();
          handlePassTurn();
          return timerSetting;
        }
        if (prev <= 6) {
          soundFx.playUrgentTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [screen, gameState?.current_turn, gameState?.current_round, gameState?.is_round_over]);

  const toggleFullscreen = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const handleToggleMute = () => {
    const next = soundFx.toggleMuted();
    setIsMuted(next);
    if (!next) soundFx.playCorrect();
  };

  // Pass turn (called when timer expires or skipped)
  const handlePassTurn = async () => {
    try {
      const res = await fetch(`${API_BASE}/game/pass_turn`, { method: 'POST' });
      const data = await res.json();
      setLastGuess({
        text: 'TIME EXPIRED',
        status: 'incorrect',
        message: `TIME'S UP! Strike recorded for ${data.team || 'team'}`
      });
      fetchState();
    } catch (err) {
      console.error('Pass turn error', err);
    }
  };

  // Submit guess
  const submitGuess = async (e) => {
    e.preventDefault();
    if (!guess.trim() || gameState?.is_round_over) return;

    try {
      const res = await fetch(`${API_BASE}/game/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guess: guess.trim() })
      });
      const data = await res.json();

      if (data.status === 'correct') {
        soundFx.playCorrect();
        setLastGuess({
          text: guess,
          status: 'correct',
          message: `CORRECT: ${data.name} (#${data.rank}) +${data.points} pts!`
        });
        setLastRevealedIndex(data.index);
      } else if (data.status === 'exists') {
        soundFx.playIncorrect();
        setLastGuess({
          text: guess,
          status: 'exists',
          message: `ALREADY REVEALED: ${data.name}!`
        });
      } else if (data.status === 'incorrect') {
        soundFx.playIncorrect();
        setLastGuess({
          text: guess,
          status: 'incorrect',
          message: `INCORRECT: ${guess} (Strike for ${data.team})`
        });
      }

      setGuess('');
      await fetchState();
    } catch (err) {
      console.error('Guess failed', err);
    }
  };

  // Start match
  const handleStartMatch = async (matchConfig) => {
    try {
      await fetch(`${API_BASE}/game/start_match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchConfig)
      });
      setLastRevealedIndex(null);
      setLastGuess({ text: '---', status: 'none', message: '' });
      setShowRoundSummary(false);
      setShowMatchPodium(false);
      await fetchState();
      setScreen('ARENA');
    } catch (err) {
      console.error('Start match failed', err);
    }
  };

  // Next round
  const handleNextRound = async () => {
    try {
      soundFx.playCorrect();
      await fetch(`${API_BASE}/game/next_round`, { method: 'POST' });
      setLastRevealedIndex(null);
      setLastGuess({ text: '---', status: 'none', message: '' });
      setShowRoundSummary(false);
      await fetchState();
    } catch (err) {
      console.error('Next round failed', err);
    }
  };

  // Host override
  const handleHostOverride = async (overrideData) => {
    try {
      await fetch(`${API_BASE}/game/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrideData)
      });
      await fetchState();
    } catch (err) {
      console.error('Host override failed', err);
    }
  };

  // Save settings
  const handleSaveSettings = async (newSettings) => {
    try {
      await fetch(`${API_BASE}/game/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
      await fetchState();
    } catch (err) {
      console.error('Settings save failed', err);
    }
  };

  // Save teams
  const handleSaveTeams = async (newTeams) => {
    try {
      await fetch(`${API_BASE}/game/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teams: newTeams })
      });
      await fetchState();
    } catch (err) {
      console.error('Teams save failed', err);
    }
  };

  // Execute confirm action (Give Up / Reset)
  const executeConfirmAction = async () => {
    if (!confirmModal.action) return;
    try {
      if (confirmModal.action === 'give_up') {
        soundFx.playIncorrect();
        await fetch(`${API_BASE}/game/give_up`, { method: 'POST' });
      }
      setConfirmModal({ show: false, action: null, message: '' });
      await fetchState();
    } catch (err) {
      console.error('Confirm action error', err);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#060714] text-white flex flex-col items-center justify-center font-bold tracking-wider relative overflow-hidden">
        <SynthwaveBackground />
        <div className="relative z-10 text-center animate-pulse">
          <div className="text-4xl mb-4">👾</div>
          <div className="text-2xl text-[#00F0FF] uppercase drop-shadow-[0_0_12px_rgba(0,240,255,0.7)]">
            CONNECTING TO CYBER SERVER...
          </div>
        </div>
      </div>
    );
  }

  const isMulti = gameState.match_mode === 'multi';
  const totalRounds = gameState.total_rounds || 1;
  const currentRoundNum = gameState.current_match_round || 1;
  const currentTurnTeam = gameState.teams[gameState.current_turn] || 'Team';
  const maxStrikes = gameState.settings?.max_strikes || 3;

  return (
    <div className="min-h-screen bg-[#060714] text-white flex flex-col relative overflow-x-hidden select-none">
      
      {/* Synthwave animated background */}
      <SynthwaveBackground />

      {/* SCREEN 1: MAIN MENU */}
      {screen === 'MENU' && (
        <MainMenu
          onPlay={() => setScreen('MATCH_SETUP')}
          onHowToPlay={() => setShowHowToPlay(true)}
          onSettings={() => setShowSettings(true)}
          onTeams={() => setShowTeams(true)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* SCREEN 2: MATCH SETUP */}
      {screen === 'MATCH_SETUP' && (
        <div className="py-6">
          <MatchSetup
            categories={categories}
            onStartMatch={handleStartMatch}
            onBack={() => setScreen('MENU')}
            onOpenTeams={() => setShowTeams(true)}
          />
        </div>
      )}

      {/* SCREEN 3: GAME ARENA */}
      {screen === 'ARENA' && (
        <div className="relative z-10 flex flex-col flex-1 p-3 md:p-5 max-w-[1400px] mx-auto w-full">
          
          {/* Header Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-[#0d0c24]/90 border border-[#00F0FF]/30 backdrop-blur-md rounded-2xl p-3 shadow-lg">
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { soundFx.playClick(); setScreen('MENU'); }}
                className="bg-[#17153b] hover:bg-[#252254] text-gray-200 border border-gray-700 px-3 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center gap-1.5"
              >
                <span>◀</span> MENU
              </button>

              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowSettings(true); }}
                className="bg-[#17153b] hover:bg-[#252254] text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-xl text-xs transition"
                title="Settings"
              >
                ⚙️
              </button>

              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowHowToPlay(true); }}
                className="bg-[#17153b] hover:bg-[#252254] text-gray-200 border border-gray-700 px-2.5 py-1.5 rounded-xl text-xs transition"
                title="How to Play"
              >
                📖
              </button>
            </div>

            {/* Round Badge */}
            <div className="flex items-center gap-2">
              <div className="bg-[#1a1740] border border-[#FF007F]/50 px-4 py-1 rounded-full text-xs font-black text-[#FF007F] tracking-widest uppercase shadow-[0_0_10px_rgba(255,0,127,0.3)]">
                {isMulti ? `ROUND ${currentRoundNum} OF ${totalRounds}` : `ROUND ${gameState.current_round + 1}`}
              </div>

              {isMulti && (
                <div className="hidden md:inline-block bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] px-3 py-1 rounded-full text-[11px] font-bold tracking-wider">
                  ⚡ Points Cumulative
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Discrete Host Console Trigger */}
              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowHostOverride(true); }}
                className="bg-[#17153b] hover:bg-red-500/20 text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-500/40 p-2 rounded-xl transition text-xs"
                title="Host Console (Ctrl+Shift+H)"
              >
                🛡️
              </button>

              <button
                type="button"
                onClick={handleToggleMute}
                className="bg-[#17153b] hover:bg-[#252254] text-gray-300 border border-gray-700 p-2 rounded-xl transition text-xs"
                title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              >
                {isMuted ? '🔇' : '🔊'}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="bg-[#17153b] hover:bg-[#252254] text-gray-300 border border-gray-700 p-2 rounded-xl transition text-xs"
                title="Fullscreen"
              >
                {isFullscreen ? '🗗' : '⛶'}
              </button>

              {gameState.is_round_over && (
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setShowRoundSummary(true); }}
                  className="bg-[#FFE600] text-black font-black px-3 py-1.5 rounded-xl text-xs uppercase tracking-wider shadow-[0_0_12px_rgba(255,230,0,0.4)] animate-bounce"
                >
                  RECAP 📊
                </button>
              )}
            </div>

          </div>

          {/* Category Title & Banner */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FFE600] via-[#00F0FF] to-[#FFE600] uppercase tracking-wide drop-shadow-[0_0_15px_rgba(0,240,255,0.6)] px-2">
              {gameState.current_round_title || 'LOADING CATEGORY...'}
            </h1>
            {isMulti && (
              <div className="md:hidden text-[11px] text-[#00F0FF] font-bold tracking-wider mt-1">
                Points are cumulative across rounds
              </div>
            )}
          </div>

          {/* Team Scorecards with Strikes */}
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 mb-4">
            {gameState.teams.map((team, idx) => {
              const isActive = idx === gameState.current_turn && !gameState.is_round_over;
              const isElim = gameState.eliminated?.[idx];
              const strikes = gameState.strikes?.[idx] || 0;

              return (
                <div
                  key={idx}
                  className={`px-4 py-3 rounded-2xl border-2 min-w-[150px] md:min-w-[180px] text-center transition-all duration-300 relative ${
                    isElim
                      ? 'bg-gray-900/80 border-gray-800 opacity-50'
                      : isActive
                      ? 'bg-[#1b1742] border-[#FFE600] shadow-[0_0_20px_rgba(255,230,0,0.4)] scale-105'
                      : 'bg-[#0f0e26]/80 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  {/* Active turn badge */}
                  {isActive && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#FFE600] text-black font-black text-[10px] px-2 py-0.5 rounded-full tracking-wider uppercase">
                      ACTIVE TURN
                    </div>
                  )}

                  {/* Team Name */}
                  <div className="font-black text-xs md:text-sm text-gray-200 truncate mb-1">
                    {team}
                  </div>

                  {/* Score */}
                  <div className="text-2xl md:text-3xl font-black text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
                    {isMulti ? gameState.match_scores[idx] || 0 : gameState.scores[idx] || 0}
                    {isMulti && (
                      <span className="text-[10px] text-gray-400 block font-normal">
                        ({gameState.scores[idx] || 0} this round)
                      </span>
                    )}
                  </div>

                  {/* Strike Indicators */}
                  {maxStrikes > 0 && (
                    <div className="flex items-center justify-center gap-1.5 mt-2">
                      {Array.from({ length: maxStrikes }).map((_, sIdx) => {
                        const hasStrike = sIdx < strikes;
                        return (
                          <span
                            key={sIdx}
                            className={`text-xs font-black transition-all ${
                              hasStrike
                                ? 'text-red-500 drop-shadow-[0_0_6px_rgba(239,68,68,0.8)] scale-110'
                                : 'text-gray-700'
                            }`}
                          >
                            ✖
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {isElim && (
                    <div className="text-[10px] font-black text-red-400 tracking-wider uppercase mt-1">
                      ELIMINATED
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Turn Timer & Active Guess Form */}
          <div className="flex flex-col items-center justify-center mb-4">
            
            {/* Countdown timer display if enabled */}
            {timeRemaining !== null && !gameState.is_round_over && (
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  {currentTurnTeam}'s Turn Time:
                </span>
                <span className={`font-mono font-black text-lg ${
                  timeRemaining <= 5 
                    ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse' 
                    : 'text-[#FFE600]'
                }`}>
                  {timeRemaining}s
                </span>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={submitGuess} className="w-full max-w-xl">
              <div className="relative">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder={gameState.is_round_over ? 'Round Complete' : `Type guess for ${currentTurnTeam}...`}
                  disabled={gameState.is_round_over}
                  className="w-full bg-[#12102e]/95 border-2 border-[#00F0FF]/50 focus:border-[#FFE600] text-white px-5 py-3.5 rounded-2xl text-lg md:text-xl font-bold shadow-[0_0_20px_rgba(0,240,255,0.25)] outline-none text-center transition"
                  autoFocus
                />
              </div>
            </form>

            {/* Last Guess Feedback Pill */}
            {lastGuess.message && (
              <div className={`mt-2.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border shadow-md animate-in fade-in ${
                lastGuess.status === 'correct'
                  ? 'bg-green-500/20 border-green-400 text-green-300'
                  : lastGuess.status === 'exists'
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : lastGuess.status === 'incorrect'
                  ? 'bg-red-500/20 border-red-400 text-red-300'
                  : 'bg-gray-800 border-gray-600 text-gray-300'
              }`}>
                {lastGuess.message}
              </div>
            )}

          </div>

          {/* 10x10 Tile Grid */}
          <div className="grid grid-cols-10 gap-1.5 md:gap-2 max-w-[1280px] mx-auto w-full mb-4 bg-[#0a091f]/80 p-3 md:p-4 rounded-2xl border border-gray-800 shadow-2xl flex-1">
            {Array.from({ length: 100 }).map((_, i) => {
              const rank = i + 1;
              const isRevealed = gameState.revealed_indices.includes(i);
              const isJustRevealed = lastRevealedIndex === i;
              const answerName = gameState.current_round_answers ? gameState.current_round_answers[i] : '';

              return (
                <div
                  key={rank}
                  onClick={() => {
                    if (isRevealed) {
                      soundFx.playClick();
                      const guessingTeam = gameState.revealed_by[i.toString()] || 'UNKNOWN';
                      setFocusedTile({ rank, name: answerName, team: guessingTeam });
                    }
                  }}
                  className={`h-11 sm:h-12 md:h-14 rounded-lg flex items-center justify-center p-1 text-center transition-all cursor-pointer relative overflow-hidden ${
                    isRevealed
                      ? isJustRevealed
                        ? 'bg-[#2ECC40] border-2 border-white text-black font-black z-10 shadow-[0_0_15px_rgba(46,204,64,0.8)] scale-105 animate-tile-reveal'
                        : 'bg-gradient-to-b from-[#FFE600] to-[#E6B800] border border-[#FFE600]/80 text-black font-black shadow-sm'
                      : 'bg-[#141238] hover:bg-[#1f1c54] border border-[#2b2766] hover:border-[#00F0FF]/50 text-gray-400 font-mono font-bold text-xs md:text-sm'
                  }`}
                  title={isRevealed ? `${rank}. ${answerName}` : `Rank #${rank}`}
                >
                  {isRevealed ? (
                    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden leading-tight">
                      <span className="text-[10px] md:text-[11px] font-black line-clamp-2 w-full text-center px-0.5">
                        {answerName}
                      </span>
                      <span className="text-[9px] opacity-75 font-mono">#{rank}</span>
                    </div>
                  ) : (
                    <span>{rank}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between gap-3 pt-1 pb-4">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setConfirmModal({
                  show: true,
                  action: 'give_up',
                  message: 'Are you sure you want to REVEAL ALL remaining answers and conclude this round?'
                });
              }}
              className="bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/50 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition"
            >
              REVEAL ALL (GIVE UP)
            </button>

            {gameState.is_round_over && (
              <button
                type="button"
                onClick={() => { soundFx.playFanfare(); setShowRoundSummary(true); }}
                className="bg-[#00F0FF] hover:bg-[#00d0df] text-black font-black px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider transition shadow-[0_0_15px_rgba(0,240,255,0.4)]"
              >
                VIEW ROUND SUMMARY ➔
              </button>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: TILE DETAIL INSPECTOR */}
      {focusedTile && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setFocusedTile(null)}
        >
          <div
            className="bg-[#100e2b] border-4 border-[#FFE600] p-8 md:p-10 rounded-3xl shadow-[0_0_50px_rgba(255,230,0,0.4)] text-center max-w-2xl w-full cursor-default animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-[#FFE600] font-black tracking-widest text-lg mb-2 uppercase">
              RANK #{focusedTile.rank}
            </div>
            <div className="text-3xl md:text-5xl font-black text-white mb-6 uppercase drop-shadow-[0_0_15px_rgba(255,230,0,0.8)] leading-tight">
              {focusedTile.name}
            </div>
            <div className="bg-[#1c1945] text-gray-200 py-3 px-6 rounded-2xl font-bold border border-[#2d296b] inline-block text-sm shadow-md">
              GUESSED BY: <span className="text-[#00F0FF] ml-2 font-black">{focusedTile.team}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM ACTION */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#100e2b] border-2 border-red-500 p-6 md:p-8 rounded-2xl w-full max-w-md text-center shadow-[0_0_40px_rgba(239,68,68,0.4)]">
            <h2 className="text-xl font-black text-red-400 mb-3 uppercase tracking-wider">
              CONFIRM ACTION
            </h2>
            <p className="text-sm text-gray-300 font-bold mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, action: null, message: '' })}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl font-bold text-sm transition"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2.5 rounded-xl font-black text-sm transition shadow-[0_0_15px_rgba(239,68,68,0.5)]"
              >
                CONFIRM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: HOW TO PLAY */}
      {showHowToPlay && (
        <HowToPlayModal onClose={() => setShowHowToPlay(false)} />
      )}

      {/* MODAL 4: SETTINGS */}
      {showSettings && (
        <SettingsModal
          settings={gameState.settings || {}}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* MODAL 5: TEAMS */}
      {showTeams && (
        <TeamsModal
          teams={gameState.teams || []}
          onSave={handleSaveTeams}
          onClose={() => setShowTeams(false)}
        />
      )}

      {/* MODAL 6: HOST OVERRIDE CONSOLE */}
      {showHostOverride && (
        <HostOverrideModal
          gameState={gameState}
          onOverride={handleHostOverride}
          onClose={() => setShowHostOverride(false)}
        />
      )}

      {/* MODAL 7: ROUND SUMMARY */}
      {showRoundSummary && !showMatchPodium && (
        <RoundSummaryModal
          gameState={gameState}
          onNextRound={handleNextRound}
          onViewPodium={() => {
            setShowRoundSummary(false);
            setShowMatchPodium(true);
          }}
          onInspectBoard={() => setShowRoundSummary(false)}
          onReturnMenu={() => {
            setShowRoundSummary(false);
            setScreen('MENU');
          }}
        />
      )}

      {/* MODAL 8: MATCH PODIUM */}
      {showMatchPodium && (
        <MatchPodiumModal
          gameState={gameState}
          onRematch={() => {
            setShowMatchPodium(false);
            setScreen('MATCH_SETUP');
          }}
          onReturnMenu={() => {
            setShowMatchPodium(false);
            setScreen('MENU');
          }}
        />
      )}

    </div>
  );
}