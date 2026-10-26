import React, { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';
import { Category, MatchConfig } from '../types';

interface MatchSetupProps {
  categories: Category[];
  onStartMatch: (config: MatchConfig) => void;
  onBack: () => void;
  onOpenTeams: () => void;
  initialMode?: 'single' | 'multi' | 'boss_rush';
  teams?: string[];
  turnTimer?: number;
}

export default function MatchSetup({
  categories,
  onStartMatch,
  onBack,
  onOpenTeams,
  initialMode = 'single',
  teams = [],
  turnTimer = 30
}: MatchSetupProps): React.JSX.Element {
  const [matchMode, setMatchMode] = useState<'single' | 'multi' | 'boss_rush'>(initialMode);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [bossRushDuration, setBossRushDuration] = useState<number>(300); // 300 (5m), 600 (10m), 900 (15m)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0]);
  const [showOneTeamModal, setShowOneTeamModal] = useState<boolean>(false);

  const isLessThanTwoTeams = matchMode !== 'boss_rush' && teams.length < 2;

  // Ensure selected indices match mode
  useEffect(() => {
    if (matchMode === 'single' || matchMode === 'boss_rush') {
      if (selectedIndices.length !== 1) {
        setSelectedIndices([0]);
      }
    } else {
      const count = Math.min(totalRounds, categories.length);
      const arr: number[] = [];
      for (let i = 0; i < count; i++) {
        arr.push(i % categories.length);
      }
      setSelectedIndices(arr);
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

  const handleStart = (): void => {
    if (isLessThanTwoTeams) {
      soundFx.playIncorrect();
      setShowOneTeamModal(true);
      return;
    }
    soundFx.playFanfare();
    onStartMatch({
      match_mode: matchMode,
      total_rounds: matchMode === 'multi' ? totalRounds : 1,
      category_indices: selectedIndices,
      boss_rush_duration: bossRushDuration
    });
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto w-full p-4 flex flex-col items-center">
      
      {/* Top Bar with Balatro Depth */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => { soundFx.playClick(); onBack(); }}
          className="balatro-btn-dark font-black w-11 h-11 rounded-xl flex items-center justify-center text-2xl cursor-pointer transition active:translate-y-0.5 text-[#9cf6ff]"
          title="Back"
          aria-label="Back"
        >
          ←
        </button>

        <h1 className="text-3xl font-black text-white tracking-wide uppercase text-center drop-shadow-[0_3px_0_#0c1079]">
          Match Setup
        </h1>

        <button
          onClick={() => { soundFx.playClick(); onOpenTeams(); }}
          className={`font-black px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider cursor-pointer flex items-center gap-1.5 transition-all ${
            isLessThanTwoTeams
              ? 'balatro-btn-teal ring-2 ring-[#62f6bd] text-[#003c5a] shadow-[0_0_15px_rgba(98,246,189,0.6)] animate-pulse'
              : 'balatro-btn-cyan text-[#0c1079]'
          }`}
          title="Configure Teams"
        >
          <span>Teams</span>
          <span className="font-black text-base">→</span>
        </button>
      </div>

      {/* Match Mode Selection (Distinct Cohesive Multi-Tone Styles) */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('single'); }}
          className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'single'
              ? 'bg-[#003c5a] border-[#00b6de] shadow-[0_5px_0_#0c1079]'
              : 'balatro-card opacity-85 hover:opacity-100 hover:border-[#00b6de]'
          }`}
        >
          <div className="text-lg font-black text-white mb-1">
            Single Round
          </div>
          <p className="text-xs text-[#9cf6ff]/90 font-medium">
            Standard head-to-head match on 1 category board.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('multi'); }}
          className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'multi'
              ? 'bg-[#3120cd] border-[#62f6bd] shadow-[0_5px_0_#0c1079]'
              : 'balatro-card opacity-85 hover:opacity-100 hover:border-[#62f6bd]'
          }`}
        >
          <div className="text-lg font-black text-white mb-1">
            Multi-Round
          </div>
          <p className="text-xs text-[#6ad6cd]/90 font-medium">
            2 to 5 categories in a cumulative championship match.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('boss_rush'); }}
          className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'boss_rush'
              ? 'bg-[#4a089c] border-[#62f6bd] shadow-[0_5px_0_#0c1079]'
              : 'balatro-card opacity-85 hover:opacity-100 hover:border-[#4a34de]'
          }`}
        >
          <div className="text-lg font-black text-[#62f6bd] mb-1">
            Boss Rush (Solo)
          </div>
          <p className="text-xs text-[#9cf6ff]/90 font-medium">
            1 team solo run against a 5, 10, or 15 minute timer!
          </p>
        </button>
      </div>

      {/* Multi-Round Settings Banner */}
      {matchMode === 'multi' && (
        <div className="w-full bg-[#3120cd] border-2 border-[#787bd1] border-b-4 border-b-[#0c1079] rounded-xl p-4 mb-5 text-center animate-in fade-in shadow-[0_4px_0_#0c1079]">
          <div className="text-xs font-black tracking-widest text-[#62f6bd] uppercase mb-1">
            Tournament Rule
          </div>
          <div className="text-lg font-black text-white tracking-wide mb-3">
            Points are cumulative across rounds
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-black text-[#9cf6ff] uppercase mr-1">Rounds:</span>
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => { soundFx.playClick(); setTotalRounds(num); }}
                className={`px-6 py-2.5 min-w-[58px] rounded-xl font-black text-base cursor-pointer transition uppercase ${
                  totalRounds === num
                    ? 'balatro-btn-teal text-[#003c5a] shadow-md'
                    : 'balatro-btn-dark text-[#9cf6ff]'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Boss Rush Settings Banner */}
      {matchMode === 'boss_rush' && (
        <div className="w-full bg-[#4a089c] border-2 border-[#787bd1] border-b-4 border-b-[#0c1079] rounded-xl p-4 mb-5 text-center animate-in fade-in shadow-[0_4px_0_#0c1079]">
          <div className="text-xs font-black tracking-widest text-[#62f6bd] uppercase mb-1">
            Boss Rush Solo Challenge
          </div>
          <div className="text-base font-black text-white tracking-wide mb-3">
            Choose Your Countdown Timer:
          </div>

          <div className="flex items-center justify-center gap-3">
            {[
              { label: '5 Min', secs: 300 },
              { label: '10 Min', secs: 600 },
              { label: '15 Min', secs: 900 }
            ].map(({ label, secs }) => (
              <button
                key={secs}
                type="button"
                onClick={() => { soundFx.playClick(); setBossRushDuration(secs); }}
                className={`px-5 py-2.5 rounded-xl font-black text-sm cursor-pointer transition uppercase ${
                  bossRushDuration === secs
                    ? 'balatro-btn-teal text-[#003c5a] shadow-md'
                    : 'balatro-btn-dark text-[#9cf6ff]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm font-black text-white tracking-wider uppercase drop-shadow-[0_1px_0_#0c1079]">
            Select {matchMode === 'single' ? 'Category' : `Categories (${selectedIndices.length} / ${totalRounds})`}
          </h2>
          <p className="text-xs text-[#6ad6cd]/80 font-semibold">
            {matchMode === 'single' ? 'Pick a category to begin' : 'Choose in order of play'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomize}
          className="balatro-btn-dark px-3.5 py-1.5 rounded-xl font-black text-xs uppercase tracking-wider cursor-pointer"
        >
          Random Selection
        </button>
      </div>

      {/* Category Grid with Balatro Slabs */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6 max-h-[44vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const isSelected = selectedIndices.includes(cat.index);
          const orderIndex = selectedIndices.indexOf(cat.index);

          return (
            <div
              key={cat.index}
              onClick={() => toggleCategory(cat.index)}
              className={`p-4 rounded-xl border-2 border-b-4 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#003c5a] border-[#62f6bd] border-b-[#087d6a] shadow-[0_4px_0_#0c1079,inset_0_1.5px_0_rgba(98,246,189,0.3)]'
                  : 'balatro-card hover:border-[#00b6de]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-black text-sm text-white line-clamp-2 leading-tight">
                  {cat.title}
                </span>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-[#62f6bd] text-[#003c5a] font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_0_#0c1079]">
                    {matchMode === 'multi' ? orderIndex + 1 : '✓'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#6ad6cd]/80">{cat.count} Items</span>
                <span className={isSelected ? 'text-[#62f6bd]' : 'text-[#787bd1]'}>
                  {isSelected ? (matchMode === 'multi' ? `Round ${orderIndex + 1}` : 'Selected') : 'Select'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start Button */}
      <div className="w-full flex justify-center pb-6">
        <button
          type="button"
          onClick={handleStart}
          className="font-black text-lg px-12 py-3.5 rounded-xl tracking-wide uppercase transition shadow-xl balatro-btn-teal text-[#003c5a] cursor-pointer hover:scale-102 active:scale-98"
        >
          {matchMode === 'boss_rush'
            ? `Start Boss Rush (${bossRushDuration / 60}m)`
            : matchMode === 'single'
            ? 'Start Game'
            : `Start ${totalRounds}-Round Match`}
        </button>
      </div>

      {/* 2+ Teams Required Pop-up Modal */}
      {showOneTeamModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center animate-in zoom-in-95 border-[#787bd1] shadow-2xl">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
              2+ Teams Required
            </h3>
            <p className="text-sm text-[#9cf6ff]/90 font-semibold mb-6 leading-relaxed">
              Standard and multi-round matches require at least 2 teams. Please add another team in <strong className="text-white">Teams</strong>, or switch to <strong className="text-[#62f6bd]">Boss Rush (Solo)</strong>.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowOneTeamModal(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#9cf6ff]"
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
                className="balatro-btn-cyan px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#0c1079] flex items-center gap-2 shadow-lg hover:scale-105 transition"
              >
                Go to Teams →
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
