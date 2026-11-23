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
import OnlineLobbyModal from './components/OnlineLobbyModal';
import ConfettiCanvas from './components/ConfettiCanvas';
import BalatroLoadingScreen from './components/BalatroLoadingScreen';
import { soundFx } from './soundFx';
import { useOnlineGame } from './hooks/useOnlineGame';
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

const getApiBase = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname) {
    if (window.location.port && window.location.port !== '8000') {
      return `${window.location.protocol}//${window.location.hostname}:8000`;
    }
    return `${window.location.protocol}//${window.location.host}`;
  }
  return 'http://127.0.0.1:8000';
};
const API_BASE = getApiBase();

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
  const [showOnlineLobby, setShowOnlineLobby] = useState<boolean>(false);
  const [showTeams, setShowTeams] = useState<boolean>(false);
  const [pendingMatchConfig, setPendingMatchConfig] = useState<MatchConfig | null>(null);
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
  const [showLeaveLobbyConfirm, setShowLeaveLobbyConfirm] = useState<boolean>(false);
  const [showReturnToLobbyConfirm, setShowReturnToLobbyConfirm] = useState<boolean>(false);

  // Online Multiplayer WebSocket hook
  const online = useOnlineGame();

  // Online category picker and match settings state
  const [isPickingOnlineCategories, setIsPickingOnlineCategories] = useState<boolean>(false);
  const [onlineMatchSettings, setOnlineMatchSettings] = useState<{
    isConfigured: boolean;
    matchMode: 'single' | 'multi' | 'boss_rush';
    totalRounds: number;
    selectedCategoryIndices: number[];
    turnTimer: number;
    pointThreshold: number;
    maxTurns: number;
    endCondition: 'both' | 'turns' | 'points';
    bossRushDuration?: number;
  }>({
    isConfigured: false,
    matchMode: 'single',
    totalRounds: 3,
    selectedCategoryIndices: [],
    turnTimer: 30,
    pointThreshold: 500,
    maxTurns: 0,
    endCondition: 'both',
    bossRushDuration: 300
  });

  // Gameplay local state
  const [guess, setGuess] = useState<string>('');
  const guessInputRef = useRef<HTMLInputElement>(null);
  const [lastGuess, setLastGuess] = useState<LastGuess>({ text: '---', status: 'none', message: '' });
  const [lastRevealedIndex, setLastRevealedIndex] = useState<number | null>(null);
  const [consecutiveIncorrect, setConsecutiveIncorrect] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [surrenderSecondsLeft, setSurrenderSecondsLeft] = useState<number>(60);
  const [surrenderOnCooldown, setSurrenderOnCooldown] = useState<boolean>(false);

  // Color Theme Mode (Red vs Blue)
  const [colorTheme, setColorTheme] = useState<'red' | 'blue'>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('top100_color_theme') === 'blue' ? 'blue' : 'red';
    }
    return 'red';
  });

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-blue', colorTheme === 'blue');
    }
  }, [colorTheme]);

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
    setShowLeaveLobbyConfirm(false);
    setShowReturnToLobbyConfirm(false);
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

  // Main Menu click handler with leave confirmation (R5)
  const handleRequestMainMenu = (): void => {
    soundFx.playClick();
    if (isOnline) {
      setShowLeaveLobbyConfirm(true);
    } else {
      returnToMainMenu();
    }
  };

  const handleConfirmLeaveLobby = (): void => {
    soundFx.playClick();
    setShowLeaveLobbyConfirm(false);
    online.leaveLobby();
    returnToMainMenu();
  };

  const handleMainMenuClick = handleRequestMainMenu;

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

    // Initialize display brightness from localStorage
    if (typeof localStorage !== 'undefined') {
      const savedB = localStorage.getItem('top100_brightness');
      if (savedB) {
        const val = parseFloat(savedB);
        if (!isNaN(val)) {
          document.documentElement.style.filter = `brightness(${val / 100})`;
        }
      }
    }

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

  // Online Multiplayer State Synchronization
  const isOnline = Boolean(online.roomInfo && online.roomInfo.status === 'PLAYING');
  const activeGameState: GameState = (isOnline && online.roomInfo?.game_state)
    ? online.roomInfo.game_state
    : (gameState as GameState);
  const myOnlinePlayer = online.roomInfo?.players.find((p) => p.player_id === online.myPlayerId);
  const isOnlineBossRush = activeGameState?.match_mode === 'boss_rush';
  const isMyTurn = isOnline ? (isOnlineBossRush || online.roomInfo?.active_player_id === online.myPlayerId) : true;
  const canSurrenderOnline = isOnline && (isOnlineBossRush || Boolean(myOnlinePlayer?.eligible_for_surrender));

  // In-Game Settings Quit handler (leaves online lobby if in multiplayer, then resets match and returns to menu)
  const handleQuitGame = (): void => {
    handleMainMenuClick();
  };

  // Active modal / overlay guard for focus management (R3.1)
  const isAnyModalActive = Boolean(
    showLeaveLobbyConfirm ||
    showReturnToLobbyConfirm ||
    showCelebration ||
    showRoundSummary ||
    showMatchPodium ||
    showSettings ||
    showHowToPlay ||
    showTeams ||
    showHostOverride ||
    showSkipConfirm ||
    showOnlineLobby ||
    loadingMatch.active ||
    focusedTile !== null ||
    confirmModal.show ||
    (online.roomInfo?.surrender_vote && surrenderSecondsLeft > 0)
  );

  // R3.1: Turn Input Auto-Focus during screen === 'ARENA' (Boss Rush Goal: point_threshold pts)
  // When a player's turn begins, automatically call .focus() on the input element via useRef + useEffect.
  // Guarded so it does NOT steal focus if any modal or overlay is active.
  useEffect(() => {
    if (
      screen === 'ARENA' &&
      !activeGameState?.is_round_over &&
      isMyTurn &&
      !showSettings &&
      !showHowToPlay &&
      !showCelebration &&
      !showLeaveLobbyConfirm &&
      !isAnyModalActive
    ) {
      const timer = setTimeout(() => {
        if (guessInputRef.current) {
          guessInputRef.current.focus();
          const len = guessInputRef.current.value.length;
          guessInputRef.current.setSelectionRange(len, len);
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [
    screen,
    activeGameState?.is_round_over,
    isMyTurn,
    activeGameState?.current_turn,
    activeGameState?.current_round,
    showSettings,
    showHowToPlay,
    showCelebration,
    showLeaveLobbyConfirm,
    isAnyModalActive
  ]);

  // Auto-mount Online Lobby modal if ?room= query param is present on mount (R1)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('room')) {
        setShowOnlineLobby(true);
      }
    }
  }, []);

  // Transition into or out of online arena
  useEffect(() => {
    if (online.roomInfo?.status === 'PLAYING') {
      soundFx.playFanfare();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setScreen('ARENA');
      setShowOnlineLobby(false);
      setShowCelebration(false);
      setLastRevealedIndex(null);
      setLastGuess({ text: '---', status: 'none', message: '' });
      if (online.roomInfo?.game_state?.match_mode === 'boss_rush') {
        const dur = online.roomInfo.game_state.boss_rush_duration || 300;
        setBossRushTimeRemaining(dur);
      } else {
        setBossRushTimeRemaining(null);
      }
    } else if (online.roomInfo?.status === 'LOBBY' && screen === 'ARENA') {
      soundFx.playClick();
      setScreen('MENU');
      setShowOnlineLobby(true);
      setShowCelebration(false);
      setShowRoundSummary(false);
      setShowMatchPodium(false);
    }
  }, [online.roomInfo?.status, screen]);

  // Synchronize incoming online guess results
  useEffect(() => {
    if (online.lastOnlineResult) {
      const res = online.lastOnlineResult;
      const isMyGuess = !res.player_id || res.player_id === online.myPlayerId;
      if (res.status === 'correct') {
        if (isMyGuess) {
          setConsecutiveIncorrect(0);
        }
        setLastGuess({
          text: res.guess,
          status: 'correct',
          message: res.name,
          points: res.points,
          rank: res.rank,
          resolvedName: res.name
        });
        setLastRevealedIndex(res.index);
      } else if (res.status === 'exists') {
        if (isMyGuess) {
          setConsecutiveIncorrect((prev) => prev + 1);
        }
        setLastGuess({
          text: res.guess,
          status: 'exists',
          message: `Already Revealed: ${res.name}`,
          resolvedName: res.name
        });
      } else if (res.status === 'incorrect') {
        if (isMyGuess) {
          setConsecutiveIncorrect((prev) => prev + 1);
        }
        setLastGuess({
          text: res.guess,
          status: 'incorrect',
          message: 'Not in Top 100'
        });
      }
    } else if (isOnline) {
      setLastGuess({ text: '---', status: 'none', message: '' });
      setLastRevealedIndex(null);
    }
  }, [online.lastOnlineResult, isOnline, online.myPlayerId]);

  // Online surrender vote countdown timer
  useEffect(() => {
    if (!online.roomInfo?.surrender_vote) {
      setSurrenderSecondsLeft(60);
      return;
    }
    const updateCountdown = (): void => {
      if (!online.roomInfo?.surrender_vote) return;
      const left = Math.max(0, Math.ceil(online.roomInfo.surrender_vote.expires_at - Date.now() / 1000));
      setSurrenderSecondsLeft(left);
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [online.roomInfo?.surrender_vote]);

  // Trigger celebration, confetti, and victory sound effect when game ends
  const prevIsRoundOverRef = useRef<boolean>(false);
  useEffect(() => {
    const curRoundOver = activeGameState?.is_round_over || activeGameState?.is_match_over;
    if (curRoundOver && !prevIsRoundOverRef.current) {
      const isReduceMotion = typeof localStorage !== 'undefined' && localStorage.getItem('top100_reduce_motion') === 'true';
      setShowCelebration(true);
      if (!isReduceMotion) {
        setConfettiActive(true);
      }
      soundFx.playVictorySound();
    } else if (!curRoundOver) {
      setShowCelebration(false);
      setConfettiActive(false);
    }
    prevIsRoundOverRef.current = Boolean(curRoundOver);
  }, [activeGameState?.is_round_over, activeGameState?.is_match_over]);

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
      if (isOnline) {
        if (!isMyTurn && !online.isHost) return;
        online.passOnlineTurn();
        return;
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

  // Reset consecutive incorrect counter and surrender cooldown on new round
  useEffect(() => {
    setConsecutiveIncorrect(0);
    setSurrenderOnCooldown(false);
    setGuess('');
  }, [activeGameState?.current_round, activeGameState?.current_match_round]);

  // When consecutive incorrect answers reach 3, clear the surrender cooldown
  useEffect(() => {
    if (consecutiveIncorrect >= 3) {
      setSurrenderOnCooldown(false);
    }
  }, [consecutiveIncorrect]);

  // Scroll to top automatically when game / arena loads or advances
  useEffect(() => {
    if (screen === 'ARENA') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, [screen, activeGameState?.current_round, activeGameState?.current_match_round]);

  // Turn timer tracking and pause-on-settings
  const prevTurnKeyRef = useRef<string>('');

  // Synchronize timer from server when online (server-authoritative)
  useEffect(() => {
    if (!isOnline) return;
    if (activeGameState?.match_mode === 'boss_rush') {
      if (online.roomInfo?.boss_rush_expires_at) {
        const left = Math.max(0, Math.ceil(online.roomInfo.boss_rush_expires_at - Date.now() / 1000));
        setBossRushTimeRemaining(left);
      }
      return;
    }

    if (online.roomInfo?.turn_expires_at) {
      const left = Math.max(0, Math.ceil(online.roomInfo.turn_expires_at - Date.now() / 1000));
      setTimeRemaining(left);
    } else {
      setTimeRemaining(null);
    }
  }, [
    isOnline,
    online.roomInfo?.turn_expires_at,
    online.roomInfo?.boss_rush_expires_at,
    activeGameState?.current_turn,
    activeGameState?.current_round,
    activeGameState?.turns_taken
  ]);

  // Reset turn timer when turn or round changes (local / offline play)
  useEffect(() => {
    if (isOnline) return;
    if (screen !== 'ARENA' || !activeGameState || activeGameState.is_round_over || activeGameState.match_mode === 'boss_rush') {
      return;
    }
    const timerSetting = activeGameState.settings?.turn_timer ?? 30;
    if (timerSetting <= 0) {
      setTimeRemaining(null);
      prevTurnKeyRef.current = `${activeGameState.current_round}_${activeGameState.current_turn}`;
      return;
    }

    const totalTurns = activeGameState.turns_taken?.reduce((a, b) => a + b, 0) ?? 0;
    const turnKey = `${activeGameState.current_round}_${activeGameState.current_turn}_${totalTurns}`;
    if (prevTurnKeyRef.current !== turnKey) {
      setTimeRemaining(timerSetting);
      prevTurnKeyRef.current = turnKey;
    }
  }, [isOnline, screen, activeGameState?.current_turn, activeGameState?.current_round, activeGameState?.turns_taken, activeGameState?.is_round_over, activeGameState?.match_mode, activeGameState?.settings?.turn_timer]);

  // Turn timer countdown ticker (pauses when showSettings is true)
  useEffect(() => {
    if (
      screen !== 'ARENA' ||
      !activeGameState ||
      activeGameState.is_round_over ||
      activeGameState.match_mode === 'boss_rush' ||
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
          if (!isOnline) {
            setTimeout(() => {
              handlePassTurn(false);
            }, 0);
          }
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
  }, [screen, isOnline, activeGameState?.is_round_over, activeGameState?.match_mode, showSettings, timeRemaining !== null]);

  // Boss Rush overall match timer handler (pauses when showSettings is true)
  useEffect(() => {
    if (
      screen !== 'ARENA' ||
      !activeGameState ||
      activeGameState.match_mode !== 'boss_rush' ||
      activeGameState.is_round_over ||
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
          if (isOnline) {
            online.expireBossRush();
          } else {
            fetch(`${API_BASE}/game/boss_rush_expire`, { method: 'POST' }).then(() => fetchState());
          }
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
  }, [screen, activeGameState?.match_mode, activeGameState?.is_round_over, showSettings, bossRushTimeRemaining !== null, isOnline]);

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
    if (!guess.trim() || activeGameState?.is_round_over) return;

    if (isOnline) {
      if (!isMyTurn) return;
      online.submitOnlineGuess(guess.trim());
      setGuess('');
      return;
    }

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
          message: data.name,
          points: data.points,
          rank: data.rank,
          resolvedName: data.name
        });
        setLastRevealedIndex(data.index);
      } else if (data.status === 'exists') {
        soundFx.playIncorrect();
        setConsecutiveIncorrect((prev) => prev + 1);
        setLastGuess({
          text: guess,
          status: 'exists',
          message: `Already Revealed: ${data.name}`,
          resolvedName: data.name
        });
      } else if (data.status === 'incorrect') {
        soundFx.playIncorrect();
        setConsecutiveIncorrect((prev) => prev + 1);
        setLastGuess({
          text: guess,
          status: 'incorrect',
          message: 'Not in Top 100'
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

  // Play Again: starts a fresh game directly with a new category, never showing victory podium
  const handlePlayAgain = async (): Promise<void> => {
    try {
      if (isOnline) {
        setLastGuess({ text: '---', status: 'none', message: '' });
        setLastRevealedIndex(null);
        online.playOnlineAgain();
        return;
      }

      soundFx.playCorrect();
      setShowCelebration(false);
      setConfettiActive(false);
      setShowMatchPodium(false);
      setShowRoundSummary(false);
      setLastRevealedIndex(null);
      setConsecutiveIncorrect(0);
      setLastGuess({ text: '---', status: 'none', message: '' });

      // Pick a random category distinct from current if multiple exist
      let nextCatIdx = 0;
      if (categories && categories.length > 1 && gameState) {
        const remaining = categories
          .map((_, i) => i)
          .filter((i) => i !== gameState.current_round);
        nextCatIdx = remaining[Math.floor(Math.random() * remaining.length)];
      } else if (categories && categories.length > 0) {
        nextCatIdx = 0;
      }

      const matchMode = gameState?.match_mode || 'single';
      const totalRds = matchMode === 'multi' ? (gameState?.total_rounds || 3) : 1;
      const config: MatchConfig = {
        teams: gameState?.teams && gameState.teams.length > 0 ? gameState.teams : ['Team 1', 'Team 2'],
        match_mode: matchMode,
        total_rounds: totalRds,
        category_indices: [nextCatIdx],
        boss_rush_duration: gameState?.settings?.boss_rush_duration || 300,
        point_threshold: gameState?.settings?.point_threshold || 0
      };

      await handleStartMatch(config);
    } catch (err) {
      console.error('Play Again error', err);
      returnToMainMenu();
    }
  };

  // Next round
  const handleNextRound = async (): Promise<void> => {
    try {
      if (isOnline) {
        online.nextOnlineRound();
        return;
      }

      soundFx.playCorrect();
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      setShowCelebration(false);
      setConfettiActive(false);
      setShowRoundSummary(false);
      setShowMatchPodium(false);
      setLastRevealedIndex(null);
      setConsecutiveIncorrect(0);
      setLastGuess({ text: '---', status: 'none', message: '' });

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
      setShowMatchPodium(false);
      await fetchState();
      setTimeout(() => {
        setLoadingMatch({ active: false, message: '' });
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
      if (newSettings.color_theme) {
        setColorTheme(newSettings.color_theme);
      }
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
      <div className="min-h-screen bg-transparent text-[#fffbd4] flex flex-col items-center justify-center font-bold tracking-wider relative overflow-hidden">
        <WhirlpoolBackground dominantColor={colorTheme === 'blue' ? 'blue' : 'orange'} />
        <div className="relative z-10 text-center animate-pulse balatro-card px-8 py-5 rounded-2xl">
          <div className="text-xl text-[#fffbd4] uppercase tracking-widest font-black">
            Connecting to server...
          </div>
        </div>
      </div>
    );
  }

  const isMulti = activeGameState.match_mode === 'multi';
  const isBossRush = activeGameState.match_mode === 'boss_rush';
  const totalRounds = activeGameState.total_rounds || 1;
  const currentRoundNum = activeGameState.current_match_round || 1;
  const currentTurnTeam = activeGameState.teams?.[activeGameState.current_turn] || 'Team';
  const endCondition = activeGameState.end_condition || activeGameState.settings?.end_condition || 'both';
  const pointThreshold = endCondition === 'turns' ? 0 : (activeGameState.point_threshold || activeGameState.settings?.point_threshold || 0);
  const maxTurns = activeGameState.settings?.max_turns || 0;
  const isTurnBased = (endCondition === 'turns' || endCondition === 'both' || maxTurns > 0) && !isBossRush;
  const totalTurnsTaken = (activeGameState.turns_taken || []).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-transparent text-[#fffbd4] flex flex-col relative overflow-x-hidden select-none">
      
      {/* Balatro Whirlpool background */}
      <WhirlpoolBackground dominantColor={colorTheme === 'blue' ? 'blue' : 'orange'} />

      {/* SCREEN 1: MAIN MENU */}
      {screen === 'MENU' && !isPickingOnlineCategories && (
        <>
          {/* Black opacity overlay for the main menu */}
          <div className="fixed inset-0 bg-black/35 z-0 pointer-events-none" />
        <MainMenu
          onPlay={() => {
            setSetupInitialMode('single');
            setScreen('MATCH_SETUP');
          }}
          onOnlinePlay={() => setShowOnlineLobby(true)}
          onHowToPlay={() => setShowHowToPlay(true)}
          onSettings={() => setShowSettings(true)}
          onToggleFullscreen={toggleFullscreen}
          isFullscreen={isFullscreen}
        />
        </>
      )}

      {/* SCREEN: ONLINE CONFIGURE GAME */}
      {isPickingOnlineCategories && (
        <div className="py-6">
          <MatchSetup
            categories={categories}
            initialMode={onlineMatchSettings.matchMode}
            initialRounds={onlineMatchSettings.totalRounds}
            initialCategoryIndices={onlineMatchSettings.selectedCategoryIndices}
            defaultSettings={{
              turn_timer: onlineMatchSettings.turnTimer,
              point_threshold: onlineMatchSettings.pointThreshold,
              max_turns: onlineMatchSettings.maxTurns,
              end_condition: onlineMatchSettings.endCondition
            }}
            turnTimer={onlineMatchSettings.turnTimer}
            isOnlineConfigure={true}
            onSaveConfig={(saved) => {
              const updated = {
                isConfigured: true,
                matchMode: saved.matchMode,
                totalRounds: saved.totalRounds,
                selectedCategoryIndices: saved.categoryIndices,
                turnTimer: saved.settings.turn_timer ?? 30,
                pointThreshold: saved.settings.point_threshold ?? 500,
                maxTurns: saved.settings.max_turns ?? 0,
                endCondition: saved.settings.end_condition ?? 'both',
                bossRushDuration: saved.settings.boss_rush_duration ?? 300
              };
              setOnlineMatchSettings(updated);
              online.updateOnlineConfig({
                match_mode: updated.matchMode,
                total_rounds: updated.totalRounds,
                category_indices: updated.selectedCategoryIndices,
                turn_timer: updated.turnTimer,
                point_threshold: updated.pointThreshold,
                max_turns: updated.maxTurns,
                end_condition: updated.endCondition,
                boss_rush_duration: updated.bossRushDuration
              });
              setIsPickingOnlineCategories(false);
            }}
            onCancelConfig={() => setIsPickingOnlineCategories(false)}
            onBack={() => setIsPickingOnlineCategories(false)}
            onStartMatch={() => {}}
            onOpenTeams={() => {}}
            teams={online.roomInfo?.players.map(p => p.name) || []}
          />
        </div>
      )}

      {/* SCREEN 2: MATCH SETUP */}
      {screen === 'MATCH_SETUP' && (
        <div className="py-6">
          <MatchSetup
            categories={categories}
            initialMode={setupInitialMode}
            onStartMatch={handleStartMatch}
            onBack={returnToMainMenu}
            onOpenTeams={(cfg) => {
              if (cfg) setPendingMatchConfig(cfg);
              setShowTeams(true);
            }}
            teams={gameState?.teams || []}
            defaultSettings={gameState?.settings}
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
                className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#fffbd4] cursor-pointer transition active:translate-y-0.5"
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
                className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#fffbd4] cursor-pointer transition active:translate-y-0.5"
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

            {/* Center: Mode Badge, Timer, Target */}
            <div className="flex-1 flex flex-col items-center justify-center gap-1 z-10 min-w-0">
              {isOnline ? (
                <div className="flex flex-col items-center justify-center gap-1">
                  <div className="bg-[#891c1c] text-[#fffbd4] px-3.5 py-1 rounded-xl text-xs font-mono font-black border border-[#ef5368] tracking-wider flex items-center gap-2 shadow-[0_2px_0_#0d0d0d]">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ROOM: {online.roomInfo?.room_code}</span>
                    <span className="text-[10px] text-[#ef5368] font-bold">({online.roomInfo?.players.length} Players)</span>
                  </div>
                  {isBossRush ? (
                    <div className="flex items-center gap-2">
                      <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] px-3.5 py-0.5 rounded-xl text-xs font-black text-[#fffbd4] tracking-wider uppercase flex items-center gap-2">
                        <span className="text-[#ef5368]">CO-OP CLOCK:</span>
                        <span className={`font-mono text-sm ${bossRushTimeRemaining !== null && bossRushTimeRemaining <= 60 ? 'text-[#ef5368] animate-pulse' : 'text-[#fffbd4]'}`}>
                          {bossRushTimeRemaining !== null ? formatTime(bossRushTimeRemaining) : '0:00'}
                        </span>
                      </div>
                      <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] text-[#ef5368] px-3 py-0.5 rounded-xl text-xs font-black tracking-wide uppercase text-center truncate">
                        Goal: {pointThreshold || 2000} pts
                      </div>
                    </div>
                  ) : pointThreshold > 0 && (
                    <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] text-[#ef5368] px-3 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wide uppercase text-center truncate">
                      Target: {pointThreshold} pts
                    </div>
                  )}
                </div>
              ) : isBossRush ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] px-3.5 py-1 rounded-xl text-xs font-black text-[#fffbd4] tracking-wider uppercase flex items-center gap-2">
                    <span className="text-[#ef5368]">BOSS RUSH:</span>
                    <span className={`font-mono text-sm ${bossRushTimeRemaining !== null && bossRushTimeRemaining <= 60 ? 'text-[#ef5368] animate-pulse' : 'text-[#fffbd4]'}`}>
                      {bossRushTimeRemaining !== null ? formatTime(bossRushTimeRemaining) : '0:00'}
                    </span>
                  </div>
                  <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] text-[#ef5368] px-3 py-1 rounded-xl text-xs font-black tracking-wide uppercase text-center truncate">
                    Goal: {pointThreshold || 2000} pts
                  </div>
                </div>
              ) : (
                <>
                  {/* Round Above */}
                  <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] px-3 py-0.5 rounded-lg text-xs font-black text-[#fffbd4] tracking-wider uppercase text-center truncate max-w-full">
                    {isMulti ? `Round ${currentRoundNum} of ${totalRounds}` : `Round ${activeGameState.current_round + 1}`}
                    {isMulti && (
                      <span className="text-[10px] text-[#ef5368] ml-1.5 font-bold uppercase tracking-normal">
                        • Cumulative
                      </span>
                    )}
                  </div>

                  {/* Target Below */}
                  {pointThreshold > 0 && (
                    <div className="bg-[#0d0d0d] border-2 border-[#891c1c] border-b-2 shadow-[0_2px_0_#0a0f23,inset_0_1px_0_rgba(255,251,212,0.15)] text-[#ef5368] px-3 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-black tracking-wide uppercase text-center truncate max-w-full">
                      Target: {pointThreshold} pts
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-2 shrink-0 z-10">
              {!activeGameState.is_round_over && !isOnline && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setShowSkipConfirm(true);
                  }}
                  className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#fffbd4] hover:text-white cursor-pointer transition active:translate-y-0.5"
                  title="Surrender Round"
                  aria-label="Surrender Round"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M5 2c-.55 0-1 .45-1 1v18c0 .55.45 1 1 1s1-.45 1-1v-7h13c.67 0 1.15-.65.94-1.28l-1.84-5.52 1.84-5.52C20.15 2.05 19.67 1.4 19 1.4H6V3c0-.55-.45-1-1-1zm1 1.4h12.18l-1.53 4.6 1.53 4.6H6V3.4z" />
                  </svg>
                </button>
              )}

              {!activeGameState.is_round_over && isOnline && !online.roomInfo?.surrender_vote && (!surrenderOnCooldown || consecutiveIncorrect >= 3) && (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setSurrenderOnCooldown(true);
                    online.voteSurrender(true);
                  }}
                  className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#fffbd4] hover:text-white cursor-pointer transition active:translate-y-0.5"
                  title="Call 60s Surrender Vote"
                  aria-label="Call Surrender Vote"
                >
                  <svg className="w-4 h-4 fill-current text-white" viewBox="0 0 24 24">
                    <path d="M5 2c-.55 0-1 .45-1 1v18c0 .55.45 1 1 1s1-.45 1-1v-7h13c.67 0 1.15-.65.94-1.28l-1.84-5.52 1.84-5.52C20.15 2.05 19.67 1.4 19 1.4H6V3c0-.55-.45-1-1-1zm1 1.4h12.18l-1.53 4.6 1.53 4.6H6V3.4z" />
                  </svg>
                </button>
              )}

              {activeGameState.is_round_over && (
                <button
                  type="button"
                  onClick={handleRequestMainMenu}
                  className="balatro-btn-dark w-9 h-9 rounded-xl flex items-center justify-center text-[#fffbd4] hover:text-white cursor-pointer transition active:translate-y-0.5"
                  title="Main Menu"
                  aria-label="Main Menu"
                >
                  {/* Home symbol icon */}
                  <svg className="w-4 h-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
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
            </div>

          </div>

          {/* End-of-Game Inspection Banner (Perfect Horizontal Centering) */}
          {activeGameState.is_round_over && (
            <div className="w-full max-w-4xl mx-auto balatro-modal p-4 md:p-5 rounded-2xl mb-4 text-center animate-in zoom-in-95 border-2 border-[#891c1c] shadow-[0_6px_0_#0d0d0d]">
              <div className="text-xs font-black tracking-widest text-[#ef5368] uppercase mb-1">
                {isBossRush
                  ? 'Boss Rush Challenge Complete'
                  : 'Results'}
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-[#fffbd4] uppercase drop-shadow-[0_2px_0_#0d0d0d] mb-1">
                {isBossRush
                  ? `Solo Run Finished: ${activeGameState.scores[0] || 0} Points!`
                  : activeGameState.surrendered
                  ? 'Round Surrendered'
                  : activeGameState.winner && pointThreshold > 0 && Math.max(...(isMulti ? activeGameState.match_scores : activeGameState.scores)) >= pointThreshold
                  ? `${activeGameState.winner} Reached ${pointThreshold} Pts & Won!`
                  : activeGameState.winner
                  ? `${activeGameState.winner} Finished in 1st Place!`
                  : 'All Remaining Answers Revealed'}
              </h2>
              <p className="text-xs text-[#fffbd4]/90 font-bold mb-3">
                {isBossRush
                  ? `Found ${activeGameState.revealed_indices.filter((idx) => activeGameState.revealed_by[idx.toString()] !== 'MISSED').length} of 100 tiles. Click any tile on the board below to inspect!`
                  : activeGameState.surrendered
                  ? 'Click any tile on the board below to inspect!'
                  : 'Unanswered tiles are highlighted below. Click any tile on the board to inspect!'}
              </p>
              <div className="flex flex-nowrap items-center justify-center gap-2 sm:gap-3 overflow-x-auto w-full">
                {(!isOnline || online.isHost) && (
                  isMulti && totalRounds > 1 && !activeGameState.is_match_over && (
                    <button
                      type="button"
                      onMouseEnter={() => soundFx.playHover()}
                      onClick={handleNextRound}
                      className="balatro-btn-blue font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md text-white whitespace-nowrap shrink-0"
                    >
                      Next Category
                    </button>
                  )
                )}
                <button
                  type="button"
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => {
                    soundFx.playClick();
                    setShowCelebration(true);
                  }}
                  className="balatro-btn-dark border-2 border-slate-600 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md text-[#fffbd4] hover:border-slate-400 transition whitespace-nowrap shrink-0"
                >
                  Results Overview
                </button>
                {!isOnline && (
                  <button
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => {
                      soundFx.playClick();
                      setScreen('MATCH_SETUP');
                    }}
                    className="balatro-btn-dark border-2 border-amber-500/60 font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md text-amber-300 hover:border-amber-400 hover:text-white transition whitespace-nowrap shrink-0"
                  >
                    Categories
                  </button>
                )}
                {isOnline && online.isHost && (
                  <button
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => {
                      soundFx.playClick();
                      setShowReturnToLobbyConfirm(true);
                    }}
                    className="balatro-btn-blue font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md text-white whitespace-nowrap shrink-0"
                  >
                    Return to Lobby with Team
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Category Title with Compact Contained Width */}
          <div className="mb-3 text-center max-w-2xl sm:max-w-3xl mx-auto px-4 flex flex-col items-center">
            <h1 className="text-sm sm:text-base md:text-lg font-black text-[#fffbd4] uppercase tracking-wide px-2 drop-shadow-[0_2px_0_#0d0d0d] leading-snug break-words">
              {activeGameState.current_round_title || 'Loading Category...'}
            </h1>
            {activeGameState.current_round_subtitle && (
              <span className="mt-1 px-3 py-0.5 rounded-full bg-amber-950/70 border border-amber-500/60 text-amber-300 text-xs font-bold tracking-wide shadow-sm max-w-xl truncate">
                {activeGameState.current_round_subtitle}
              </span>
            )}
          </div>

          {/* Team Scorecards */}
          <div className="flex flex-wrap justify-center items-center gap-3.5 mb-4">
            {activeGameState.teams.map((team, idx) => {
              const isActive = idx === activeGameState.current_turn && !activeGameState.is_round_over && !isBossRush;
              const currentScore = isMulti ? activeGameState.match_scores[idx] || 0 : activeGameState.scores[idx] || 0;
              const target = pointThreshold;

              return (
                <div
                  key={idx}
                  className={`px-5 py-3 rounded-2xl min-w-[155px] md:min-w-[185px] text-center transition-all relative border-2 ${
                    isActive
                      ? colorTheme === 'blue'
                        ? 'neon-guesser-highlight bg-[#1e40af] border-cyan-400'
                        : 'neon-guesser-highlight bg-[#891c1c] border-rose-400'
                      : colorTheme === 'blue'
                      ? 'balatro-card bg-[#0e1422] border-[#1e40af]'
                      : 'balatro-card bg-[#0a0f23] border-[#891c1c]'
                  }`}
                >
                  {/* Team Name */}
                  <div className="font-black text-xs md:text-sm text-[#fffbd4] truncate mb-1">
                    {isBossRush ? (isOnline ? 'Co-op Squad' : team) : team}
                  </div>

                  {/* Score */}
                  <div className="text-2xl md:text-3xl font-black text-[#fffbd4] drop-shadow-[0_2px_0_#0d0d0d] leading-tight">
                    {currentScore} <span className="text-xs text-[#ef5368] font-bold uppercase">pts</span>
                  </div>

                  {/* Turn count display when turn-based */}
                  {isTurnBased && (
                    <div className="mt-1 px-2.5 py-0.5 rounded-lg bg-[#0d0d0d] border border-[#891c1c] inline-flex items-center gap-1 shadow-inner">
                      <span className="text-[10px] font-mono font-bold text-[#fffbd4]">
                        {maxTurns > 0 
                          ? `Turns: ${activeGameState.turns_taken?.[idx] || 0}/${maxTurns}`
                          : `Turns: ${activeGameState.turns_taken?.[idx] || 0}`
                        }
                      </span>
                      {maxTurns > 0 && (
                        <span className="text-[9px] text-[#ef5368] font-semibold">
                          ({Math.max(0, maxTurns - (activeGameState.turns_taken?.[idx] || 0))} left)
                        </span>
                      )}
                    </div>
                  )}

                  {/* Boss Rush score milestone progression bar */}
                  {isBossRush && (
                    <div className="mt-2.5 w-full max-w-sm mx-auto">
                      <div className="flex items-center justify-between text-[9px] font-mono font-bold text-[#fffbd4]/70 mb-1">
                        <span>Milestones</span>
                        <span>Goal: {pointThreshold || 2000} pts</span>
                      </div>
                      <div className={`relative w-full bg-[#0d0d0d] rounded-full h-2 overflow-hidden border ${
                        colorTheme === 'blue' ? 'border-[#1e40af]' : 'border-[#891c1c]'
                      }`}>
                        <div
                          className={`h-full transition-all duration-300 ${
                            colorTheme === 'blue'
                              ? 'bg-gradient-to-r from-[#1e40af] via-[#38bdf8] to-[#ffd700]'
                              : 'bg-gradient-to-r from-[#891c1c] via-[#ef5368] to-[#ffd700]'
                          }`}
                          style={{ width: `${Math.min(100, Math.round((currentScore / (pointThreshold || 2000)) * 100))}%` }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-mono font-bold mt-1 px-0.5">
                        {[
                          { pts: 1000, label: '1,000' },
                          { pts: 1500, label: '1,500' },
                          { pts: 2000, label: '2,000' },
                          { pts: 3000, label: '3,000' },
                          { pts: 4000, label: '4,000' },
                          { pts: 5000, label: '5,000' }
                        ].map((m) => {
                          const reached = currentScore >= m.pts;
                          const isTarget = (pointThreshold || 2000) === m.pts;
                          return (
                            <span
                              key={m.pts}
                              className={`transition-colors ${
                                reached
                                  ? 'text-[#ffd700] font-black'
                                  : isTarget
                                  ? 'text-[#ef5368] font-black underline'
                                  : 'text-[#fffbd4]/40'
                              }`}
                              title={`${m.pts} pts`}
                            >
                              {m.pts >= 1000 ? `${m.pts / 1000}k` : m.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Point threshold progress bar */}
                  {target > 0 && !isBossRush && (
                    <div className="mt-2 w-full">
                      <div className={`w-full bg-[#0d0d0d] rounded-full h-1.5 overflow-hidden border ${
                        colorTheme === 'blue' ? 'border-[#1e40af]' : 'border-[#891c1c]'
                      }`}>
                        <div
                          className={`h-full transition-all duration-300 ${
                            colorTheme === 'blue'
                              ? 'bg-gradient-to-r from-[#1e40af] via-[#38bdf8] to-[#fffbd4]'
                              : 'bg-gradient-to-r from-[#891c1c] via-[#ef5368] to-[#fffbd4]'
                          }`}
                          style={{ width: `${Math.min(100, Math.round((currentScore / target) * 100))}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls Row: Left = Most Recent Guess Box, Center = Turn Timer & Guess Form, Right = Symmetrical Spacer or Rocket League-Style Surrender Vote Box */}
          {!activeGameState.is_round_over && (
          <div className="w-full max-w-[1240px] mx-auto mb-3 flex flex-col md:flex-row items-center md:items-start justify-between gap-3 relative">
            
            {/* Box on the far left: Most Recent Guess (Much Bigger Word & Points Display) */}
            <div className="w-full md:w-72 balatro-card p-3.5 rounded-2xl border-2 flex flex-col justify-between shrink-0 shadow-[0_5px_0_#0d0d0d] min-h-[110px]">
              <div className="text-[10px] font-black uppercase tracking-wider text-[#fffbd4] flex items-center justify-between mb-2 pb-1.5 border-b border-[#891c1c]/40">
                <span>Recent Guess</span>
                {lastGuess.status !== 'none' && (
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-black uppercase tracking-wide ${
                    lastGuess.status === 'correct'
                      ? 'bg-[#15803d] text-white shadow-[0_1px_0_#0d0d0d]'
                      : lastGuess.status === 'exists'
                      ? 'bg-amber-950/90 border border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                      : 'bg-[#0d0d0d] border border-[#891c1c] text-[#ef5368]'
                  }`}>
                    {lastGuess.status === 'correct' ? 'Correct ✓' : lastGuess.status === 'exists' ? 'Already Found ⚠' : 'Incorrect ✕'}
                  </span>
                )}
              </div>

              <div className="min-h-[56px] flex flex-col justify-center">
                {lastGuess.status === 'none' ? (
                  <span className="text-xs text-[#fffbd4]/60 italic">Awaiting first guess...</span>
                ) : (
                  <>
                    {/* Much bigger word guessed */}
                    <div
                      className="text-base sm:text-lg md:text-xl font-black text-[#fffbd4] leading-tight line-clamp-2 drop-shadow-[0_2px_0_#0d0d0d]"
                      title={lastGuess.resolvedName || lastGuess.text}
                    >
                      {lastGuess.resolvedName || `"${lastGuess.text}"`}
                    </div>

                    {/* Much bigger points badge for correct guesses */}
                    {lastGuess.status === 'correct' && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="bg-[#15803d] border border-[#22c55e] text-white font-black font-mono text-sm sm:text-base px-2.5 py-0.5 rounded-lg shadow-[0_2px_0_#0d0d0d] drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]">
                          +{lastGuess.points ?? 0} PTS
                        </span>
                        {lastGuess.rank && (
                          <span className="text-xs font-mono font-black text-[#ef5368]">
                            #{lastGuess.rank}
                          </span>
                        )}
                      </div>
                    )}

                    {lastGuess.status === 'exists' && (
                      <div className="text-xs text-amber-300 font-mono font-black uppercase tracking-wider mt-1.5 flex items-center gap-1">
                        <span>Already Found</span>
                        {lastGuess.rank && <span className="text-amber-400/80">(#{lastGuess.rank})</span>}
                      </div>
                    )}
                    {lastGuess.status === 'incorrect' && (
                      <div className="text-xs text-[#ef5368] font-mono font-black uppercase tracking-wider mt-1.5">
                        Not in Top 100
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Center: Turn Timer & Active Guess Form */}
            <div className="flex-1 w-full max-w-lg mx-auto flex flex-col items-center justify-center">
              {/* Turn indicator and countdown timer if enabled */}
              {!isBossRush && !activeGameState.is_round_over && (
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-black text-[#fffbd4] uppercase tracking-wider">
                    {isOnline ? (
                      isMyTurn ? (
                        <span className="text-emerald-400 font-black">YOUR TURN ({currentTurnTeam})</span>
                      ) : (
                        <span className="text-[#ef5368] font-black">{currentTurnTeam}'s Turn</span>
                      )
                    ) : (
                      `${currentTurnTeam}'s Turn`
                    )}
                    {isTurnBased && maxTurns > 0 && (
                      <span className="text-[#ef5368] ml-1.5 font-mono text-[11px]">
                        (Turn {(activeGameState.turns_taken?.[activeGameState.current_turn] || 0) + 1} of {maxTurns})
                      </span>
                    )}
                  </span>
                  {timeRemaining !== null && (
                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-black text-base md:text-lg border-2 shadow-lg transition-all ${
                      timeRemaining <= 5
                        ? 'bg-rose-950/90 border-rose-500 text-rose-300 animate-pulse shadow-[0_0_12px_rgba(244,63,94,0.7)]'
                        : timeRemaining <= 10
                        ? 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : 'bg-[#0d0d0d] border-cyan-500/70 text-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.3)]'
                    }`}>
                      <span className="text-xs">⏱</span>
                      <span>{timeRemaining}s</span>
                    </div>
                  )}
                </div>
              )}

              {/* Input Form with Balatro Inner Depth */}
              <form onSubmit={submitGuess} className="w-full">
                <input
                  ref={guessInputRef}
                  type="text"
                  value={guess}
                  onChange={(e) => setGuess(e.target.value)}
                  placeholder={
                    activeGameState.is_round_over
                      ? 'Round Complete - Inspect Board Below'
                      : isOnline && !isMyTurn
                      ? 'pre-type your guess'
                      : isBossRush
                      ? (isOnline ? 'Co-op Boss Rush: Spam any answer on this board...' : 'Boss Rush: Type any answer on this board...')
                      : 'type your guess'
                  }
                  disabled={Boolean(activeGameState.is_round_over)}
                  className="w-full bg-[#0d0d0d] border-2 border-[#891c1c] focus:border-[#fffbd4] text-[#fffbd4] placeholder:text-[#fffbd4]/40 px-5 py-3.5 rounded-2xl text-lg font-black outline-none text-center transition shadow-[inset_0_3px_6px_rgba(13,13,13,0.8),0_4px_0_#0d0d0d]"
                  autoFocus
                />
              </form>

              {/* Pass Turn Button for untimed or manual turn skip */}
              {!isBossRush && !activeGameState.is_round_over && (
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      handlePassTurn(true);
                    }}
                    disabled={isOnline && !isMyTurn}
                    className={`balatro-btn-dark px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-[#fffbd4] ${
                      isOnline && !isMyTurn ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:text-white'
                    }`}
                  >
                    Pass Turn
                  </button>
                </div>
              )}

              {/* Offline Stall prompt after 20 consecutive incorrect guesses */}
              {!isOnline && consecutiveIncorrect >= 20 && !activeGameState.is_round_over && (
                <div className="w-full mt-2 p-2 px-3 bg-[#0a0f23] border border-slate-700 rounded-lg flex items-center justify-between gap-2.5 text-xs text-[#fffbd4] animate-in fade-in shadow-[0_2px_0_#0d0d0d]">
                  <div className="flex items-center gap-1.5 text-left text-xs">
                    <span>💡</span>
                    <span>Stalled after {consecutiveIncorrect} consecutive incorrect guesses? You can surrender this category anytime to bank points!</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playClick();
                      setShowSkipConfirm(true);
                    }}
                    className="balatro-btn-red text-white font-black px-2.5 py-1 rounded-md uppercase tracking-wider text-xs shrink-0 cursor-pointer flex items-center justify-center shadow-md"
                    title="Surrender Round"
                    aria-label="Surrender Round"
                  >
                    Surrender
                  </button>
                </div>
              )}
            </div>

            {/* Right: Symmetrical active Surrender Vote Box (Rocket League style) or empty desktop spacer */}
            {isOnline && online.roomInfo?.surrender_vote && !activeGameState.is_round_over && surrenderSecondsLeft > 0 ? (
              <div className="w-full md:w-72 balatro-card p-3.5 rounded-2xl border-2 border-slate-700 flex flex-col justify-between shrink-0 shadow-[0_5px_0_#0d0d0d] animate-in fade-in min-h-[110px]">
                <div className="text-[10px] font-black uppercase tracking-wider text-[#fffbd4] flex items-center justify-between mb-2 pb-1.5 border-b border-slate-700/60">
                  <span>Surrender Vote</span>
                  <div className="bg-[#0d0d0d] text-rose-400 px-2 py-0.5 rounded font-mono font-black text-xs border border-slate-700 animate-pulse">
                    {surrenderSecondsLeft}s
                  </div>
                </div>
                <div className="min-h-[56px] flex flex-col justify-center text-center">
                  <div className="text-xs font-bold text-[#fffbd4] leading-tight">
                    <span className="text-rose-400 font-black">{online.roomInfo.surrender_vote.initiator_name}</span> voted to surrender!
                  </div>
                </div>
                {online.myPlayerId && online.roomInfo.surrender_vote.votes[online.myPlayerId] === undefined ? (
                  <div className="flex items-center justify-center gap-2 pt-1 border-t border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        online.voteSurrender(true);
                      }}
                      className="balatro-btn-purple font-black px-4 py-1 rounded-md text-xs uppercase tracking-wider cursor-pointer text-white shadow-md min-w-[65px]"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        online.voteSurrender(false);
                      }}
                      className="balatro-btn-dark font-black px-4 py-1 rounded-md text-xs uppercase tracking-wider cursor-pointer text-white border border-slate-600 min-w-[65px]"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="pt-1 border-t border-slate-700/60 text-center">
                    <div className="text-[11px] font-black text-[#fffbd4] flex items-center justify-center gap-2">
                      <span className={online.myPlayerId && online.roomInfo.surrender_vote.votes[online.myPlayerId] ? 'text-emerald-400' : 'text-rose-400'}>
                        {online.myPlayerId && online.roomInfo.surrender_vote.votes[online.myPlayerId] ? 'Voted YES' : 'Voted NO'}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">
                        ({Object.values(online.roomInfo.surrender_vote.votes || {}).filter(Boolean).length}/{online.roomInfo.players.length})
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:block w-72 shrink-0 pointer-events-none min-h-[110px]" />
            )}

          </div>
          )}

          {/* 10x10 Tile Grid with Balatro Slabs (Navy background, Lemon Chiffon question outlines) */}
          <div className="grid grid-cols-10 gap-1.5 md:gap-2 max-w-[1240px] mx-auto w-full mb-3 balatro-panel p-3.5 rounded-2xl flex-1">
            {Array.from({ length: 100 }).map((_, i) => {
              const rank = i + 1;
              const isRevealed = activeGameState.revealed_indices.includes(i);
              const isJustRevealed = lastRevealedIndex === i;
              const answerName = activeGameState.current_round_answers ? activeGameState.current_round_answers[i] : '';
              const revealedBy = activeGameState.revealed_by[i.toString()];
              const isMissed = revealedBy === 'MISSED' || revealedBy === 'UNANSWERED';

              if (isRevealed && isMissed) {
                return (
                  <div
                    key={rank}
                    onClick={() => {
                      soundFx.playClick();
                      setFocusedTile({ rank, name: answerName, team: 'Unanswered (Missed)', isMissed: true });
                    }}
                    className={`${activeGameState.is_round_over ? 'h-8 sm:h-9 md:h-10' : 'h-11 sm:h-12 md:h-13'} rounded-xl flex items-center justify-center p-1 text-center transition-all cursor-pointer relative overflow-hidden bg-[#0d0d0d] border-2 border-[#891c1c] text-rose-300 shadow-[0_2px_0_#0a0f23]`}
                    title={`Rank #${rank} (Missed): ${answerName}`}
                  >
                    <div className="flex flex-col items-center justify-center w-full h-full overflow-hidden leading-tight">
                      <span className="text-[10px] md:text-[11px] font-black line-clamp-2 w-full text-center px-0.5 text-[#fffbd4]">
                        {answerName}
                      </span>
                      <span className="text-[9px] opacity-80 font-mono font-bold text-[#ef5368]">#{rank}</span>
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
                  className={`${activeGameState.is_round_over ? 'h-8 sm:h-9 md:h-10' : 'h-11 sm:h-12 md:h-13'} rounded-xl flex items-center justify-center p-1 text-center transition-all cursor-pointer relative overflow-hidden ${
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
                      <span className={`text-[10px] md:text-[11px] font-black line-clamp-2 w-full text-center px-0.5 ${
                        isJustRevealed ? 'text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]' : 'text-[#fffbd4]'
                      }`}>
                        {answerName}
                      </span>
                      <span className={`text-[9px] font-mono font-black ${
                        isJustRevealed ? 'text-white' : 'text-[#fffbd4]/90 opacity-90'
                      }`}>#{rank}</span>
                    </div>
                  ) : (
                    <span className="font-black text-[#fffbd4] drop-shadow-[0_1px_0_#0d0d0d]">{rank}</span>
                  )}
                </div>
              );
            })}
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
            className={`balatro-modal p-8 rounded-3xl max-w-lg w-full cursor-default text-center animate-in zoom-in-95 border-4 border-[#891c1c]`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`font-black tracking-widest text-sm mb-1 uppercase ${focusedTile.isMissed ? 'text-[#fffbd4]/60' : 'text-[#ef5368]'}`}>
              Rank #{focusedTile.rank} • {focusedTile.rank} {focusedTile.rank === 1 ? 'Point' : 'Points'}
            </div>
            <div className="text-3xl md:text-4xl font-black text-[#fffbd4] mb-6 uppercase leading-tight drop-shadow-[0_3px_0_#0d0d0d]">
              {focusedTile.name}
            </div>
            {focusedTile.isMissed ? (
              <div className="bg-[#0d0d0d] text-[#fffbd4]/70 py-2.5 px-6 rounded-xl font-black border-2 border-[#891c1c] border-b-4 shadow-[0_3px_0_#0a0f23] inline-block text-xs uppercase tracking-wider">
                Status: <span className="text-[#fffbd4] ml-1">Not Guessed (Missed)</span>
              </div>
            ) : (
              <div className="bg-[#0d0d0d] text-[#ef5368] py-2.5 px-6 rounded-xl font-black border-2 border-[#891c1c] border-b-4 shadow-[0_3px_0_#0a0f23] inline-block text-xs uppercase tracking-wider">
                Guessed by: <span className="text-[#fffbd4] ml-1">{focusedTile.team}</span>
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
          settings={activeGameState?.settings || {}}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
          onQuitGame={screen === 'ARENA' ? handleQuitGame : undefined}
          isOnline={isOnline}
          isHost={Boolean(online.isHost)}
          onReturnToLobby={() => {
            setShowSettings(false);
            setShowReturnToLobbyConfirm(true);
          }}
        />
      )}

      {/* MODAL 5: TEAMS */}
      {showTeams && (
        <TeamsModal
          teams={activeGameState.teams || []}
          onSave={handleSaveTeams}
          onClose={() => setShowTeams(false)}
          matchMode={pendingMatchConfig?.match_mode || setupInitialMode}
          onStartGame={
            screen === 'MATCH_SETUP' && pendingMatchConfig
              ? () => {
                  setShowTeams(false);
                  handleStartMatch(pendingMatchConfig);
                }
              : undefined
          }
        />
      )}

      {/* MODAL 6: HOST OVERRIDE CONSOLE */}
      {showHostOverride && (
        <HostOverrideModal
          gameState={activeGameState}
          onOverride={handleHostOverride}
          onClose={() => setShowHostOverride(false)}
        />
      )}

      {/* MODAL 7: ROUND SUMMARY */}
      {screen === 'ARENA' && showRoundSummary && !showMatchPodium && (
        <RoundSummaryModal
          gameState={activeGameState}
          isHost={!isOnline || online.isHost}
          onNextRound={handleNextRound}
          onPlayAgain={handlePlayAgain}
          onViewPodium={() => {
            setShowRoundSummary(false);
            setShowMatchPodium(true);
          }}
          onInspectBoard={() => setShowRoundSummary(false)}
          onReturnMenu={handleRequestMainMenu}
          onSelectCategories={!isOnline ? () => {
            setShowRoundSummary(false);
            setScreen('MATCH_SETUP');
          } : undefined}
        />
      )}

      {/* MODAL 8: MATCH PODIUM */}
      {screen === 'ARENA' && showMatchPodium && (
        <MatchPodiumModal
          gameState={activeGameState}
          isHost={!isOnline || online.isHost}
          onRematch={() => {
            setShowMatchPodium(false);
            setScreen('MATCH_SETUP');
          }}
          onReturnMenu={handleRequestMainMenu}
        />
      )}

      {/* CONFETTI CANVAS BURST */}
      <ConfettiCanvas active={confettiActive} durationMs={6000} theme={colorTheme} />

      {/* MODAL 9: POST-GAME CELEBRATION & SCROLLING WHEEL */}
      {screen === 'ARENA' && showCelebration && (
        <PostGameCelebrationModal
          gameState={activeGameState}
          isHost={!isOnline || online.isHost}
          onInspectBoard={() => setShowCelebration(false)}
          onNextRound={handleNextRound}
          onPlayAgain={handlePlayAgain}
          onReturnMenu={handleRequestMainMenu}
          onReturnToLobby={isOnline && online.isHost ? () => setShowReturnToLobbyConfirm(true) : undefined}
          onSelectCategories={!isOnline ? () => {
            setShowCelebration(false);
            setScreen('MATCH_SETUP');
          } : undefined}
        />
      )}

      {/* MODAL: LEAVE LOBBY CONFIRMATION FOR ALL PLAYERS (R5) */}
      {showLeaveLobbyConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in-95 border-4 border-[#891c1c]">
            <h3 className="text-xl font-black text-[#ef5368] uppercase tracking-wider mb-2">
              {online.isHost ? 'Leave Online Match Alone?' : 'Leave Online Lobby?'}
            </h3>
            <p className="text-xs font-bold text-[#fffbd4]/80 mb-6 leading-relaxed">
              {online.isHost
                ? "You are the host. Leaving alone will disconnect you from the match and transfer host authority to another player. To return together with all players, use 'Return to Lobby with Team'."
                : 'Returning to the Main Menu will leave the online lobby and disconnect you from the match. Are you sure you want to exit?'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowLeaveLobbyConfirm(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLeaveLobby}
                className="balatro-btn-red px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md text-white"
              >
                {online.isHost ? 'Leave Alone' : 'Leave Lobby'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: RETURN TEAM TO LOBBY CONFIRMATION (Host Only) */}
      {showReturnToLobbyConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in-95 border-4 border-[#891c1c]">
            <h3 className="text-xl font-black text-[#ef5368] uppercase tracking-wider mb-2">
              Return Team to Lobby?
            </h3>
            <p className="text-xs font-bold text-[#fffbd4]/80 mb-6 leading-relaxed">
              Are you sure you want to return all players in this room back to the online lobby? The current match will end for everyone.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowReturnToLobbyConfirm(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowReturnToLobbyConfirm(false);
                  online.returnToLobby();
                }}
                className="balatro-btn-blue px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-md text-white"
              >
                Return with Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: SURRENDER ROUND CONFIRMATION */}
      {showSkipConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in-95 border-4 border-[#891c1c]">
            <h3 className="text-xl font-black text-[#ef5368] uppercase tracking-wider mb-2">
              Surrender Round?
            </h3>
            <p className="text-sm text-[#fffbd4]/90 mb-6 font-semibold leading-relaxed">
              All remaining unrevealed answers will be revealed, current points will be banked, and you will advance to the results.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowSkipConfirm(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSkipCategory}
                className="balatro-btn-red px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4] shadow-lg flex items-center justify-center"
              >
                <span>Yes, Surrender</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 11: ONLINE MULTIPLAYER LOBBY */}
      {(showOnlineLobby || (online.roomInfo && online.roomInfo.status === 'LOBBY')) && !isPickingOnlineCategories && (
        <OnlineLobbyModal
          categories={categories}
          roomInfo={online.roomInfo}
          myPlayerId={online.myPlayerId}
          isHost={online.isHost}
          onHostGame={async (name: string) => {
            setOnlineMatchSettings(prev => ({
              ...prev,
              isConfigured: false,
              selectedCategoryIndices: []
            }));
            return online.hostGame(name);
          }}
          onJoinGame={online.joinGame}
          onStartOnlineMatch={() => {
            online.startOnlineMatch({
              match_mode: onlineMatchSettings.matchMode,
              total_rounds: onlineMatchSettings.matchMode === 'multi' ? onlineMatchSettings.totalRounds : 1,
              category_indices: onlineMatchSettings.selectedCategoryIndices,
              turn_timer: onlineMatchSettings.turnTimer,
              point_threshold: onlineMatchSettings.pointThreshold,
              max_turns: onlineMatchSettings.maxTurns,
              end_condition: onlineMatchSettings.endCondition,
              boss_rush_duration: onlineMatchSettings.bossRushDuration
            });
          }}
          onLeaveLobby={() => {
            online.leaveLobby();
            setShowOnlineLobby(false);
          }}
          onClose={() => {
            if (online.roomInfo) {
              online.leaveLobby();
            }
            setShowOnlineLobby(false);
          }}
          errorMessage={online.errorMessage}
          clearError={online.clearError}
          isConfigured={onlineMatchSettings.isConfigured || Boolean(online.roomInfo?.is_configured)}
          matchMode={(online.roomInfo?.game_state?.match_mode as any) || onlineMatchSettings.matchMode}
          totalRounds={online.roomInfo?.game_state?.total_rounds || onlineMatchSettings.totalRounds}
          selectedCategoryIndices={
            (online.roomInfo as any)?.category_indices && (online.roomInfo as any).category_indices.length > 0
              ? (online.roomInfo as any).category_indices
              : (online.roomInfo?.game_state?.category_indices && online.roomInfo.game_state.category_indices.length > 0
                ? online.roomInfo.game_state.category_indices
                : onlineMatchSettings.selectedCategoryIndices)
          }
          turnTimer={online.roomInfo?.game_state?.turn_timer ?? onlineMatchSettings.turnTimer}
          pointThreshold={online.roomInfo?.game_state?.point_threshold ?? onlineMatchSettings.pointThreshold}
          maxTurns={online.roomInfo?.game_state?.max_turns ?? onlineMatchSettings.maxTurns}
          endCondition={online.roomInfo?.game_state?.end_condition ?? onlineMatchSettings.endCondition}
          bossRushDuration={online.roomInfo?.game_state?.boss_rush_duration ?? onlineMatchSettings.bossRushDuration}
          onConfigureGame={() => setIsPickingOnlineCategories(true)}
        />
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
