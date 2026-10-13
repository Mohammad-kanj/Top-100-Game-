import { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';

export default function MatchSetup({ categories, onStartMatch, onBack, onOpenTeams }) {
  const [matchMode, setMatchMode] = useState('single'); // 'single' or 'multi'
  const [totalRounds, setTotalRounds] = useState(3);
  const [selectedIndices, setSelectedIndices] = useState([0]);

  // Ensure selected indices match mode
  useEffect(() => {
    if (matchMode === 'single') {
      if (selectedIndices.length !== 1) {
        setSelectedIndices([0]);
      }
    } else {
      // For multi-round, pick totalRounds categories
      const count = Math.min(totalRounds, categories.length);
      const arr = [];
      for (let i = 0; i < count; i++) {
        arr.push(i % categories.length);
      }
      setSelectedIndices(arr);
    }
  }, [matchMode, totalRounds, categories.length]);

  const toggleCategory = (idx) => {
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
          // Replace last
          const updated = [...selectedIndices.slice(0, totalRounds - 1), idx];
          setSelectedIndices(updated);
        }
      }
    }
  };

  const handleRandomize = () => {
    soundFx.playCorrect();
    const count = matchMode === 'single' ? 1 : totalRounds;
    const shuffled = [...categories.map(c => c.index)].sort(() => Math.random() - 0.5);
    setSelectedIndices(shuffled.slice(0, count));
  };

  const handleStart = () => {
    soundFx.playFanfare();
    onStartMatch({
      match_mode: matchMode,
      total_rounds: matchMode === 'single' ? 1 : totalRounds,
      category_indices: selectedIndices
    });
  };

  return (
    <div className="relative z-10 max-w-5xl mx-auto w-full p-4 flex flex-col items-center">
      
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between mb-6">
        <button
          onClick={() => { soundFx.playClick(); onBack(); }}
          className="bg-[#17153b] hover:bg-[#252254] text-gray-300 font-bold px-4 py-2 rounded-xl border border-gray-700 flex items-center gap-2 transition"
        >
          <span>◀</span> MAIN MENU
        </button>

        <h1 className="text-3xl font-black text-[#00F0FF] tracking-wider uppercase drop-shadow-[0_0_12px_rgba(0,240,255,0.7)] text-center">
          MATCH SETUP
        </h1>

        <button
          onClick={() => { soundFx.playClick(); onOpenTeams(); }}
          className="bg-[#17153b] hover:bg-[#252254] text-[#FFE600] font-bold px-4 py-2 rounded-xl border border-[#FFE600]/40 flex items-center gap-2 transition"
        >
          <span>👥</span> TEAMS
        </button>
      </div>

      {/* Match Mode Selection */}
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('single'); }}
          className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
            matchMode === 'single'
              ? 'bg-[#17153b] border-[#00F0FF] shadow-[0_0_20px_rgba(0,240,255,0.4)] scale-[1.01]'
              : 'bg-[#0f0e26]/80 border-gray-800 hover:border-gray-600 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-black text-white">SINGLE ROUND</span>
            <span className="text-2xl">🎯</span>
          </div>
          <p className="text-xs text-gray-300">
            Play one standalone category board to determine the winner.
          </p>
        </button>

        <button
          type="button"
          onClick={() => { soundFx.playClick(); setMatchMode('multi'); }}
          className={`p-5 rounded-2xl border-2 transition-all text-left flex flex-col justify-between ${
            matchMode === 'multi'
              ? 'bg-[#17153b] border-[#FF007F] shadow-[0_0_20px_rgba(255,0,127,0.4)] scale-[1.01]'
              : 'bg-[#0f0e26]/80 border-gray-800 hover:border-gray-600 opacity-80'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-black text-white">MULTI-ROUND TOURNAMENT</span>
            <span className="text-2xl">🏆</span>
          </div>
          <p className="text-xs text-gray-300">
            Play 2 to 5 categories in a championship match.
          </p>
        </button>
      </div>

      {/* Multi-Round Settings Banner */}
      {matchMode === 'multi' && (
        <div className="w-full bg-[#FF007F]/15 border-2 border-[#FF007F] rounded-2xl p-4 mb-6 text-center animate-in fade-in shadow-[0_0_20px_rgba(255,0,127,0.2)]">
          <div className="text-xs font-black tracking-widest text-[#FF007F] uppercase mb-1">
            ⚡ IMPORTANT TOURNAMENT RULE ⚡
          </div>
          <div className="text-lg md:text-xl font-black text-white tracking-wide mb-3">
            Points are cumulative across rounds!
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-bold text-gray-300 uppercase">Number of Rounds:</span>
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => { soundFx.playClick(); setTotalRounds(num); }}
                className={`w-10 h-10 rounded-xl font-black text-sm border-2 transition ${
                  totalRounds === num
                    ? 'bg-[#FF007F] border-[#FF007F] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)]'
                    : 'bg-[#17153b] border-gray-700 text-gray-300 hover:border-[#FF007F]/40'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Selection Header */}
      <div className="w-full flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-[#FFE600] tracking-wider uppercase">
            SELECT {matchMode === 'single' ? 'CATEGORY' : `CATEGORIES (${selectedIndices.length} / ${totalRounds})`}
          </h2>
          <p className="text-xs text-gray-400">
            {matchMode === 'single' ? 'Pick the category to play' : 'Choose in order of play or click Random'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleRandomize}
          className="bg-[#FFE600]/20 hover:bg-[#FFE600]/30 border border-[#FFE600] text-[#FFE600] px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition flex items-center gap-2"
        >
          <span>🎲</span> RANDOM SELECTION
        </button>
      </div>

      {/* Category Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-8 max-h-[46vh] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const isSelected = selectedIndices.includes(cat.index);
          const orderIndex = selectedIndices.indexOf(cat.index);

          return (
            <div
              key={cat.index}
              onClick={() => toggleCategory(cat.index)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#17153b] border-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.35)] scale-[1.02]'
                  : 'bg-[#0f0e26]/90 border-gray-800 hover:border-gray-600 hover:bg-[#151433]'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-black text-sm text-white line-clamp-2 leading-tight">
                  {cat.title}
                </span>
                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-[#00F0FF] text-black font-black text-xs flex items-center justify-center shrink-0">
                    {matchMode === 'multi' ? orderIndex + 1 : '✓'}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                <span>{cat.count} Items</span>
                <span className={isSelected ? 'text-[#00F0FF] font-bold' : ''}>
                  {isSelected ? (matchMode === 'multi' ? `Round ${orderIndex + 1}` : 'Selected') : 'Click to Pick'}
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
          className="bg-gradient-to-r from-[#00F0FF] via-[#00c8e0] to-[#FFE600] hover:brightness-110 text-black font-black text-lg md:text-xl px-12 py-4 rounded-2xl shadow-[0_0_30px_rgba(0,240,255,0.5)] tracking-wider transition-all active:scale-95 uppercase flex items-center gap-3"
        >
          <span>🚀</span> START {matchMode === 'single' ? 'GAME' : `${totalRounds}-ROUND MATCH`}
        </button>
      </div>

    </div>
  );
}
