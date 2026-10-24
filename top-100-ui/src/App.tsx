import React, { useState, useEffect, useRef } from 'react';
import WhirlpoolBackground from './components/WhirlpoolBackground';
import MainMenu from './components/MainMenu';
import MatchSetup from './components/MatchSetup';
import HowToPlayModal from './components/HowToPlayModal';
import SettingsModal from './components/SettingsModal';
import TeamsModal from './components/TeamsModal';
import HostOverrideModal from './components/HostOverrideModal';
import RoundSummaryModal from './components/RoundSummaryModal';
import MatchPodiumModal from './components/MatchPodiumModal';
import { soundFx } from './soundFx';
import {
  GameState,
  Category,
  LastGuess,
  FocusedTile,
  ConfirmModalState,
  MatchConfig,
  HostOverrideData,
  GameSettings
} from './types';

const API_BASE = 'http://127.0.0.1:8000';

export default function App(): React.JSX.Element {
  // Screen state: 'MENU' | 'MATCH_SETUP' | 'ARENA'
  const [screen, setScreen] = useState<'MENU' | 'MATCH_SETUP' | 'ARENA'>('MENU');

  // Balatro Display Mode: 'orange' | 'blue'
  const [displayMode, setDisplayMode] = useState<'orange' | 'blue'>(() => {
    return (localStorage.getItem('top100_display_mode') as 'orange' | 'blue') || 'orange';
  });

  const toggleDisplayMode = (): void => {
    setDisplayMode((prev) => {
      const next = prev === 'orange' ? 'blue' : 'orange';
      localStorage.setItem('top100_display_mode', next);
      return next;
    });
  };

  // Backend state
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modals
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showTeams, setShowTeams] = useState<boolean>(false);
  const [showHostOverride, setShowHostOverride] = useState<boolean>(false);
  const [showRoundSummary, setShowRoundSummary] = useState<boolean>(false);
  const [showMatchPodium, setShowMatchPodium] = useState<boolean>(false);
  const [focusedTile, setFocusedTile] = useState<FocusedTile | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ show: false, action: null, message: '' });

  // Gameplay local state
  const [guess, setGuess] = useState<string>('');
  const [lastGuess, setLastGuess] = useState<LastGuess>({ text: '---', status: 'none', message: '' });
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Turn timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch backend game state
  const fetchState = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/game/state`);
      const data: GameState = await res.json();
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
  const fetchCategories = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/game/categories`);
      const data: Category[] = await res.json();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  // Initial load & hotkey setup
  useEffect(() => {
    fetchState();
    fetchCategories();

    const handleFullscreenChange = (): void => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Secret Host console hotkey: Ctrl + Shift + H (or Cmd + Shift + H)
    const handleKeyDown = (e: KeyboardEvent): void => {
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

  // Pass turn (called when timer expires or skipped)
  const handlePassTurn = async (): Promise<void> => {
    try {
      const res = await fetch(`${API_BASE}/game/pass_turn`, { method: 'POST' });
      const data = await res.json();
      setLastGuess({
        text: 'TIME EXPIRED',
        status: 'incorrect',
        message: `Time is up! Strike recorded for ${data.team || 'team'}`
      });
      fetchState();
    } catch (err) {
      console.error('Pass turn error', err);
    }
  };

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

  const toggleFullscreen = (): void => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // Submit guess
  const submitGuess = async (e: React.FormEvent): Promise<void> => {
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
          message: `CORRECT: ${data.name} (#${data.rank}) +${data.points} pts`
        });
        setLastRevealedIndex(data.index);
      } else if (data.status === 'exists') {
        soundFx.playIncorrect();
        setLastGuess({
          text: guess,
          status: 'exists',
          message: `ALREADY REVEALED: ${data.name}`
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
  const handleStartMatch = async (matchConfig: MatchConfig): Promise<void> => {
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
  const handleNextRound = async (): Promise<void> => {
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
  const handleHostOverride = async (overrideData: HostOverrideData): Promise<void> => {
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
  const handleSaveSettings = async (newSettings: GameSettings): Promise<void> => {
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
  const handleSaveTeams = async (newTeams: string[]): Promise<void> => {
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
  const executeConfirmAction = async (): Promise<void> => {
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
      <div className="min-h-screen bg-[#07030f] text-white flex flex-col items-center justify-center font-bold tracking-wider relative overflow-hidden">
        <WhirlpoolBackground dominantColor={displayMode} />
        <div className="relative z-10 text-center animate-pulse balatro-card px-8 py-5 rounded-2xl">
          <div className="text-xl text-orange-300 uppercase tracking-widest font-black">
            Connecting to server...
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
    <div className="min-h-screen bg-[#07030f] text-white flex flex-col relative overflow-x-hidden select-none">
      
      {/* Balatro Whirlpool background */}
      <WhirlpoolBackground dominantColor={displayMode} />

      {/* SCREEN 1: MAIN MENU */}
      {screen === 'MENU' && (
        <MainMenu
          onPlay={() => setScreen('MATCH_SETUP')}
          onHowToPlay={() => setShowHowToPlay(true)}
          onSettings={() => setShowSettings(true)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
          onToggleDisplayMode={toggleDisplayMode}
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
        <div className="relative z-10 flex flex-col flex-1 p-3 md:p-5 max-w-[1360px] mx-auto w-full">
          
          {/* Header Controls Bar with Bright Balatro Depth */}
          <div className="balatro-panel p-3 rounded-2xl mb-4 flex flex-wrap items-center justify-between gap-3">
            
            {/* Left Controls: Settings & Rules */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowSettings(true); }}
                className="balatro-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-orange-200"
                title="Settings"
              >
                Settings
              </button>

              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowHowToPlay(true); }}
                className="balatro-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-blue-200"
                title="Rules"
              >
                Rules
              </button>
            </div>

            {/* Center: Round Badge (Balatro Orange/Blue Slabs) */}
            <div className="flex items-center gap-2">
              <div className="bg-[#ff6a00] border-2 border-[#9a3412] border-b-4 shadow-[0_3px_0_#2b0c03,inset_0_1.5px_0_rgba(255,255,255,0.3)] px-4 py-1.5 rounded-xl text-xs font-black text-white tracking-wider uppercase">
                {isMulti ? `Round ${currentRoundNum} of ${totalRounds}` : `Round ${gameState.current_round + 1}`}
              </div>

              {isMulti && (
                <div className="hidden md:inline-block bg-[#0091ff] border-2 border-[#1e40af] border-b-4 shadow-[0_3px_0_#091333,inset_0_1.5px_0_rgba(255,255,255,0.3)] text-white px-3.5 py-1 rounded-xl text-[11px] font-black tracking-wide uppercase">
                  Points Cumulative
                </div>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleFullscreen}
                className="balatro-btn-dark px-3.5 py-1.5 rounded-xl text-xs font-black tracking-wider cursor-pointer uppercase text-slate-200"
                title="Fullscreen"
              >
                {isFullscreen ? 'Exit Full' : 'Fullscreen'}
              </button>

              {gameState.is_round_over && (
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setShowRoundSummary(true); }}
                  className="balatro-btn-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
                >
                  Recap
                </button>
              )}
            </div>

          </div>

          {/* Category Title with Vibrant Balatro Shadow */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wide px-2 drop-shadow-[0_4px_0_#0f051c]">
              {gameState.current_round_title || 'Loading Category...'}
            </h1>
            {isMulti && (
              <div className="md:hidden text-xs text-blue-300 font-bold tracking-wide mt-1">
                Points are cumulative across rounds
              </div>
            )}
          </div>

          {/* Team Scorecards with Balatro Depth */}
          {/* STRICTLY RESERVED NEON GLOW FOR CURRENT GUESSER! */}
          <div className="flex flex-wrap justify-center items-center gap-3.5 mb-4">
            {gameState.teams.map((team, idx) => {
              const isActive = idx === gameState.current_turn && !gameState.is_round_over;
              const isElim = gameState.eliminated?.[idx];
              const strikes = gameState.strikes?.[idx] || 0;

              return (
                <div
                  key={idx}
                  className={`px-5 py-3 rounded-2xl min-w-[155px] md:min-w-[185px] text-center transition-all relative ${
                    isElim
                      ? 'opacity-35 balatro-card'
                      : isActive
                      ? 'neon-guesser-highlight bg-[#1f103b]' // RESERVED NEON GLOW FOR CURRENT GUESSER!
                      : 'balatro-card'
                  }`}
                >
                  {/* Active turn indicator tag */}
                  {isActive && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#ff6a00] text-white font-black text-[9px] px-3 py-0.5 rounded-full tracking-wider uppercase shadow-[0_2px_0_rgba(0,0,0,0.5)]">
                      Current Guesser
                    </div>
                  )}

                  {/* Team Name */}
                  <div className="font-black text-xs md:text-sm text-slate-100 truncate mb-1">
                    {team}
                  </div>

                  {/* Score */}
                  <div className="text-2xl md:text-3xl font-black text-white drop-shadow-[0_2px_0_#080414]">
                    {isMulti ? gameState.match_scores[idx] || 0 : gameState.scores[idx] || 0}
                    {isMulti && (
                      <span className="text-[10px] text-slate-400 block font-normal">
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
                                ? 'text-rose-500 drop-shadow-[0_2px_0_#4c0519]'
                                : 'text-slate-700'
                            }`}
                          >
                            X
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {isElim && (
                    <div className="text-[10px] font-black text-rose-400 tracking-wider uppercase mt-1">
                      Eliminated
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Turn Timer & Active Guess Form */}
          <div className="flex flex-col items-center justify-center mb-3">
            
            {/* Countdown timer display if enabled */}
            {timeRemaining !== null && !gameState.is_round_over && (
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-black text-orange-200 uppercase tracking-wider">
                  {currentTurnTeam}'s Turn:
                </span>
                <span className={`font-mono font-black text-lg ${
                  timeRemaining <= 5 
                    ? 'text-rose-400 animate-pulse' 
                    : 'text-amber-300'
                }`}>
                  {timeRemaining}s
                </span>
              </div>
            )}

            {/* Input Form with Balatro Inner Depth */}
            <form onSubmit={submitGuess} className="w-full max-w-lg">
              <input
                type="text"
                value={guess}
                onChange={(e) => setGuess(e.target.value)}
                placeholder={gameState.is_round_over ? 'Round Complete' : `Type guess for ${currentTurnTeam}...`}
                disabled={gameState.is_round_over}
                className="w-full bg-[#0e0a24] border-2 border-[#2f245a] border-b-4 border-b-[#120d2b] focus:border-orange-500 text-white px-5 py-3.5 rounded-2xl text-lg font-black outline-none text-center transition shadow-[inset_0_3px_6px_rgba(0,0,0,0.6),0_4px_0_#070512]"
                autoFocus
              />
            </form>

            {/* Last Guess Feedback Pill */}
            {lastGuess.message && (
              <div className={`mt-2.5 px-4 py-1.5 rounded-xl text-xs font-black tracking-wider uppercase border-2 border-b-4 shadow-[0_3px_0_rgba(0,0,0,0.5)] ${
                lastGuess.status === 'correct'
                  ? 'bg-blue-600 border-blue-900 text-white'
                  : lastGuess.status === 'exists'
                  ? 'bg-orange-600 border-orange-950 text-white'
                  : lastGuess.status === 'incorrect'
                  ? 'bg-rose-700 border-rose-950 text-white'
                  : 'bg-slate-800 border-slate-950 text-slate-200'
              }`}>
                {lastGuess.message}
              </div>
            )}

          </div>

          {/* 10x10 Tile Grid with Balatro Slabs */}
          {/* STRICTLY RESERVED NEON GLOW FOR LAST GUESSED TILE! */}
          <div className="grid grid-cols-10 gap-1.5 md:gap-2 max-w-[1240px] mx-auto w-full mb-3 balatro-panel p-3.5 rounded-2xl flex-1">
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
                  className={`h-11 sm:h-12 md:h-13 rounded-xl flex items-center justify-center p-1 text-center transition-all cursor-pointer relative overflow-hidden ${
                    isRevealed
                      ? isJustRevealed
                        ? 'neon-last-guessed-tile' // RESERVED NEON GLOW FOR LAST GUESSED TILE!
                        : 'balatro-tile-revealed'
                      : 'balatro-tile-unrevealed'
                  }`}
                  title={isRevealed ? `${rank}. ${answerName}` : `Rank #${rank}`}
                >
                  {isRevealed ? (
                    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden leading-tight">
                      <span className="text-[10px] md:text-[11px] font-black line-clamp-2 w-full text-center px-0.5 text-slate-950">
                        {answerName}
                      </span>
                      <span className="text-[9px] opacity-75 font-mono font-bold text-slate-700">#{rank}</span>
                    </div>
                  ) : (
                    <span className="font-black text-white/90 drop-shadow-[0_1px_0_#05040d]">{rank}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between gap-3 pt-1 pb-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setConfirmModal({
                  show: true,
                  action: 'give_up',
                  message: 'Are you sure you want to reveal all remaining answers and conclude this round?'
                });
              }}
              className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer text-rose-300 hover:text-white"
            >
              Reveal All (Give Up)
            </button>

            {gameState.is_round_over && (
              <button
                type="button"
                onClick={() => { soundFx.playFanfare(); setShowRoundSummary(true); }}
                className="balatro-btn-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer"
              >
                View Round Summary
              </button>
            )}
          </div>

        </div>
      )}

      {/* MODAL 1: TILE DETAIL INSPECTOR (Balatro Modal Depth) */}
      {focusedTile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setFocusedTile(null)}
        >
          <div
            className="balatro-modal p-8 rounded-3xl max-w-lg w-full cursor-default text-center animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-orange-400 font-black tracking-widest text-sm mb-1 uppercase">
              Rank #{focusedTile.rank}
            </div>
            <div className="text-3xl md:text-4xl font-black text-white mb-6 uppercase leading-tight drop-shadow-[0_3px_0_#120822]">
              {focusedTile.name}
            </div>
            <div className="bg-[#171336] text-slate-200 py-2.5 px-6 rounded-xl font-black border-2 border-[#2b2158] border-b-4 shadow-[0_3px_0_#090616] inline-block text-xs uppercase tracking-wider">
              Guessed by: <span className="text-white ml-1">{focusedTile.team}</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM ACTION */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="balatro-modal p-7 rounded-2xl w-full max-w-sm text-center">
            <h2 className="text-lg font-black text-rose-400 mb-2 uppercase tracking-wider">
              Confirm Action
            </h2>
            <p className="text-xs text-slate-200 mb-6 leading-relaxed font-bold">
              {confirmModal.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal({ show: false, action: null, message: '' })}
                className="balatro-btn-dark flex-1 py-2.5 rounded-xl font-black text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmAction}
                className="balatro-btn-red flex-1 py-2.5 rounded-xl font-black text-xs uppercase cursor-pointer"
              >
                Confirm
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
          onReturnToMainMenu={() => {
            setShowSettings(false);
            setScreen('MENU');
          }}
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
