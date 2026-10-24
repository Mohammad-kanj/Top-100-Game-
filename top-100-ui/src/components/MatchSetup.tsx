import React, { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';
import { Category, MatchConfig } from '../types';

interface MatchSetupProps {
  categories: Category[];
  onStartMatch: (config: MatchConfig) => void;
  onBack: () => void;
  onOpenTeams: () => void;
}

export default function MatchSetup({ categories, onStartMatch, onBack, onOpenTeams }: MatchSetupProps): React.JSX.Element {
  const [matchMode, setMatchMode] = useState<'single' | 'multi'>('single');
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([0]);

  // Ensure selected indices match mode
  useEffect(() => {
    if (matchMode === 'single') {
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
    if (matchMode === 'single') {
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
    const count = matchMode === 'single' ? 1 : totalRounds;
    const shuffled = [...categories.map(c => c.index)].sort(() => Math.random() - 0.5);
    setSelectedIndices(shuffled.slice(0, count));
  };

  const handleStart = (): void => {
    soundFx.playFanfare();
    onStartMatch({
      match_mode: matchMode,
      total_rounds: matchMode === 'single' ? 1 : totalRounds,
      category_indices: selectedIndices
    });
  };

  return (
    <div className="relative z-10 max-w-4xl mx-auto w-full p-4 flex flex-col items-center">
      
      {/* Top Bar with Balatro Depth */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={() => { soundFx.playClick(); onBack(); }}
          className="balatro-btn-dark text-slate-200 font-black px-4 py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer"
        >
          Back to Menu
        </button>

        <h1 className="text-3xl font-black text-white tracking-wide uppercase text-center drop-shadow-[0_3px_0_#140b2e]">
          Match Setup
        </h1>

        <button
          onClick={() => { soundFx.playClick(); onOpenTeams(); }}
          className="balatro-btn-purple text-white font-black px-6 py-2.5 rounded-xl text-sm uppercase tracking-wider cursor-pointer"
        >
          Teams
        </button>
      </div>

      {/* Match Mode Selection */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('single'); }}
          className={`p-5 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'single'
              ? 'bg-[#2a1d63] border-[#7c3aed] shadow-[0_5px_0_#000]'
              : 'balatro-card opacity-80 hover:opacity-100'
          }`}
        >
          <div className="text-xl font-black text-white mb-1">
            Single Round
          </div>
          <p className="text-xs text-purple-200/80 font-medium">
            Play one standalone category board to determine the winner.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('multi'); }}
          className={`p-5 rounded-xl border-2 transition-all text-left flex flex-col justify-between cursor-pointer ${
            matchMode === 'multi'
              ? 'bg-[#1b2b6b] border-[#2563eb] shadow-[0_5px_0_#000]'
              : 'balatro-card opacity-80 hover:opacity-100'
          }`}
        >
          <div className="text-xl font-black text-white mb-1">
            Multi-Round Tournament
          </div>
          <p className="text-xs text-blue-200/80 font-medium">
            Play 2 to 5 categories in a cumulative championship match.
          </p>
        </button>
      </div>

      {/* Multi-Round Settings Banner */}
      {matchMode === 'multi' && (
        <div className="w-full balatro-card rounded-xl p-4 mb-5 text-center animate-in fade-in">
          <div className="text-xs font-black tracking-widest text-blue-400 uppercase mb-1">
            Tournament Rule
          </div>
          <div className="text-lg font-black text-white tracking-wide mb-3">
            Points are cumulative across rounds
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="text-sm font-black text-purple-200 uppercase mr-1">Rounds:</span>
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => { soundFx.playClick(); setTotalRounds(num); }}
                className={`px-6 py-2.5 min-w-[58px] rounded-xl font-black text-base cursor-pointer transition uppercase ${
                  totalRounds === num
                    ? 'balatro-btn-blue text-white shadow-md'
                    : 'balatro-btn-dark text-slate-300'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection Header */}
      <div className="w-full flex items-center justify-between mb-3 px-1">
        <div>
          <h2 className="text-sm font-black text-white tracking-wider uppercase drop-shadow-[0_1px_0_#0f0724]">
            Select {matchMode === 'single' ? 'Category' : `Categories (${selectedIndices.length} / ${totalRounds})`}
          </h2>
          <p className="text-xs text-purple-200/70 font-semibold">
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
                  ? 'bg-[#291a5c] border-purple-400 border-b-[#1b0841] shadow-[0_4px_0_#0e0424,inset_0_1.5px_0_rgba(255,255,255,0.2)]'
                  : 'balatro-card hover:border-[#6366f1]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-black text-sm text-white line-clamp-2 leading-tight">
                  {cat.title}
                </span>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-white text-slate-950 font-black text-xs flex items-center justify-center shrink-0 shadow-[0_2px_0_rgba(0,0,0,0.4)]">
                    {matchMode === 'multi' ? orderIndex + 1 : '✓'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-purple-200/60">{cat.count} Items</span>
                <span className={isSelected ? 'text-purple-300' : 'text-slate-400'}>
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
          className="balatro-btn-white font-black text-lg px-12 py-3.5 rounded-xl tracking-wide uppercase cursor-pointer shadow-xl"
        >
          Start {matchMode === 'single' ? 'Game' : `${totalRounds}-Round Match`}
        </button>
      </div>

    </div>
  );
}
