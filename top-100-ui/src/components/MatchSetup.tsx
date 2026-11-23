import React, { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';
import { Category, MatchConfig, GameSettings } from '../types';

interface MatchSetupProps {
  categories: Category[];
  onStartMatch: (config: MatchConfig) => void;
  onBack: () => void;
  onOpenTeams: (config?: MatchConfig) => void;
  initialMode?: 'single' | 'multi' | 'boss_rush';
  teams?: string[];
  defaultSettings?: GameSettings;
  turnTimer?: number;
  isOnlinePicker?: boolean;
  isOnlineConfigure?: boolean;
  initialRounds?: number;
  initialCategoryIndices?: number[];
  onSaveCategories?: (selection: {
    matchMode: 'single' | 'multi' | 'boss_rush';
    totalRounds: number;
    categoryIndices: number[];
  }) => void;
  onSaveConfig?: (config: {
    matchMode: 'single' | 'multi' | 'boss_rush';
    totalRounds: number;
    categoryIndices: number[];
    settings: GameSettings;
  }) => void;
  onCancelCategories?: () => void;
  onCancelConfig?: () => void;
}

export default function MatchSetup({
  categories,
  onStartMatch,
  onBack,
  onOpenTeams,
  initialMode = 'single',
  teams = [],
  defaultSettings,
  turnTimer = 30,
  isOnlinePicker = false,
  isOnlineConfigure = false,
  initialRounds,
  initialCategoryIndices,
  onSaveCategories,
  onSaveConfig,
  onCancelCategories,
  onCancelConfig
}: MatchSetupProps): React.JSX.Element {
  const isOnline = isOnlinePicker || isOnlineConfigure;
  const [matchMode, setMatchMode] = useState<'single' | 'multi' | 'boss_rush'>(initialMode);
  const [totalRounds, setTotalRounds] = useState<number>(initialRounds ?? 3);
  const [bossRushDuration, setBossRushDuration] = useState<number>(300); // 300 (5m), 600 (10m), 900 (15m)
  const [selectedIndices, setSelectedIndices] = useState<number[]>(() => {
    if (initialCategoryIndices && initialCategoryIndices.length > 0) {
      return initialCategoryIndices;
    }
    return [0];
  });
  const [showOneTeamModal, setShowOneTeamModal] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredCategories = React.useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter((cat) =>
      cat.title.toLowerCase().includes(q) || (cat.subtitle && cat.subtitle.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  // Match rules chosen pre-game
  const [turnTimerSetting, setTurnTimerSetting] = useState<number>(defaultSettings?.turn_timer ?? turnTimer ?? 30);
  const [endCondition, setEndCondition] = useState<'both' | 'turns' | 'points'>(defaultSettings?.end_condition ?? 'both');
  const [pointThreshold, setPointThreshold] = useState<number>(defaultSettings?.point_threshold ?? (initialMode === 'boss_rush' ? 2000 : 500));
  const [maxTurns, setMaxTurns] = useState<number>(defaultSettings?.max_turns ?? (defaultSettings?.end_condition === 'turns' ? 15 : 0));

  useEffect(() => {
    if (matchMode === 'boss_rush' && (!pointThreshold || pointThreshold < 1000)) {
      setPointThreshold(2000);
    }
  }, [matchMode, pointThreshold]);

  const isInvalidTeams = matchMode === 'boss_rush' ? teams.length !== 1 : teams.length < 1;

  // Ensure selected indices match mode
  useEffect(() => {
    if (matchMode === 'single' || matchMode === 'boss_rush') {
      if (selectedIndices.length !== 1) {
        setSelectedIndices([selectedIndices[0] ?? 0]);
      }
    } else {
      const count = Math.min(totalRounds, categories.length);
      if (selectedIndices.length !== count) {
        const arr: number[] = [...selectedIndices];
        while (arr.length < count) {
          const next = categories.find(c => !arr.includes(c.index))?.index ?? (arr.length % categories.length);
          arr.push(next);
        }
        setSelectedIndices(arr.slice(0, count));
      }
    }
  }, [matchMode, totalRounds, categories.length]);

  const toggleCategory = (idx: number): void => {
    soundFx.playClick();
    if (matchMode === 'single' || matchMode === 'boss_rush') {
      setSelectedIndices([idx]);
    } else {
      if (selectedIndices.includes(idx)) {
        if (selectedIndices.length > 1) {
          setSelectedIndices(selectedIndices.filter(i => i !== idx));
        }
      } else {
        if (selectedIndices.length < totalRounds) {
          setSelectedIndices([...selectedIndices, idx]);
        } else {
          const updated = [...selectedIndices.slice(0, totalRounds - 1), idx];
          setSelectedIndices(updated);
        }
      }
    }
  };

  const handleRandomize = (): void => {
    soundFx.playCorrect();
    const count = matchMode === 'multi' ? totalRounds : 1;
    const shuffled = [...categories.map(c => c.index)].sort(() => Math.random() - 0.5);
    setSelectedIndices(shuffled.slice(0, count));
  };

  const getMatchConfig = (): MatchConfig => ({
    match_mode: matchMode,
    total_rounds: matchMode === 'multi' ? totalRounds : 1,
    category_indices: selectedIndices,
    boss_rush_duration: bossRushDuration,
    turn_timer: matchMode === 'boss_rush' ? 0 : turnTimerSetting,
    point_threshold: pointThreshold,
    max_turns: maxTurns,
    end_condition: endCondition
  });

  const handleNextToTeams = (): void => {
    soundFx.playClick();
    onOpenTeams(getMatchConfig());
  };

  const handleStart = (): void => {
    if (isInvalidTeams) {
      soundFx.playIncorrect();
      setShowOneTeamModal(true);
      return;
    }
    soundFx.playFanfare();
    onStartMatch(getMatchConfig());
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto w-full p-4 flex flex-col items-center">
      
      {/* Top Bar with Balatro Depth */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => {
            soundFx.playClick();
            if (isOnlineConfigure && onCancelConfig) {
              onCancelConfig();
            } else if (isOnlinePicker && onCancelCategories) {
              onCancelCategories();
            } else {
              onBack();
            }
          }}
          onMouseEnter={() => soundFx.playHover()}
          className="balatro-btn-dark font-black w-11 h-11 rounded-xl flex items-center justify-center text-2xl cursor-pointer transition active:translate-y-0.5 text-[#fffbd4]"
          title="Back"
          aria-label="Back"
        >
          ←
        </button>

        <h1 className="text-3xl font-black text-[#fffbd4] tracking-wide uppercase text-center drop-shadow-[0_3px_0_#0d0d0d]">
          {isOnlineConfigure ? 'Configure Online Match' : isOnlinePicker ? 'Pick Categories' : 'Match Setup'}
        </h1>

        <div className="w-11" />
      </div>

      {/* Match Mode Selection */}
      <div className={`w-full grid gap-3 mb-5 ${isOnline ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <button
          type="button"
          onMouseEnter={() => soundFx.playHover()}
          onClick={() => { soundFx.playClick(); setMatchMode('single'); }}
          className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'single'
              ? 'bg-[#0d0d0d] border-[#fffbd4] match-mode-card-selected'
              : 'balatro-card opacity-85 hover:opacity-100 hover:border-[#ef5368]'
          }`}
        >
          <div className="text-lg font-black text-[#fffbd4] mb-1">
            Single Round
          </div>
          <p className="text-xs text-[#fffbd4]/90 font-medium">
            Standard head-to-head match on 1 category board.
          </p>
        </button>

        <button
          type="button"
          onMouseEnter={() => soundFx.playHover()}
          onClick={() => { soundFx.playClick(); setMatchMode('multi'); }}
          className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'multi'
              ? 'bg-[#0d0d0d] border-[#fffbd4] match-mode-card-selected'
              : 'balatro-card opacity-85 hover:opacity-100 hover:border-[#ef5368]'
          }`}
        >
          <div className="text-lg font-black text-[#fffbd4] mb-1">
            Multi-Round
          </div>
          <p className="text-xs text-[#fffbd4]/90 font-medium">
            2 to 5 categories in a cumulative championship match.
          </p>
        </button>

        <button
          type="button"
          onMouseEnter={() => soundFx.playHover()}
          onClick={() => { soundFx.playClick(); setMatchMode('boss_rush'); }}
          className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'boss_rush'
              ? 'bg-[#0d0d0d] border-[#fffbd4] match-mode-card-selected'
              : 'balatro-card opacity-85 hover:opacity-100 hover:border-[#ef5368]'
          }`}
        >
          <div className="text-lg font-black text-[#ef5368] mb-1">
            Boss Rush
          </div>
          <p className="text-xs text-[#fffbd4]/90 font-medium">
            {isOnline ? 'Co-op squad run against a 5, 10, or 15 minute timer!' : '1 team solo run against a 5, 10, or 15 minute timer!'}
          </p>
        </button>
      </div>

      {/* Category Selection Header & Search Bar */}
      <div className="w-full flex flex-col gap-2.5 mb-3 px-1">
        <div className="w-full flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[#fffbd4] tracking-wider uppercase drop-shadow-[0_1px_0_#0d0d0d]">
              Select {matchMode === 'single' ? 'Category' : `Categories (${selectedIndices.length} / ${totalRounds})`}
            </h2>
            <p className="text-xs text-[#fffbd4]/70 font-semibold">
              {matchMode === 'single' ? 'Pick a category to begin' : 'Choose in order of play'}
            </p>
          </div>

          <button
            type="button"
            onMouseEnter={() => soundFx.playHover()}
            onClick={handleRandomize}
            className="balatro-btn-dark px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer text-[#fffbd4]"
          >
            Random Selection
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search categories (e.g. animals, movies, gaming, food)..."
            className="w-full bg-[#0a0f23]/90 border-2 border-slate-700/80 focus:border-amber-400 rounded-xl px-3.5 py-2 text-xs md:text-sm text-[#fffbd4] placeholder-slate-400 focus:outline-none transition shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-black px-1.5 py-0.5 rounded cursor-pointer"
            >
              CLEAR
            </button>
          )}
        </div>
      </div>

      {/* Category Grid with Hidden Scrollbar (Shows 9 Categories / 3 Rows Before Scroll) */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 min-h-[440px] max-h-[62vh] overflow-y-auto px-1 py-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {filteredCategories.length === 0 ? (
          <div className="col-span-full py-8 text-center text-slate-400 font-bold text-sm bg-black/30 rounded-xl border border-slate-800">
            No categories found matching &quot;{searchQuery}&quot;. Try another search term!
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isSelected = selectedIndices.includes(cat.index);
            const orderIndex = selectedIndices.indexOf(cat.index);

            return (
              <div
                key={cat.index}
                onMouseEnter={() => soundFx.playHover()}
                onClick={() => toggleCategory(cat.index)}
                className={`relative rounded-xl cursor-pointer transition-all flex flex-col justify-between select-none min-h-[132px] px-4 pt-3.5 pb-5 ${
                  isSelected
                    ? 'bg-[#0d0d0d] border-2 border-[#fffbd4] cat-card-selected'
                    : 'cat-card-unselected'
                }`}
              >
                {/* Absolute Badge: positioned top-3 right-3, never squeezes text */}
                {isSelected && (
                  <span className="cat-selected-badge absolute top-3 right-3 w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 z-10 pointer-events-none">
                    {matchMode === 'multi' ? orderIndex + 1 : '✓'}
                  </span>
                )}

                {/* Title Section with reserved right padding for badge */}
                <div className="mb-2 pr-7 min-w-0">
                  <span className={`font-black text-sm leading-snug break-words block ${isSelected ? 'text-[#fffbd4]' : 'text-[#fffbd4]/80'}`}>
                    {cat.title}
                  </span>
                  {cat.subtitle && (
                    <span className="text-[11px] font-semibold text-amber-300/90 leading-tight block mt-1">
                      {cat.subtitle}
                    </span>
                  )}
                </div>

                {/* Footer row with dedicated bottom clearance */}
                <div className="flex items-center justify-between mt-auto pt-2 pb-0">
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isSelected ? 'cat-count-badge-selected' : 'bg-[#0d0d0d] text-[#fffbd4]/60'}`}>
                    {cat.count} Items
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-wider ${isSelected ? 'cat-status-selected' : 'text-[#fffbd4]/50'}`}>
                    {isSelected ? (matchMode === 'multi' ? `Round ${orderIndex + 1}` : 'Selected') : 'Pick'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Boss Rush Rules & Conditions (Configured Pre-Game) */}
      {matchMode === 'boss_rush' && !isOnlinePicker && (
        <div className="w-full bg-[#0a0f23] border-2 border-[#891c1c] rounded-2xl p-4 md:p-5 mb-6 shadow-[0_6px_0_#0d0d0d] animate-in fade-in">
          <div className="mb-4 border-b border-[#891c1c]/40 pb-3">
            <h2 className="text-sm md:text-base font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_1px_0_#0d0d0d]">
              Boss Rush Solo Challenge Rules
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-2">
                Countdown Timer
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: '5 Min', secs: 300 },
                  { label: '10 Min', secs: 600 },
                  { label: '15 Min', secs: 900 }
                ].map(({ label, secs }) => (
                  <button
                    key={secs}
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => { soundFx.playClick(); setBossRushDuration(secs); }}
                    className={`py-2.5 rounded-xl font-black text-xs sm:text-sm cursor-pointer transition uppercase ${
                      bossRushDuration === secs
                        ? 'balatro-btn-blue text-white shadow-md'
                        : 'balatro-btn-dark text-[#fffbd4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-2">
                Target Score Goal
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {[
                  { label: '1,000 pts', val: 1000 },
                  { label: '1,500 pts', val: 1500 },
                  { label: '2,000 pts', val: 2000 },
                  { label: '3,000 pts', val: 3000 },
                  { label: '4,000 pts', val: 4000 },
                  { label: '5,000 pts', val: 5000 }
                ].map(({ label, val }) => (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => {
                      soundFx.playClick();
                      setPointThreshold(val);
                    }}
                    className={`py-2 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition ${
                      (pointThreshold || 2000) === val
                        ? 'balatro-btn-blue text-white shadow-md'
                        : 'balatro-btn-dark text-[#fffbd4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match Rules & Timers (Configured Pre-Game) */}
      {matchMode !== 'boss_rush' && !isOnlinePicker && (
        <div className="w-full bg-[#0a0f23] border-2 border-[#891c1c] rounded-2xl p-4 md:p-5 mb-6 shadow-[0_6px_0_#0d0d0d]">
          <div className="mb-4 border-b border-[#891c1c]/40 pb-3 flex items-center justify-between">
            <h2 className="text-sm md:text-base font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_1px_0_#0d0d0d]">
              Match Rules & Conditions
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Multi-Round Count Selector */}
            {matchMode === 'multi' && (
              <div className="col-span-full border-b border-[#891c1c]/40 pb-4 mb-1">
                <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-2">
                  Total Match Rounds
                </label>
                <div className="flex items-center gap-3">
                  {[2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onMouseEnter={() => soundFx.playHover()}
                      onClick={() => { soundFx.playClick(); setTotalRounds(num); }}
                      className={`px-6 py-2 min-w-[58px] rounded-xl font-black text-sm cursor-pointer transition uppercase ${
                        totalRounds === num
                          ? 'balatro-btn-blue text-white shadow-md'
                          : 'balatro-btn-dark text-[#fffbd4]'
                      }`}
                    >
                      {num} Rounds
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* End Condition Mode */}
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-2">
                End Condition
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'both', label: 'Turns + Pts' },
                  { val: 'turns', label: 'Turns Only' },
                  { val: 'points', label: 'Points Only' }
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => {
                      soundFx.playSettingsChange();
                      setEndCondition(val as any);
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-xs uppercase tracking-wide cursor-pointer transition ${
                      endCondition === val
                        ? 'balatro-btn-blue text-white shadow-md'
                        : 'balatro-btn-dark text-[#fffbd4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Turn Timer */}
            <div>
              <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-2">
                Turn Timer
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: 0, label: 'Off' },
                  { val: 30, label: '30s' },
                  { val: 60, label: '60s' },
                  { val: 90, label: '90s' }
                ].map(({ val, label }) => (
                  <button
                    key={val}
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => {
                      soundFx.playSettingsChange();
                      setTurnTimerSetting(val);
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-xs uppercase tracking-wide cursor-pointer transition ${
                      turnTimerSetting === val
                        ? 'balatro-btn-blue text-white shadow-md'
                        : 'balatro-btn-dark text-[#fffbd4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Winning Point Threshold */}
            <div className={endCondition === 'turns' ? 'opacity-35 pointer-events-none' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4]">
                  Winning Point Target
                </label>
                {endCondition === 'turns' && (
                  <span className="text-[10px] font-bold text-rose-400">(Disabled)</span>
                )}
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {[250, 500, 750, 1000, 1500, 2500].map((pts) => (
                  <button
                    key={pts}
                    type="button"
                    onMouseEnter={() => soundFx.playHover()}
                    onClick={() => {
                      soundFx.playSettingsChange();
                      setPointThreshold(pts);
                    }}
                    className={`py-2 rounded-xl font-black text-xs uppercase tracking-wider text-center cursor-pointer transition ${
                      pointThreshold === pts
                        ? 'balatro-btn-blue text-white shadow-md'
                        : 'balatro-btn-dark text-[#fffbd4]'
                    }`}
                  >
                    {pts}
                  </button>
                ))}
              </div>
            </div>

            {/* Max Turns per Team */}
            <div className={endCondition === 'points' ? 'opacity-35 pointer-events-none' : ''}>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-black tracking-wider uppercase text-[#fffbd4]">
                  Max Turns Per Team
                </label>
                {endCondition === 'points' && (
                  <span className="text-[10px] font-bold text-rose-400">(Unlimited)</span>
                )}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { val: 0, label: 'Unlimited', disabled: endCondition === 'turns' },
                  { val: 10, label: '10' },
                  { val: 15, label: '15' },
                  { val: 20, label: '20' }
                ].map(({ val, label, disabled }) => (
                  <button
                    key={val}
                    type="button"
                    disabled={disabled}
                    onMouseEnter={() => { if (!disabled) soundFx.playHover(); }}
                    onClick={() => {
                      soundFx.playSettingsChange();
                      setMaxTurns(val);
                    }}
                    className={`py-2 rounded-xl font-black text-xs uppercase tracking-wide cursor-pointer transition ${
                      disabled
                        ? 'opacity-30 cursor-not-allowed balatro-btn-dark text-slate-500'
                        : maxTurns === val
                        ? 'balatro-btn-blue text-white shadow-md'
                        : 'balatro-btn-dark text-[#fffbd4]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Start / Save Actions */}
      <div className="w-full flex justify-center pb-6">
        {isOnline ? (
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                if (onCancelConfig) {
                  onCancelConfig();
                } else if (onCancelCategories) {
                  onCancelCategories();
                } else {
                  onBack();
                }
              }}
              onMouseEnter={() => soundFx.playHover()}
              className="balatro-btn-dark px-8 py-3.5 rounded-2xl font-black text-base uppercase tracking-wider cursor-pointer text-[#fffbd4] transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playCorrect();
                if (onSaveConfig) {
                  onSaveConfig({
                    matchMode,
                    totalRounds: matchMode === 'multi' ? totalRounds : 1,
                    categoryIndices: selectedIndices,
                    settings: {
                      match_mode: matchMode,
                      boss_rush_duration: bossRushDuration,
                      turn_timer: turnTimerSetting,
                      point_threshold: pointThreshold,
                      max_turns: maxTurns,
                      end_condition: endCondition
                    }
                  });
                } else if (onSaveCategories) {
                  onSaveCategories({
                    matchMode,
                    totalRounds: matchMode === 'multi' ? totalRounds : 1,
                    categoryIndices: selectedIndices
                  });
                }
              }}
              onMouseEnter={() => soundFx.playHover()}
              className="balatro-btn-purple px-10 py-3.5 rounded-2xl font-black text-base uppercase tracking-wider cursor-pointer text-white shadow-xl transition"
            >
              Save Settings
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleNextToTeams}
            onMouseEnter={() => soundFx.playHover()}
            className="font-black text-xl md:text-2xl px-12 py-4 rounded-2xl tracking-wider uppercase transition shadow-xl balatro-btn-purple text-white cursor-pointer"
          >
            Configure Teams
          </button>
        )}
      </div>

      {/* Teams Required Pop-up Modal */}
      {showOneTeamModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in-95 border-slate-700 shadow-2xl">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-xl font-black text-rose-400 uppercase tracking-wider mb-2">
              {matchMode === 'boss_rush' ? '1 Team Required' : 'Team Required'}
            </h3>
            <p className="text-sm text-[#fffbd4]/90 font-semibold mb-6 leading-relaxed">
              {matchMode === 'boss_rush'
                ? 'Boss Rush is designed for 1 player/team solo play. Please configure 1 team to start.'
                : 'Please configure at least 1 team to start the match.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowOneTeamModal(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowOneTeamModal(false);
                  onOpenTeams();
                }}
                className="balatro-btn-blue px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-white flex items-center gap-2 shadow-lg hover:scale-105 transition"
              >
                Configure Teams
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
