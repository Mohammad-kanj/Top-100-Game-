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
        <div className="p-7 bg-[#003c5a] border-b-2 border-[#0071b4]">
          <div className="text-xs font-black text-[#9cf6ff] uppercase tracking-widest mb-1">
            Tournament Champions
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight uppercase drop-shadow-[0_3px_0_#0c1079]">
            Victory Podium
          </h1>
          <p className="text-xs font-bold text-[#6ad6cd]/80 mt-1">
            Cumulative scores across {gameState.total_rounds || 1} tournament rounds
          </p>
        </div>

        {/* Podium Display with Balatro Depth */}
        <div className="p-6 md:p-8 flex items-end justify-center gap-3.5 md:gap-5 min-h-[210px]">
          
          {/* 2nd Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black text-[#00b6de] uppercase mb-0.5">2nd Place</div>
              <div className="font-black text-sm text-white truncate max-w-[110px] mb-1">{second.team}</div>
              <div className="text-lg font-black text-[#9cf6ff] mb-2 drop-shadow-[0_1px_0_#0c1079]">{second.score} pts</div>
              <div className="w-full bg-[#00b6de] border-2 border-[#0c1079] border-t-4 border-t-white rounded-t-2xl h-22 flex items-center justify-center shadow-[0_4px_0_#0c1079,inset_0_2px_0_rgba(255,255,255,0.25)]">
                <span className="text-2xl font-black text-white">2</span>
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          <div className="flex-1 flex flex-col items-center -translate-y-3">
            <div className="text-xs font-black text-[#62f6bd] uppercase mb-0.5">Winner</div>
            <div className="font-black text-base text-white truncate max-w-[130px] mb-1 drop-shadow-[0_1px_0_#0c1079]">
              {champion.team}
            </div>
            <div className="text-2xl font-black text-[#62f6bd] mb-2 drop-shadow-[0_2px_0_#0c1079]">
              {champion.score} pts
            </div>
            <div className="w-full bg-[#62f6bd] border-2 border-[#087d6a] border-t-4 border-t-white rounded-t-2xl h-32 flex items-center justify-center shadow-[0_6px_0_#0c1079,inset_0_2px_0_rgba(255,255,255,0.55)]">
              <span className="text-4xl font-black text-[#003c5a]">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black text-[#787bd1] uppercase mb-0.5">3rd Place</div>
              <div className="font-black text-sm text-white truncate max-w-[110px] mb-1">{third.team}</div>
              <div className="text-lg font-black text-[#9cf6ff] mb-2 drop-shadow-[0_1px_0_#0c1079]">{third.score} pts</div>
              <div className="w-full bg-[#4a34de] border-2 border-[#3120cd] border-t-4 border-t-[#62f6bd] rounded-t-2xl h-16 flex items-center justify-center shadow-[0_4px_0_#0c1079,inset_0_2px_0_rgba(98,246,189,0.2)]">
                <span className="text-xl font-black text-[#9cf6ff]">3</span>
              </div>
            </div>
          )}

        </div>

        {/* Full Leaderboard Table (if > 3 teams) */}
        {standings.length > 3 && (
          <div className="px-6 pb-4">
            <div className="balatro-card rounded-xl p-3 max-h-28 overflow-y-auto space-y-1 text-xs">
              {standings.slice(3).map((st, i) => (
                <div key={i} className="flex items-center justify-between text-[#9cf6ff] px-2 py-0.5 font-bold">
                  <span>#{i + 4} {st.team}</span>
                  <span className="font-black text-white">{st.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-[#003c5a] border-t-2 border-[#0071b4] flex justify-center gap-3">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); onReturnMenu(); }}
            className="balatro-btn-dark px-6 py-2.5 rounded-xl text-[#9cf6ff] font-black text-xs uppercase tracking-wider cursor-pointer"
          >
            Main Menu
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playFanfare(); onRematch(); }}
            className="balatro-btn-primary font-black px-8 py-2.5 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-[#003c5a]"
          >
            Rematch
          </button>
        </div>

      </div>
    </div>
  );
}
