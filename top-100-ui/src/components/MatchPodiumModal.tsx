import React, { useEffect } from 'react';
import { soundFx } from '../soundFx';
import { GameState } from '../types';

interface MatchPodiumModalProps {
  gameState: GameState;
  onRematch: () => void;
  onReturnMenu: () => void;
}

interface StandingTeam {
  team: string;
  score: number;
  originalIdx: number;
}

export default function MatchPodiumModal({ gameState, onRematch, onReturnMenu }: MatchPodiumModalProps): React.JSX.Element {
  const teams = gameState.teams || [];
  const matchScores = gameState.match_scores || [];

  useEffect(() => {
    soundFx.playFanfare();
  }, []);

  // Sort teams by match score descending
  const standings: StandingTeam[] = teams.map((team, idx) => ({
    team,
    score: matchScores[idx] || 0,
    originalIdx: idx
  })).sort((a, b) => b.score - a.score);

  const champion = standings[0] || { team: 'None', score: 0, originalIdx: 0 };
  const second = standings[1] || null;
  const third = standings[2] || null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in zoom-in-95 duration-300">
      <div className="balatro-modal rounded-3xl w-full max-w-xl overflow-hidden flex flex-col text-center">
        
        {/* Banner */}
        <div className="p-7 bg-[#1a1442] border-b-2 border-[#2b2164]">
          <div className="text-xs font-black text-purple-300 uppercase tracking-widest mb-1">
            Tournament Champions
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_3px_0_#0d0924]">
            Victory Podium
          </h1>
          <p className="text-xs font-bold text-purple-200/80 mt-1">
            Cumulative scores across {gameState.total_rounds || 1} tournament rounds
          </p>
        </div>

        {/* Podium Display with Balatro Depth */}
        <div className="p-6 md:p-8 flex items-end justify-center gap-3.5 md:gap-5 min-h-[210px]">
          
          {/* 2nd Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black text-blue-300 uppercase mb-0.5">2nd Place</div>
              <div className="font-black text-sm text-white truncate max-w-[110px] mb-1">{second.team}</div>
              <div className="text-lg font-black text-blue-200 mb-2 drop-shadow-[0_1px_0_#08122a]">{second.score} pts</div>
              <div className="w-full bg-[#1b2b6b] border-2 border-[#2563eb] border-t-4 border-t-white rounded-t-2xl h-22 flex items-center justify-center shadow-[0_4px_0_#0a1438,inset_0_2px_0_rgba(255,255,255,0.25)]">
                <span className="text-2xl font-black text-white">2</span>
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          <div className="flex-1 flex flex-col items-center -translate-y-3">
            <div className="text-xs font-black text-white uppercase mb-0.5">Winner</div>
            <div className="font-black text-base text-white truncate max-w-[130px] mb-1 drop-shadow-[0_1px_0_#140a2c]">
              {champion.team}
            </div>
            <div className="text-2xl font-black text-white mb-2 drop-shadow-[0_2px_0_#140a2c]">
              {champion.score} pts
            </div>
            <div className="w-full bg-[#2a1d63] border-2 border-purple-400 border-t-4 border-t-white rounded-t-2xl h-32 flex items-center justify-center shadow-[0_6px_0_#0d0422,inset_0_2px_0_rgba(255,255,255,0.35)]">
              <span className="text-4xl font-black text-white">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black text-purple-400 uppercase mb-0.5">3rd Place</div>
              <div className="font-black text-sm text-white truncate max-w-[110px] mb-1">{third.team}</div>
              <div className="text-lg font-black text-purple-200 mb-2 drop-shadow-[0_1px_0_#140a2c]">{third.score} pts</div>
              <div className="w-full bg-[#1b1744] border-2 border-[#372877] border-t-4 border-t-purple-400 rounded-t-2xl h-16 flex items-center justify-center shadow-[0_4px_0_#0d0924,inset_0_2px_0_rgba(255,255,255,0.2)]">
                <span className="text-xl font-black text-purple-300">3</span>
              </div>
            </div>
          )}

        </div>

        {/* Full Leaderboard Table (if > 3 teams) */}
        {standings.length > 3 && (
          <div className="px-6 pb-4">
            <div className="balatro-card rounded-xl p-3 max-h-28 overflow-y-auto space-y-1 text-xs">
              {standings.slice(3).map((st, i) => (
                <div key={i} className="flex items-center justify-between text-purple-200 px-2 py-0.5 font-bold">
                  <span>#{i + 4} {st.team}</span>
                  <span className="font-black text-white">{st.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-[#1a1442] border-t-2 border-[#2b2164] flex justify-center gap-3">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); onReturnMenu(); }}
            className="balatro-btn-dark px-6 py-2.5 rounded-xl text-purple-200 font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            Main Menu
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playFanfare(); onRematch(); }}
            className="balatro-btn-white font-black px-8 py-2.5 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md"
          >
            Rematch
          </button>
        </div>

      </div>
    </div>
  );
}
