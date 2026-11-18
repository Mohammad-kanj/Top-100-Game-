import React, { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';
import { Category, GameSettings } from '../types';

interface OnlinePlayerInfo {
  player_id: string;
  name: string;
  is_host: boolean;
  is_connected: boolean;
  consecutive_incorrect: number;
  eligible_for_surrender: boolean;
}

interface OnlineRoomInfo {
  room_code: string;
  host_id: string;
  status: string;
  is_configured?: boolean;
  category_indices?: number[];
  selected_categories?: string[];
  players: OnlinePlayerInfo[];
  active_player_id: string | null;
  surrender_vote: any;
  game_state: any;
}

interface OnlineLobbyModalProps {
  categories: Category[];
  roomInfo: OnlineRoomInfo | null;
  myPlayerId: string | null;
  isHost: boolean;
  onHostGame: (name: string) => Promise<boolean>;
  onJoinGame: (code: string, name: string) => Promise<boolean>;
  onStartOnlineMatch: (config: any) => void;
  onLeaveLobby: () => void;
  onClose: () => void;
  errorMessage: string | null;
  clearError: () => void;
  isConfigured?: boolean;
  matchMode?: 'single' | 'multi' | 'boss_rush';
  totalRounds?: number;
  selectedCategoryIndices?: number[];
  turnTimer?: number;
  pointThreshold?: number;
  maxTurns?: number;
  endCondition?: 'both' | 'turns' | 'points';
  bossRushDuration?: number;
  onConfigureGame?: () => void;
  onUpdateSettings?: (settings: Partial<{
    matchMode: 'single' | 'multi' | 'boss_rush';
    totalRounds: number;
    selectedCategoryIndices: number[];
    turnTimer: number;
    pointThreshold: number;
    maxTurns: number;
    endCondition: 'both' | 'turns' | 'points';
    bossRushDuration: number;
  }>) => void;
  onOpenCategoryPicker?: () => void;
}

export default function OnlineLobbyModal({
  categories,
  roomInfo,
  myPlayerId,
  isHost,
  onHostGame,
  onJoinGame,
  onStartOnlineMatch,
  onLeaveLobby,
  onClose,
  errorMessage,
  clearError,
  isConfigured: controlledIsConfigured,
  matchMode: controlledMatchMode,
  totalRounds: controlledTotalRounds,
  selectedCategoryIndices: controlledCategoryIndices,
  turnTimer: controlledTurnTimer,
  pointThreshold: controlledPointThreshold,
  maxTurns: controlledMaxTurns,
  endCondition: controlledEndCondition,
  bossRushDuration: controlledBossRushDuration,
  onConfigureGame,
  onUpdateSettings,
  onOpenCategoryPicker
}: OnlineLobbyModalProps): React.JSX.Element {
  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [hostNameInput, setHostNameInput] = useState<string>('');
  const [joinNameInput, setJoinNameInput] = useState<string>('');
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Host match settings configuration
  const [localMatchMode, setLocalMatchMode] = useState<'single' | 'multi' | 'boss_rush'>('single');
  const [localTotalRounds, setLocalTotalRounds] = useState<number>(3);
  const [localTurnTimer, setLocalTurnTimer] = useState<number>(30);
  const [localPointThreshold, setLocalPointThreshold] = useState<number>(500);
  const [localMaxTurns, setLocalMaxTurns] = useState<number>(0);
  const [localEndCondition, setLocalEndCondition] = useState<'both' | 'turns' | 'points'>('both');
  const [localBossRushDuration, setLocalBossRushDuration] = useState<number>(300);

  const effectiveCategoryIndices: number[] = (
    controlledCategoryIndices && controlledCategoryIndices.length > 0
      ? controlledCategoryIndices
      : (roomInfo?.category_indices && roomInfo.category_indices.length > 0
        ? roomInfo.category_indices
        : (roomInfo?.game_state?.category_indices && roomInfo.game_state.category_indices.length > 0
          ? roomInfo.game_state.category_indices
          : []))
  );

  const isMatchConfigured = Boolean(
    roomInfo?.is_configured ?? controlledIsConfigured ?? (effectiveCategoryIndices.length > 0)
  );
  const matchMode = controlledMatchMode ?? roomInfo?.game_state?.match_mode ?? localMatchMode;
  const totalRounds = controlledTotalRounds ?? roomInfo?.game_state?.total_rounds ?? localTotalRounds;
  const categoryIndices = effectiveCategoryIndices.length > 0 ? effectiveCategoryIndices : [0];
  const turnTimer = controlledTurnTimer ?? roomInfo?.game_state?.turn_timer ?? localTurnTimer;
  const pointThreshold = controlledPointThreshold ?? roomInfo?.game_state?.point_threshold ?? localPointThreshold;
  const maxTurns = controlledMaxTurns ?? roomInfo?.game_state?.max_turns ?? localMaxTurns;
  const endCondition = controlledEndCondition ?? roomInfo?.game_state?.end_condition ?? localEndCondition;
  const bossRushDuration = controlledBossRushDuration ?? roomInfo?.game_state?.boss_rush_duration ?? localBossRushDuration;

  const selectedCategoryNames: string[] = categoryIndices.map((idx, order) => {
    const found = categories.find(c => c.index === idx);
    return found ? found.title : (roomInfo?.selected_categories?.[order] || roomInfo?.game_state?.selected_categories?.[order] || `Category ${idx + 1}`);
  });

  const updateSetting = (settings: Partial<{
    matchMode: 'single' | 'multi' | 'boss_rush';
    totalRounds: number;
    selectedCategoryIndices: number[];
    turnTimer: number;
    pointThreshold: number;
    maxTurns: number;
    endCondition: 'both' | 'turns' | 'points';
    bossRushDuration: number;
  }>) => {
    soundFx.playSettingsChange();
    if (onUpdateSettings) {
      onUpdateSettings(settings);
    }
    if (settings.matchMode !== undefined) setLocalMatchMode(settings.matchMode);
    if (settings.totalRounds !== undefined) setLocalTotalRounds(settings.totalRounds);
    if (settings.turnTimer !== undefined) setLocalTurnTimer(settings.turnTimer);
    if (settings.pointThreshold !== undefined) setLocalPointThreshold(settings.pointThreshold);
    if (settings.maxTurns !== undefined) setLocalMaxTurns(settings.maxTurns);
    if (settings.endCondition !== undefined) setLocalEndCondition(settings.endCondition);
    if (settings.bossRushDuration !== undefined) setLocalBossRushDuration(settings.bossRushDuration);
  };

  // Check URL params for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCodeInput(codeParam.toUpperCase());
      setTab('join');
    }
  }, []);

  const handleCreate = async (): Promise<void> => {
    if (!hostNameInput.trim()) return;
    setIsSubmitting(true);
    clearError();
    soundFx.playClick();
    const success = await onHostGame(hostNameInput.trim());
    setIsSubmitting(false);
    if (success) {
      soundFx.playFanfare();
    } else {
      soundFx.playIncorrect();
    }
  };

  const handleJoin = async (): Promise<void> => {
    if (!roomCodeInput.trim() || !joinNameInput.trim()) return;
    setIsSubmitting(true);
    clearError();
    soundFx.playClick();
    const success = await onJoinGame(roomCodeInput.trim().toUpperCase(), joinNameInput.trim());
    setIsSubmitting(false);
    if (success) {
      soundFx.playCorrect();
    } else {
      soundFx.playIncorrect();
    }
  };

  const handleCopyCode = (): void => {
    if (!roomInfo) return;
    soundFx.playClick();
    navigator.clipboard.writeText(roomInfo.room_code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = (): void => {
    if (!roomInfo) return;
    soundFx.playClick();
    let host = window.location.host;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      const reachableIp = (roomInfo as any).host_ip;
      if (reachableIp && reachableIp !== '127.0.0.1' && reachableIp !== 'localhost') {
        const port = window.location.port ? `:${window.location.port}` : '';
        host = `${reachableIp}${port}`;
      }
    }
    const inviteLink = `${window.location.protocol}//${host}${window.location.pathname}?room=${roomInfo.room_code}`;
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLaunchMatch = (): void => {
    const minPlayers = matchMode === 'boss_rush' ? 1 : 2;
    if (!isHost || !roomInfo || !isMatchConfigured || roomInfo.players.length < minPlayers) {
      soundFx.playIncorrect();
      return;
    }
    soundFx.playFanfare();
    onStartOnlineMatch({
      match_mode: matchMode,
      total_rounds: matchMode === 'multi' ? totalRounds : 1,
      category_indices: categoryIndices,
      turn_timer: turnTimer,
      point_threshold: pointThreshold,
      max_turns: maxTurns,
      end_condition: endCondition,
      boss_rush_duration: bossRushDuration
    });
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="balatro-modal rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh] border-4 border-[#891c1c] shadow-[0_12px_0_#0d0d0d] bg-[#0a0f23]">
        
        {/* Header */}
        <div className="bg-[#0d0d0d] border-b-2 border-[#891c1c] p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🌐</span>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_2px_0_#0d0d0d]">
                Online Multiplayer
              </h2>
              <p className="text-xs text-[#ef5368] font-bold">
                Play head-to-head with friends online
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              if (roomInfo) {
                onLeaveLobby();
              }
              onClose();
            }}
            onMouseEnter={() => soundFx.playHover()}
            className="text-[#fffbd4]/70 hover:text-[#fffbd4] hover:bg-[#891c1c]/30 rounded-xl w-9 h-9 flex items-center justify-center transition font-black text-base cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div className="bg-[#891c1c] border-b-2 border-[#ef5368] p-3 text-center text-[#fffbd4] font-black text-xs md:text-sm animate-in fade-in flex items-center justify-center gap-2">
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* BODY */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-[#fffbd4]">
          
          {/* STATE 1: NOT IN ROOM YET (Host or Join Tabs) */}
          {!roomInfo ? (
            <div>
              {/* Tab Selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setTab('create'); clearError(); }}
                  onMouseEnter={() => soundFx.playHover()}
                  className={`py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer transition ${
                    tab === 'create'
                      ? 'balatro-btn-blue text-white shadow-md'
                      : 'balatro-btn-dark text-[#fffbd4]'
                  }`}
                >
                  Host New Lobby
                </button>
                <button
                  type="button"
                  onClick={() => { soundFx.playClick(); setTab('join'); clearError(); }}
                  onMouseEnter={() => soundFx.playHover()}
                  className={`py-3 rounded-2xl font-black text-xs md:text-sm uppercase tracking-wider cursor-pointer transition ${
                    tab === 'join'
                      ? 'balatro-btn-blue text-white shadow-md'
                      : 'balatro-btn-dark text-[#fffbd4]'
                  }`}
                >
                  Join With Code
                </button>
              </div>

              {/* HOST TAB */}
              {tab === 'create' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#fffbd4] mb-2">
                      HOST NAME
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      value={hostNameInput}
                      onChange={(e) => setHostNameInput(e.target.value)}
                      placeholder="e.g. CaptainAwesome"
                      className="w-full bg-[#0d0d0d] border-2 border-[#891c1c] focus:border-[#fffbd4] text-[#fffbd4] px-4 py-3 rounded-xl font-black text-base outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                      autoFocus
                    />
                    <p className="text-[11px] text-[#fffbd4]/60 font-semibold mt-1.5">
                      Enter your team's name
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !hostNameInput.trim()}
                    onClick={handleCreate}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider text-base transition shadow-lg ${
                      isSubmitting || !hostNameInput.trim()
                        ? 'opacity-40 cursor-not-allowed balatro-btn-dark text-slate-500'
                        : 'balatro-btn-blue text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? 'Creating Lobby...' : 'Create Lobby'}
                  </button>
                </div>
              )}

              {/* JOIN TAB */}
              {tab === 'join' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#fffbd4] mb-2">
                      4-Letter Room Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={roomCodeInput}
                      onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. X7K2"
                      className="w-full bg-[#0d0d0d] border-2 border-slate-700 focus:border-[#fffbd4] text-[#fffbd4] px-4 py-3 rounded-xl font-black text-center text-xl tracking-widest uppercase outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#fffbd4] mb-2">
                      Your Player Name (Controlled Team)
                    </label>
                    <input
                      type="text"
                      maxLength={18}
                      value={joinNameInput}
                      onChange={(e) => setJoinNameInput(e.target.value)}
                      placeholder="e.g. ChallengerOne"
                      className="w-full bg-[#0d0d0d] border-2 border-slate-700 focus:border-[#fffbd4] text-[#fffbd4] px-4 py-3 rounded-xl font-black text-base outline-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting || !roomCodeInput.trim() || !joinNameInput.trim()}
                    onClick={handleJoin}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`w-full py-4 rounded-2xl font-black uppercase tracking-wider text-base transition shadow-lg ${
                      isSubmitting || !roomCodeInput.trim() || !joinNameInput.trim()
                        ? 'opacity-40 cursor-not-allowed balatro-btn-dark text-slate-500'
                        : 'balatro-btn-blue text-white cursor-pointer'
                    }`}
                  >
                    {isSubmitting ? 'Joining Lobby...' : 'Join Lobby →'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* STATE 2: INSIDE ROOM LOBBY */
            <div className="space-y-6">
              
              {/* Room Code Showcase */}
              <div className="bg-[#0d0d0d] border-2 border-[#891c1c] rounded-2xl p-4 text-center shadow-[0_4px_0_#0a0f23]">
                <div className="text-[11px] font-black text-[#ef5368] uppercase tracking-widest mb-1.5">
                  Lobby Room Code
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  {roomInfo.room_code.split('').map((char, i) => (
                    <div
                      key={i}
                      className="w-12 h-14 bg-[#0a0f23] border-2 border-[#ef5368] rounded-xl flex items-center justify-center text-3xl font-black text-[#fffbd4] shadow-[0_4px_0_#0d0d0d]"
                    >
                      {char}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    onMouseEnter={() => soundFx.playHover()}
                    className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4] flex items-center gap-1.5"
                  >
                    <span>{copiedCode ? '✓ Copied Code!' : '📋 Copy Code'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    onMouseEnter={() => soundFx.playHover()}
                    className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4] flex items-center gap-1.5"
                  >
                    <span>{copiedLink ? '✓ Copied Link!' : '🔗 Copy Invite Link'}</span>
                  </button>
                </div>
              </div>

              {/* Connected Players Roster (1 Player = 1 Team) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-[#fffbd4]">
                    Connected Teams ({roomInfo.players.length} / 8)
                  </span>
                  <span className="text-[11px] text-[#ef5368] font-bold">
                    1 Player Controls 1 Team
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {roomInfo.players.map((p, idx) => {
                    const isMe = p.player_id === myPlayerId;
                    return (
                      <div
                        key={p.player_id}
                        className={`p-3 rounded-xl border-2 flex items-center justify-between shadow-[0_3px_0_#0d0d0d] ${
                          isMe
                            ? 'bg-[#0d0d0d] border-[#fffbd4]'
                            : 'bg-[#0a0f23] border-[#891c1c]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#891c1c] text-[#fffbd4] font-black text-xs flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <div className="font-black text-sm text-[#fffbd4] flex items-center gap-1.5">
                              <span>{p.name}</span>
                              {isMe && (
                                <span className="text-[10px] bg-[#ef5368] text-white px-1.5 py-0.2 rounded font-mono">YOU</span>
                              )}
                            </div>
                            <div className="text-[10px] text-[#fffbd4]/60 font-semibold">
                              Team {p.name}
                            </div>
                          </div>
                        </div>

                        <div>
                          {p.is_host ? (
                            <span className="text-xs bg-[#ef5368]/20 border border-[#ef5368] text-[#fffbd4] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                              Host
                            </span>
                          ) : (
                            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                              ● Ready
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Match Configuration Card (Goal: point_threshold pts) */}
              <div className="bg-[#0a0f23] border-2 border-[#891c1c] rounded-2xl p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_4px_0_#0d0d0d]">
                <div className="text-left w-full">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider text-[#ef5368]">
                      Match Configuration
                    </span>
                    {isMatchConfigured ? (
                      <span className="bg-[#1e3a2f] text-emerald-300 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-emerald-500/50">
                        Configured
                      </span>
                    ) : (
                      <span className="bg-[#891c1c] text-[#fffbd4] text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border border-[#ef5368]">
                        Unconfigured
                      </span>
                    )}
                  </div>

                  {isMatchConfigured ? (
                    <>
                      <div className="text-sm font-black text-[#fffbd4] break-words">
                        {matchMode === 'single'
                          ? `Single Round: ${selectedCategoryNames[0] || categories.find(c => c.index === (categoryIndices[0] ?? 0))?.title || 'Selected Category'}`
                          : matchMode === 'boss_rush'
                          ? `Boss Rush (Co-op): ${selectedCategoryNames[0] || categories.find(c => c.index === (categoryIndices[0] ?? 0))?.title || 'Selected Category'}`
                          : `Tournament (${categoryIndices.length} Categories)`}
                      </div>

                      <div className="text-xs text-[#fffbd4]/70 font-semibold mt-0.5">
                        {matchMode === 'boss_rush'
                          ? `Duration: ${Math.round((bossRushDuration || 300) / 60)} min • Goal: ${pointThreshold || 2000} pts • Co-op Squad Survival`
                          : `Target: ${pointThreshold} pts • Timer: ${turnTimer > 0 ? `${turnTimer}s` : 'Off'} • Turns: ${maxTurns > 0 ? maxTurns : 'Unlimited'}`}
                      </div>

                      {/* Multi-Round: Full ordered list of selected categories */}
                      {matchMode === 'multi' && (
                        <div className="mt-3 space-y-1.5 w-full">
                          <div className="text-[11px] font-black uppercase tracking-wider text-[#ef5368]">
                            Selected Categories in Round Order:
                          </div>
                          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto pr-1">
                            {selectedCategoryNames.map((name, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2.5 bg-[#0d0d0d] px-3 py-2 rounded-xl border border-[#891c1c]/60 text-xs font-black text-[#fffbd4]"
                              >
                                <span className="text-[#ef5368] font-mono text-[10px] bg-[#891c1c]/30 px-2 py-0.5 rounded-md shrink-0">
                                  Round {i + 1}
                                </span>
                                <span className="break-words whitespace-normal leading-tight flex-1">
                                  {name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm font-black text-[#ef5368]">
                      {isHost
                        ? 'Match not configured. Pick categories and rules before starting.'
                        : 'Waiting for the host to configure match rules and pick categories.'}
                    </div>
                  )}

                  {!isHost && isMatchConfigured && (
                    <p className="text-[11px] text-emerald-400 font-bold mt-2">
                      ● Waiting for host to launch the match. Match rules will lock once started.
                    </p>
                  )}
                </div>

                {isHost && (
                  <button
                    type="button"
                    onClick={() => {
                      soundFx.playFanfare();
                      onConfigureGame?.();
                    }}
                    onMouseEnter={() => soundFx.playHover()}
                    className="balatro-btn-blue px-7 py-3 rounded-2xl font-black text-sm uppercase tracking-wider text-white cursor-pointer shadow-lg whitespace-nowrap hover:scale-105 active:translate-y-0.5 transition shrink-0 self-start sm:self-center"
                  >
                    Configure Game
                  </button>
                )}
              </div>

              {/* Start Game / Lobby Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    onLeaveLobby();
                  }}
                  onMouseEnter={() => soundFx.playHover()}
                  className="w-full sm:w-auto balatro-btn-dark px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider cursor-pointer text-[#fffbd4]"
                >
                  Leave Lobby
                </button>

                {isHost && (
                  <button
                    type="button"
                    disabled={!isMatchConfigured || (matchMode !== 'boss_rush' && roomInfo.players.length < 2)}
                    onClick={handleLaunchMatch}
                    onMouseEnter={() => soundFx.playHover()}
                    className={`w-full sm:w-auto px-10 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg transition ${
                      !isMatchConfigured || (matchMode !== 'boss_rush' && roomInfo.players.length < 2)
                        ? 'opacity-40 cursor-not-allowed balatro-btn-dark text-slate-500'
                        : 'balatro-btn-purple text-white cursor-pointer'
                    }`}
                  >
                    {!isMatchConfigured
                      ? 'Configure Match to Start'
                      : matchMode !== 'boss_rush' && roomInfo.players.length < 2
                      ? 'Waiting for Friends (Need 2+ Players)...'
                      : 'Launch Online Match'}
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
