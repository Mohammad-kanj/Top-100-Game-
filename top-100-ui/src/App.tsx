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
import PostGameCelebrationModal from './components/PostGameCelebrationModal';
import ConfettiCanvas from './components/ConfettiCanvas';
import BalatroLoadingScreen from './components/BalatroLoadingScreen';
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
  const [setupInitialMode, setSetupInitialMode] = useState<'single' | 'multi' | 'boss_rush'>('single');

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
  const [showCelebration, setShowCelebration] = useState<boolean>(false);
  const [confettiActive, setConfettiActive] = useState<boolean>(false);
  const [showSkipConfirm, setShowSkipConfirm] = useState<boolean>(false);
  const [loadingMatch, setLoadingMatch] = useState<{
    active: boolean;
    message: string;
    round?: number;
    total?: number;
  }>({ active: false, message: 'DEALING 100 TILES...' });
  const [focusedTile, setFocusedTile] = useState<FocusedTile | null>(null);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({ show: false, action: null, message: '' });

  // Gameplay local state
  const [guess, setGuess] = useState<string>('');
  const [lastGuess, setLastGuess] = useState<LastGuess>({ text: '---', status: 'none', message: '' });
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(null);
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Turn timer
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Boss Rush overall timer
  const [bossRushTimeRemaining, setBossRushTimeRemaining] = useState<number | null>(null);
  const bossRushTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fetch backend game state
  const fetchState = async (): Promise<GameState | null> => {
    try {
      const res = await fetch(`${API_BASE}/game/state`);
      const data: GameState = await res.json();
      setGameState(data);
      return data;
    } catch (err) {
      console.error('Failed to connect to backend', err);
      return null;
    }
  };

  // Reset match and cleanly return to main menu
  const returnToMainMenu = async (): Promise<void> => {
    setShowCelebration(false);
    setConfettiActive(false);
    setShowRoundSummary(false);
    setShowMatchPodium(false);
    setShowSettings(false);
    setShowTeams(false);
    setShowHostOverride(false);
    setConsecutiveIncorrect(0);
    setScreen('MENU');
    try {
      await fetch(`${API_BASE}/game/reset_match`, { method: 'POST' });
      await fetchState();
    } catch (err) {
      console.error('Failed to reset match on return to menu', err);
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
      if (e.key === 'Escape' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Trigger celebration, confetti, and victory sound effect when game ends
  const prevIsRoundOverRef = useRef<boolean>(false);
  useEffect(() => {
    if (!gameState) return;
    if (gameState.is_round_over && !prevIsRoundOverRef.current) {
      setShowCelebration(true);
      setConfettiActive(true);
      soundFx.playVictorySound();
    } else if (!gameState.is_round_over) {
      setShowCelebration(false);
      setConfettiActive(false);
    }
    prevIsRoundOverRef.current = gameState.is_round_over;
  }, [gameState?.is_round_over]);

  // Debounce guard to prevent timer / click double-firing
  const isPassingTurnRef = useRef<boolean>(false);

  // Pass turn (called when timer expires or manually clicked)
  const handlePassTurn = async (isManual = false): Promise<void> => {
    if (isPassingTurnRef.current) return;
    isPassingTurnRef.current = true;
    try {
      if (!isManual) {
        soundFx.playIncorrect();
      }
      const res = await fetch(`${API_BASE}/game/pass_turn`, { method: 'POST' });
      await res.json();
      setConsecutiveIncorrect((prev) => prev + 1);
      // Clear last guess so "your turn has been skipped" / "Time is up!" is completely removed
      setLastGuess({
        text: '---',
        status: 'none',
        message: ''
      });
      await fetchState();
    } catch (err) {
      console.error('Pass turn error', err);
    } finally {
      setTimeout(() => {
        isPassingTurnRef.current = false;
      }, 500);
    }
  };

  // Skip / End Category (reveals board, banks points, triggers celebration/summary)
  const handleSkipCategory = async (): Promise<void> => {
    try {
      soundFx.playIncorrect();
      setShowSkipConfirm(false);
      setConsecutiveIncorrect(0);
      await fetch(`${API_BASE}/game/skip_category`, { method: 'POST' });
      await fetchState();
      setShowCelebration(true);
    } catch (err) {
      console.error('Skip category error', err);
    }
  };

  // Reset consecutive incorrect counter on new round
  useEffect(() => {
    setConsecutiveIncorrect(0);
  }, [gameState?.current_round]);

  // Scroll to top automatically when game / arena loads or advances
  useEffect(() => {
    if (screen === 'ARENA') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [screen, gameState?.current_round, gameState?.current_match_round]);

  // Turn timer tracking and pause-on-settings
  const prevTurnKeyRef = useRef<string>('');

  // Reset turn timer when turn or round changes
  useEffect(() => {
    if (screen !== 'ARENA' || !gameState || gameState.is_round_over || gameState.match_mode === 'boss_rush') {
      return;
    }
    const timerSetting = gameState.settings?.turn_timer || 30;
    if (timerSetting <= 0) {
      setTimeRemaining(null);
      prevTurnKeyRef.current = `${gameState.current_round}_${gameState.current_turn}`;
      return;
    }

    const turnKey = `${gameState.current_round}_${gameState.current_turn}`;
    if (prevTurnKeyRef.current !== turnKey) {
      setTimeRemaining(timerSetting);
      prevTurnKeyRef.current = turnKey;
    }
  }, [screen, gameState?.current_turn, gameState?.current_round, gameState?.is_round_over, gameState?.match_mode, gameState?.settings?.turn_timer]);

  // Turn timer countdown ticker (pauses when showSettings is true)
  useEffect(() => {
    if (
      screen !== 'ARENA' ||
      !gameState ||
      gameState.is_round_over ||
      gameState.match_mode === 'boss_rush' ||
      showSettings ||
      timeRemaining === null
    ) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          setTimeout(() => {
            handlePassTurn(false);
          }, 0);
          return null;
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
  }, [screen, gameState?.is_round_over, gameState?.match_mode, showSettings, timeRemaining !== null]);

  // Boss Rush overall match timer handler (pauses when showSettings is true)
  useEffect(() => {
    if (
      screen !== 'ARENA' ||
      !gameState ||
      gameState.match_mode !== 'boss_rush' ||
      gameState.is_round_over ||
      showSettings ||
      bossRushTimeRemaining === null
    ) {
      if (bossRushTimerRef.current) clearInterval(bossRushTimerRef.current);
      return;
    }

    bossRushTimerRef.current = setInterval(() => {
      setBossRushTimeRemaining((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          soundFx.playFanfare();
          fetch(`${API_BASE}/game/boss_rush_expire`, { method: 'POST' }).then(() => fetchState());
          return 0;
        }
        if (prev <= 10) {
          soundFx.playUrgentTick();
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (bossRushTimerRef.current) clearInterval(bossRushTimerRef.current);
    };
  }, [screen, gameState?.match_mode, gameState?.is_round_over, showSettings, bossRushTimeRemaining !== null]);

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
        setConsecutiveIncorrect(0);
        setLastGuess({
          text: guess,
          status: 'correct',
          message: `CORRECT: ${data.name} (#${data.rank}) +${data.points} pts`
        });
        setLastRevealedIndex(data.index);
      } else if (data.status === 'exists') {
        soundFx.playIncorrect();
        setConsecutiveIncorrect((prev) => prev + 1);
        setLastGuess({
          text: guess,
          status: 'exists',
          message: `ALREADY REVEALED: ${data.name}`
        });
      } else if (data.status === 'incorrect') {
        soundFx.playIncorrect();
        setConsecutiveIncorrect((prev) => prev + 1);
        setLastGuess({
          text: guess,
          status: 'incorrect',
          message: `INCORRECT: ${guess}`
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
      setLoadingMatch({
        active: true,
        message: matchConfig.match_mode === 'boss_rush' ? 'PREPARING BOSS RUSH...' : 'DEALING 100 TILES...',
        round: 1,
        total: matchConfig.total_rounds || 1
      });
      await fetch(`${API_BASE}/game/start_match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(matchConfig)
      });
      setLastRevealedIndex(null);
      setConsecutiveIncorrect(0);
      setLastGuess({ text: '---', status: 'none', message: '' });
      setShowCelebration(false);
      setConfettiActive(false);
      setShowRoundSummary(false);
      setShowMatchPodium(false);
      if (matchConfig.match_mode === 'boss_rush') {
        setBossRushTimeRemaining(matchConfig.boss_rush_duration || 300);
      } else {
        setBossRushTimeRemaining(null);
      }
      await fetchState();

      setTimeout(() => {
        soundFx.playCorrect();
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        setScreen('ARENA');
        setLoadingMatch({ active: false, message: '' });
      }, 1200);
    } catch (err) {
      console.error('Start match failed', err);
      setLoadingMatch({ active: false, message: '' });
    }
  };

  // Next round
  const handleNextRound = async (): Promise<void> => {
    try {
      soundFx.playCorrect();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setLoadingMatch({
        active: true,
        message: 'SHUFFLING NEXT CATEGORY...',
        round: (gameState?.current_match_round || 1) + 1,
        total: gameState?.total_rounds || 1
      });
      const res = await fetch(`${API_BASE}/game/next_round`, { method: 'POST' });
      const data = await res.json();
      setLastRevealedIndex(null);
      setConsecutiveIncorrect(0);
      setLastGuess({ text: '---', status: 'none', message: '' });
      setShowCelebration(false);
      setConfettiActive(false);
      setShowRoundSummary(false);
      const nextState = await fetchState();
      setTimeout(() => {
        setLoadingMatch({ active: false, message: '' });
        if (data.is_match_over || nextState?.is_match_over) {
          setShowMatchPodium(true);
        }
      }, 1100);
    } catch (err) {
      console.error('Next round failed', err);
      setLoadingMatch({ active: false, message: '' });
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
      const nextState = await fetchState();
      if (overrideData.action === 'finish_round') {
        setShowRoundSummary(true);
      } else if (nextState?.is_match_over) {
        setShowMatchPodium(true);
      }
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
      setShowRoundSummary(false);
      setShowMatchPodium(false);
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
      setShowRoundSummary(false);
      setShowMatchPodium(false);
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
        setConfirmModal({ show: false, action: null, message: '' });
        await fetchState();
        setShowRoundSummary(true);
      } else {
        setConfirmModal({ show: false, action: null, message: '' });
        await fetchState();
      }
    } catch (err) {
      console.error('Confirm action error', err);
    }
  };

  if (!gameState) {
    return (
      <div className="min-h-screen bg-[#0c1079] text-white flex flex-col items-center justify-center font-bold tracking-wider relative overflow-hidden">
        <WhirlpoolBackground dominantColor="blue" />
        <div className="relative z-10 text-center animate-pulse balatro-card px-8 py-5 rounded-2xl">
          <div className="text-xl text-[#62f6bd] uppercase tracking-widest font-black">
            Connecting to server...
          </div>
        </div>
      </div>
    );
  }

  const isMulti = gameState.match_mode === 'multi';
  const isBossRush = gameState.match_mode === 'boss_rush';
  const totalRounds = gameState.total_rounds || 1;
  const currentRoundNum = gameState.current_match_round || 1;
  const currentTurnTeam = gameState.teams[gameState.current_turn] || 'Team';
  const endCondition = gameState.end_condition || gameState.settings?.end_condition || 'both';
  const pointThreshold = endCondition === 'turns' ? 0 : (gameState.point_threshold || gameState.settings?.point_threshold || 0);
  const maxTurns = gameState.settings?.max_turns || 0;
  const isTurnBased = (endCondition === 'turns' || endCondition === 'both' || maxTurns > 0) && !isBossRush;
  const totalTurnsTaken = (gameState.turns_taken || []).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#0c1079] text-white flex flex-col relative overflow-x-hidden select-none">
      
      {/* Balatro Whirlpool background */}
      <WhirlpoolBackground dominantColor="blue" />

      {/* SCREEN 1: MAIN MENU */}
      {screen === 'MENU' && (
        <MainMenu
          onPlay={() => {
            setSetupInitialMode('single');
            setScreen('MATCH_SETUP');
          }}
          onHowToPlay={() => setShowHowToPlay(true)}
          onSettings={() => setShowSettings(true)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
      )}

      {/* SCREEN 2: MATCH SETUP */}
      {screen === 'MATCH_SETUP' && (
        <div className="py-6">
          <MatchSetup
            categories={categories}
            initialMode={setupInitialMode}
            onStartMatch={handleStartMatch}
            onBack={returnToMainMenu}
            onOpenTeams={() => setShowTeams(true)}
            teams={gameState?.teams || []}
            turnTimer={gameState?.settings?.turn_timer ?? 30}
          />
        </div>
      )}

      {/* SCREEN 3: GAME ARENA */}
      {screen === 'ARENA' && (
        <div className="relative z-10 flex flex-col flex-1 p-3 md:p-5 max-w-[1360px] mx-auto w-full">
          
          {/* Header Controls Bar with Multi-Tone Balatro Depth */}
          <div className="balatro-panel py-2 px-3 sm:px-4 rounded-2xl mb-4 relative flex items-center justify-between gap-3 min-h-[66px]">
            
            {/* Left Controls: Settings & Rules (Icons) */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowSettings(true); }}
                className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#9cf6ff] cursor-pointer transition active:translate-y-0.5"
                title="Settings"
                aria-label="Settings"
              >
                {/* Hamburger / 3 lines icon */}
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <button
                type="button"
                onClick={() => { soundFx.playClick(); setShowHowToPlay(true); }}
                className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#9cf6ff] cursor-pointer transition active:translate-y-0.5"
                title="Rules"
                aria-label="Rules"
              >
                {/* Notebook icon */}
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="5" y="3" width="15" height="18" rx="2" strokeWidth={2} />
                  <line x1="9" y1="8" x2="16" y2="8" strokeWidth={2} strokeLinecap="round" />
                  <line x1="9" y1="12" x2="16" y2="12" strokeWidth={2} strokeLinecap="round" />
                  <line x1="9" y1="16" x2="13" y2="16" strokeWidth={2} strokeLinecap="round" />
                  <line x1="3.5" y1="6" x2="6.5" y2="6" strokeWidth={2} strokeLinecap="round" />
                  <line x1="3.5" y1="11" x2="6.5" y2="11" strokeWidth={2} strokeLinecap="round" />
                  <line x1="3.5" y1="16" x2="6.5" y2="16" strokeWidth={2} strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Center: Mode Badge, Timer, Target (Always dead-center, Round above Target below) */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 z-10 min-w-0">
              {isBossRush ? (
                <div className="bg-[#4a089c] border-2 border-[#62f6bd] border-b-2 shadow-[0_2px_0_#0c1079,inset_0_1px_0_rgba(98,246,189,0.3)] px-3.5 py-1 rounded-xl text-xs font-black text-white tracking-wider uppercase flex items-center gap-2">
                  <span className="text-[#62f6bd]">BOSS RUSH:</span>
                  <span className={`font-mono text-sm ${bossRushTimeRemaining !== null && bossRushTimeRemaining <= 60 ? 'text-rose-300 animate-pulse' : 'text-[#00b6de]'}`}>
                    {bossRushTimeRemaining !== null ? formatTime(bossRushTimeRemaining) : '0:00'}
                  </span>
                </div>
              ) : (
                <>
                  {/* Round Above */}
                  <div className="bg-[#3120cd] border-2 border-[#787bd1] border-b-2 shadow-[0_2px_0_#0c1079,inset_0_1px_0_rgba(156,246,255,0.3)] px-3 py-0.5 rounded-lg text-xs font-black text-[#ffffff] tracking-wider uppercase text-center truncate max-w-full">
                    {isMulti ? `Round ${currentRoundNum} of ${totalRounds}` : `Round ${gameState.current_round + 1}`}
                    {isMulti && (
                      <span className="text-[10px] text-[#62f6bd] ml-1.5 font-bold uppercase tracking-normal">
                        • Cumulative
                      </span>
                    )}
                  </div>

                  {/* Target Below */}
                  {pointThreshold > 0 && (
                    <div className="bg-[#003c5a] border-2 border-[#0071b4] border-b-2 shadow-[0_2px_0_#0c1079,inset_0_1px_0_rgba(156,246,255,0.2)] text-[#62f6bd] px-3 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wide uppercase text-center truncate max-w-full">
                      Target: {pointThreshold} pts
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              {!gameState.is_round_over && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setShowSkipConfirm(true);
                  }}
                  className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 border-white/20 hover:border-rose-400 hover:text-white active:translate-y-0.5 cursor-pointer"
                  title="Surrender Round"
                  aria-label="Surrender Round"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M5 2c-.55 0-1 .45-1 1v18c0 .55.45 1 1 1s1-.45 1-1v-7h13c.67 0 1.15-.65.94-1.28l-1.84-5.52 1.84-5.52C20.15 2.05 19.67 1.4 19 1.4H6V3c0-.55-.45-1-1-1zm1 1.4h12.18l-1.53 4.6 1.53 4.6H6V3.4z" />
                  </svg>
                </button>
              )}

              {!isFullscreen && (
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-slate-200 cursor-pointer transition active:translate-y-0.5"
                  title="Fullscreen"
                  aria-label="Fullscreen"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              )}

              {gameState.is_round_over && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setShowCelebration(true);
                    }}
                    className="balatro-btn-white px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-amber-300 border-amber-400"
                  >
                    🎉 Celebration
                  </button>
                  <button
                    type="button"
                    onClick={() => { soundFx.playClick(); setShowRoundSummary(true); }}
                    className="balatro-btn-dark px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-purple-200"
                  >
                    Breakdown
                  </button>
                </>
              )}
            </div>

          </div>

          {/* End-of-Game Inspection Banner */}
          {gameState.is_round_over && (
            <div className="w-full balatro-modal p-4 md:p-5 rounded-2xl mb-4 text-center animate-in zoom-in-95 border-2 border-[#787bd1] shadow-[0_6px_0_#4a089c]">
              <div className="text-xs font-black tracking-widest text-[#62f6bd] uppercase mb-1">
                {isBossRush
                  ? 'Boss Rush Challenge Complete'
                  : 'Results'}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase drop-shadow-[0_2px_0_#0c1079] mb-1">
                {isBossRush
                  ? `Solo Run Finished: ${gameState.scores[0] || 0} Points!`
                  : gameState.surrendered
                  ? (gameState.winner
                    ? `Round Surrendered — ${gameState.winner} Led with ${Math.max(...(isMulti ? gameState.match_scores : gameState.scores))} Pts!`
                    : 'Round Surrendered — All Answers Revealed')
                  : gameState.winner && pointThreshold > 0 && Math.max(...(isMulti ? gameState.match_scores : gameState.scores)) >= pointThreshold
                  ? `${gameState.winner} Reached ${pointThreshold} Pts & Won!`
                  : gameState.winner
                  ? `${gameState.winner} Finished in 1st Place!`
                  : 'All Remaining Answers Revealed'}
              </h2>
              <p className="text-xs text-[#9cf6ff]/90 font-bold mb-3">
                {isBossRush
                  ? `Found ${gameState.revealed_indices.filter((idx) => gameState.revealed_by[idx.toString()] !== 'MISSED').length} of 100 tiles. Click any tile on the board below to inspect!`
                  : gameState.surrendered
                  ? 'Round was surrendered. Click any tile on the board below to inspect!'
                  : 'Unanswered tiles are highlighted below. Click any tile on the board to inspect!'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playVictorySound();
                    setShowCelebration(true);
                  }}
                  className="balatro-btn-teal font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md text-[#003c5a]"
                >
                  Results & Wheel
                </button>
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setShowRoundSummary(true); }}
                  className="balatro-btn-cyan font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md text-[#0c1079]"
                >
                  View Breakdown
                </button>
                {isMulti && totalRounds > 1 && !gameState.is_match_over && (
                  <button
                    type="button"
                    onClick={handleNextRound}
                    className="balatro-btn-purple font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md"
                  >
                    Next Category
                  </button>
                )}
                <button
                  type="button"
                  onClick={returnToMainMenu}
                  className="balatro-btn-dark font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer text-[#9cf6ff]"
                >
                  Main Menu
                </button>
              </div>
            </div>
          )}

          {/* Category Title with Vibrant Balatro Shadow */}
          <div className="mb-4 text-center">
            <h1 className="text-2xl md:text-3xl font-black text-[#62f6bd] uppercase tracking-wide px-2 drop-shadow-[0_4px_0_#0c1079]">
              {gameState.current_round_title || 'Loading Category...'}
            </h1>
            {isMulti && !isBossRush && (
              <div className="md:hidden text-xs text-[#00b6de] font-bold tracking-wide mt-1">
                Points are cumulative across rounds
              </div>
            )}
          </div>

          {/* Team Scorecards with Balatro Depth (No Strikes!) */}
          <div className="flex flex-wrap justify-center items-center gap-3.5 mb-4">
            {gameState.teams.map((team, idx) => {
              const isActive = idx === gameState.current_turn && !gameState.is_round_over && !isBossRush;
              const currentScore = isMulti ? gameState.match_scores[idx] || 0 : gameState.scores[idx] || 0;
              const target = pointThreshold;

              return (
                <div
                  key={idx}
                  className={`px-5 py-3 rounded-2xl min-w-[155px] md:min-w-[185px] text-center transition-all relative ${
                    isActive
                      ? 'neon-guesser-highlight bg-[#3120cd]'
                      : 'balatro-card'
                  }`}
                >
                  {/* Team Name */}
                  <div className="font-black text-xs md:text-sm text-white truncate mb-1">
                    {team}
                  </div>

                  {/* Score */}
                  <div className="text-2xl md:text-3xl font-black text-[#62f6bd] drop-shadow-[0_2px_0_#0c1079] leading-tight">
                    {currentScore} <span className="text-xs text-[#00b6de] font-bold uppercase">pts</span>
                  </div>

                  {/* Turn count display when turn-based */}
                  {isTurnBased && (
                    <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-[#0c1079] border border-[#787bd1] inline-flex items-center gap-1 shadow-inner">
                      <span className="text-[10px] font-mono font-bold text-[#9cf6ff]">
                        {maxTurns > 0 
                          ? `Turns: ${gameState.turns_taken?.[idx] || 0}/${maxTurns}`
                          : `Turns: ${gameState.turns_taken?.[idx] || 0}`
                        }
                      </span>
                      {maxTurns > 0 && (
                        <span className="text-[9px] text-[#00b6de] font-semibold">
                          ({Math.max(0, maxTurns - (gameState.turns_taken?.[idx] || 0))} left)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Point threshold progress bar */}
                  {target > 0 && !isBossRush && (
                    <div className="mt-2 w-full">
                      <div className="w-full bg-[#0c1079] rounded-full h-1.5 overflow-hidden border border-[#0071b4]">
                        <div
                          className="bg-gradient-to-r from-[#107dee] via-[#00b6de] to-[#62f6bd] h-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((currentScore / target) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls Row: Left = Most Recent Guess Box, Center = Turn Timer & Guess Form, Right = Symmetrical Spacer */}
          <div className="w-full max-w-[1240px] mx-auto mb-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-3 relative">
            
            {/* Box on the far left: Most Recent Guess */}
            <div className="w-full md:w-64 balatro-card p-3 rounded-2xl border-2 border-[#0071b4] flex flex-col justify-between shrink-0 shadow-[0_4px_0_#0c1079]">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#9cf6ff] flex items-center justify-between mb-1.5 pb-1 border-b border-[#0071b4]/40">
                <span>Recent Guess</span>
                {lastGuess.status !== 'none' && (
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                    lastGuess.status === 'correct'
                      ? 'bg-[#62f6bd] text-[#003c5a] shadow-[0_1px_0_#087d6a]'
                      : lastGuess.status === 'exists'
                      ? 'bg-[#107dee] text-white shadow-[0_1px_0_#0c1079]'
                      : 'bg-rose-700 text-white shadow-[0_1px_0_#0c1079]'
                  }`}>
                    {lastGuess.status === 'correct' ? 'Correct' : lastGuess.status === 'exists' ? 'Duplicate' : 'Incorrect'}
                  </span>
                )}
              </div>

              <div className="min-h-[42px] flex flex-col justify-center">
                {lastGuess.status === 'none' ? (
                  <span className="text-[11px] text-[#6ad6cd]/60 italic">Awaiting first guess...</span>
                ) : (
                  <>
                    <div className="text-sm font-black text-white truncate" title={lastGuess.text}>
                      "{lastGuess.text}"
                    </div>
                    {lastGuess.status === 'correct' && (
                      <div className="text-[10px] text-[#62f6bd] font-mono font-bold truncate mt-0.5">
                        {lastGuess.message}
                      </div>
                    )}
                    {lastGuess.status === 'exists' && (
                      <div className="text-[10px] text-[#00b6de] font-mono font-bold truncate mt-0.5">
                        Already Found
                      </div>
                    )}
                    {lastGuess.status === 'incorrect' && (
                      <div className="text-[10px] text-rose-300 font-mono font-bold mt-0.5">
                        Incorrect (Not in Top 100)
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Center: Turn Timer & Active Guess Form */}
            <div className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-center">
              {/* Turn indicator and countdown timer if enabled */}
              {!isBossRush && !gameState.is_round_over && (
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-black text-[#9cf6ff] uppercase tracking-wider">
                    {currentTurnTeam}'s Turn
                    {isTurnBased && maxTurns > 0 && (
                      <span className="text-[#00b6de] ml-1.5 font-mono text-[11px]">
                        (Turn {(gameState.turns_taken?.[gameState.current_turn] || 0) + 1} of {maxTurns})
                      </span>
                    )}
                    :
                  </span>
                  {timeRemaining !== null && (
                    <span className={`font-mono font-black text-lg ${
                      timeRemaining <= 5 
                        ? 'text-rose-400 animate-pulse' 
                        : 'text-[#62f6bd]'
                    }`}>
                      {timeRemaining}s
                    </span>
                  )}
                </div>
              )}

              {/* Input Form with Balatro Inner Depth */}
              <form onSubmit={submitGuess} className="w-full">
                <input
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder={
                    gameState.is_round_over
                      ? 'Round Complete - Inspect Board Below'
                      : isBossRush
                      ? 'Solo Run: Type any answer on this board...'
                      : `Type guess for ${currentTurnTeam}...`
                  }
                  disabled={gameState.is_round_over}
                  className="w-full bg-[#003c5a] border-2 border-[#0071b4] border-b-4 border-b-[#0c1079] focus:border-[#62f6bd] text-[#62f6bd] placeholder:text-[#4d6b75] px-5 py-3.5 rounded-2xl text-lg font-black outline-none text-center transition shadow-[inset_0_3px_6px_rgba(12,16,121,0.6),0_4px_0_#0c1079]"
                  autoFocus
                />
              </form>

              {/* Pass Turn Button for untimed or manual turn skip */}
              {!isBossRush && !gameState.is_round_over && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      handlePassTurn(true);
                    }}
                    className="balatro-btn-dark px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#9cf6ff] cursor-pointer hover:text-white"
                  >
                    Pass Turn
                  </button>
                </div>
              )}

              {/* Stall prompt after 10 consecutive incorrect guesses (resets on correct guess) */}
              {consecutiveIncorrect >= 10 && !gameState.is_round_over && (
                <div className="w-full mt-2.5 p-2.5 px-4 bg-[#0c1079] border border-[#787bd1] rounded-xl flex items-center justify-between gap-3 text-xs text-[#9cf6ff] animate-in fade-in shadow-[0_3px_0_#0c1079]">
                  <div className="flex items-center gap-2 text-left">
                    <span>💡</span>
                    <span>Stalled after {consecutiveIncorrect} consecutive incorrect guesses? You can surrender this category anytime to bank points!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setShowSkipConfirm(true);
                    }}
                    className="balatro-btn-teal text-[#003c5a] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider text-sm shrink-0 cursor-pointer flex items-center justify-center"
                    title="Surrender Round"
                    aria-label="Surrender Round"
                  >
                    🏳️
                  </button>
                </div>
              )}
            </div>

            {/* Right: Symmetrical desktop spacer to keep the center input centered */}
            <div className="hidden md:block w-64 shrink-0 pointer-events-none" />

          </div>

          {/* 10x10 Tile Grid with Balatro Slabs */}
          <div className="grid grid-cols-10 gap-1.5 md:gap-2 max-w-[1240px] mx-auto w-full mb-3 balatro-panel p-3.5 rounded-2xl flex-1">
            {Array.from({ length: 100 }).map((_, i) => {
              const rank = i + 1;
              const isRevealed = gameState.revealed_indices.includes(i);
              const isJustRevealed = lastRevealedIndex === i;
              const answerName = gameState.current_round_answers ? gameState.current_round_answers[i] : '';
              const revealedBy = gameState.revealed_by[i.toString()];
              const isMissed = revealedBy === 'MISSED' || revealedBy === 'UNANSWERED';

              if (isRevealed && isMissed) {
                return (
                  <div
                    key={rank}
                    onClick={() => {
                      soundFx.playClick();
                      setFocusedTile({ rank, name: answerName, team: 'Unanswered (Missed)', isMissed: true });
                    }}
                    className="h-11 sm:h-12 md:h-13 rounded-xl flex items-center justify-center p-1 text-center transition-all cursor-pointer relative overflow-hidden bg-[#4a089c] border-2 border-[#787bd1]/50 border-b-[#0c1079] text-slate-300 shadow-[0_2px_0_#0c1079]"
                    title={`Rank #${rank} (Missed): ${answerName}`}
                  >
                    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden leading-tight">
                      <span className="text-[10px] md:text-[11px] font-black line-clamp-2 w-full text-center px-0.5 text-slate-200">
                        {answerName}
                      </span>
                      <span className="text-[9px] opacity-80 font-mono font-bold text-[#787bd1]">#{rank}</span>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={rank}
                  onClick={() => {
                    if (isRevealed) {
                      soundFx.playClick();
                      setFocusedTile({ rank, name: answerName, team: revealedBy || 'UNKNOWN' });
                    }
                  }}
                  className={`h-11 sm:h-12 md:h-13 rounded-xl flex items-center justify-center p-1 text-center transition-all cursor-pointer relative overflow-hidden ${
                    isRevealed
                      ? isJustRevealed
                        ? 'neon-last-guessed-tile'
                        : 'balatro-tile-revealed'
                      : 'balatro-tile-unrevealed'
                  }`}
                  title={isRevealed ? `${rank}. ${answerName} (${revealedBy || 'Found'})` : `Rank #${rank}`}
                >
                  {isRevealed ? (
                    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden leading-tight">
                      <span className="text-[10px] md:text-[11px] font-black line-clamp-2 w-full text-center px-0.5 text-[#003c5a]">
                        {answerName}
                      </span>
                      <span className="text-[9px] opacity-90 font-mono font-black text-[#087d6a]">#{rank}</span>
                    </div>
                  ) : (
                    <span className="font-black text-[#9cf6ff] drop-shadow-[0_1px_0_#0c1079]">{rank}</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Actions (Give Up button removed!) */}
          {gameState.is_round_over && (
            <div className="flex items-center justify-end gap-3 pt-1 pb-3">
              <button
                type="button"
                onClick={() => { soundFx.playFanfare(); setShowRoundSummary(true); }}
                className="balatro-btn-white px-6 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md"
              >
                View Round Summary
              </button>
            </div>
          )}

        </div>
      )}

      {/* MODAL 1: TILE DETAIL INSPECTOR (Balatro Modal Depth) */}
      {focusedTile && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 cursor-pointer"
          onClick={() => setFocusedTile(null)}
        >
          <div
            className={`balatro-modal p-8 rounded-3xl max-w-lg w-full cursor-default text-center animate-in zoom-in-95 ${
              focusedTile.isMissed ? 'border-[#787bd1]' : ''
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`font-black tracking-widest text-sm mb-1 uppercase ${focusedTile.isMissed ? 'text-slate-400' : 'text-[#62f6bd]'}`}>
              Rank #{focusedTile.rank} • {focusedTile.rank} {focusedTile.rank === 1 ? 'Point' : 'Points'}
            </div>
            <div className="text-3xl md:text-4xl font-black text-white mb-6 uppercase leading-tight drop-shadow-[0_3px_0_#0c1079]">
              {focusedTile.name}
            </div>
            {focusedTile.isMissed ? (
              <div className="bg-[#4a089c] text-slate-300 py-2.5 px-6 rounded-xl font-black border-2 border-[#787bd1] border-b-4 shadow-[0_3px_0_#0c1079] inline-block text-xs uppercase tracking-wider">
                Status: <span className="text-white ml-1">Not Guessed (Missed)</span>
              </div>
            ) : (
              <div className="bg-[#003c5a] text-[#62f6bd] py-2.5 px-6 rounded-xl font-black border-2 border-[#62f6bd] border-b-4 shadow-[0_3px_0_#0c1079] inline-block text-xs uppercase tracking-wider">
                Guessed by: <span className="text-white ml-1">{focusedTile.team}</span>
              </div>
            )}
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
          settings={gameState?.settings || {}}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onQuitGame={screen === 'ARENA' ? returnToMainMenu : undefined}
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
      {screen === 'ARENA' && showRoundSummary && !showMatchPodium && (
        <RoundSummaryModal
          gameState={gameState}
          onNextRound={handleNextRound}
          onViewPodium={() => {
            setShowRoundSummary(false);
            setShowMatchPodium(true);
          }}
          onInspectBoard={() => setShowRoundSummary(false)}
          onReturnMenu={returnToMainMenu}
        />
      )}

      {/* MODAL 8: MATCH PODIUM */}
      {screen === 'ARENA' && showMatchPodium && (
        <MatchPodiumModal
          gameState={gameState}
          onRematch={() => {
            setShowMatchPodium(false);
            setScreen('MATCH_SETUP');
          }}
          onReturnMenu={returnToMainMenu}
        />
      )}

      {/* CONFETTI CANVAS BURST */}
      <ConfettiCanvas active={confettiActive} durationMs={6000} />

      {/* MODAL 9: POST-GAME CELEBRATION & SCROLLING WHEEL */}
      {screen === 'ARENA' && showCelebration && gameState && (
        <PostGameCelebrationModal
          gameState={gameState}
          onInspectBoard={() => setShowCelebration(false)}
          onNextRound={handleNextRound}
          onReturnMenu={returnToMainMenu}
        />
      )}

      {/* MODAL 10: SURRENDER ROUND CONFIRMATION */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in-95 border-rose-600">
            <div className="text-4xl mb-2">🏳️</div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
              Surrender Round?
            </h3>
            <p className="text-sm text-purple-200/80 mb-6 font-semibold leading-relaxed">
              All remaining unrevealed answers will be revealed, current points will be banked, and you will advance to the results.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowSkipConfirm(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipCategory}
                className="balatro-btn-red px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-white shadow-lg flex items-center gap-1.5"
              >
                <span>🏳️</span>
                <span>Yes, Surrender</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BALATRO-STYLE ARCADE LOADING SCREEN */}
      {loadingMatch.active && (
        <BalatroLoadingScreen
          message={loadingMatch.message}
          roundNumber={loadingMatch.round}
          totalRounds={loadingMatch.total}
        />
      )}

    </div>
  );
}
