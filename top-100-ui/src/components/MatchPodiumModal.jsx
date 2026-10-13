import { useEffect } from 'react';
import { soundFx } from '../soundFx';

export default function MatchPodiumModal({ gameState, onRematch, onReturnMenu }) {
  const teams = gameState.teams || [];
  const matchScores = gameState.match_scores || [];

  useEffect(() => {
    soundFx.playFanfare();
  }, []);

  // Sort teams by match score descending
  const standings = teams.map((team, idx) => ({
    team,
    score: matchScores[idx] || 0,
    originalIdx: idx
  })).sort((a, b) => b.score - a.score);

  const champion = standings[0] || { team: 'None', score: 0 };
  const second = standings[1] || null;
  const third = standings[2] || null;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-500">
      <div className="bg-[#0f0e26] border-2 border-[#FF007F] rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_60px_rgba(255,0,127,0.5)] flex flex-col text-center">
        
        {/* Banner */}
        <div className="p-8 bg-gradient-to-b from-[#24133d] to-[#0f0e26] border-b border-[#FF007F]/30 relative overflow-hidden">
          <div className="inline-block bg-[#FFE600]/20 border border-[#FFE600] text-[#FFE600] px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(255,230,0,0.4)]">
            ★ TOURNAMENT CHAMPIONS ★
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_20px_rgba(255,0,127,0.8)]">
            VICTORY PODIUM
          </h1>
          <p className="text-xs md:text-sm font-bold text-[#00F0FF] mt-1 tracking-wider uppercase">
            Cumulative scores across {gameState.total_rounds || 1} tournament rounds
          </p>
        </div>

        {/* Podium Display */}
        <div className="p-6 md:p-8 flex items-end justify-center gap-3 md:gap-6 min-h-[220px]">
          
          {/* 2nd Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">🥈</span>
              <div className="font-black text-sm text-gray-200 truncate max-w-[120px] mb-1">{second.team}</div>
              <div className="text-lg font-black text-[#00F0FF] mb-2">{second.score} pts</div>
              <div className="w-full bg-[#1b1942] border-t-2 border-gray-400 rounded-t-xl h-24 flex items-center justify-center shadow-inner">
                <span className="text-2xl font-black text-gray-400">2</span>
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          <div className="flex-1 flex flex-col items-center -translate-y-4">
            <span className="text-4xl mb-1 animate-bounce">👑</span>
            <div className="font-black text-base text-[#FFE600] truncate max-w-[140px] mb-1 drop-shadow-[0_0_8px_rgba(255,230,0,0.6)]">
              {champion.team}
            </div>
            <div className="text-2xl font-black text-[#FFE600] mb-2 drop-shadow-[0_0_10px_rgba(255,230,0,0.8)]">
              {champion.score} pts
            </div>
            <div className="w-full bg-gradient-to-t from-[#FFE600]/20 to-[#FFE600]/40 border-t-4 border-[#FFE600] rounded-t-xl h-36 flex items-center justify-center shadow-[0_0_25px_rgba(255,230,0,0.3)]">
              <span className="text-4xl font-black text-[#FFE600]">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <span className="text-2xl mb-1">🥉</span>
              <div className="font-black text-sm text-gray-200 truncate max-w-[120px] mb-1">{third.team}</div>
              <div className="text-lg font-black text-[#00F0FF] mb-2">{third.score} pts</div>
              <div className="w-full bg-[#17153b] border-t-2 border-amber-600 rounded-t-xl h-16 flex items-center justify-center shadow-inner">
                <span className="text-xl font-black text-amber-500">3</span>
              </div>
            </div>
          )}

        </div>

        {/* Full Leaderboard Table (if > 3 teams) */}
        {standings.length > 3 && (
          <div className="px-8 pb-4">
            <div className="bg-[#17153b]/60 border border-gray-800 rounded-xl p-3 max-h-32 overflow-y-auto space-y-1.5 text-xs">
              {standings.slice(3).map((st, i) => (
                <div key={i} className="flex items-center justify-between text-gray-300 px-2 py-1">
                  <span>#{i + 4} {st.team}</span>
                  <span className="font-bold text-[#00F0FF]">{st.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-6 bg-[#12102e] border-t border-[#252254] flex justify-center gap-4">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); onReturnMenu(); }}
            className="px-6 py-3 rounded-xl border border-gray-700 hover:bg-white/10 text-gray-200 font-bold text-sm uppercase tracking-wider transition"
          >
            MAIN MENU
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playFanfare(); onRematch(); }}
            className="bg-gradient-to-r from-[#00F0FF] to-[#FFE600] hover:brightness-110 text-black font-black px-8 py-3 rounded-xl transition shadow-[0_0_25px_rgba(0,240,255,0.4)] tracking-wider uppercase text-sm"
          >
            ⚡ REMATCH
          </button>
        </div>

      </div>
    </div>
  );
}
