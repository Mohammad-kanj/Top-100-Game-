import React, { useEffect } from 'react';
import { soundFx } from '../soundFx';
import { GameState } from '../types';

interface MatchPodiumModalProps {
  gameState: GameState;
  isHost?: boolean;
  onRematch: () => void;
  onReturnMenu: () => void;
}

interface StandingTeam {
  team: string;
  score: number;
  originalIdx: number;
}

export default function MatchPodiumModal({ gameState, isHost = true, onRematch, onReturnMenu }: MatchPodiumModalProps): React.JSX.Element {
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
        <div className="p-7 bg-[#0d0d0d] border-b-2 border-[#891c1c]">
          <div className="text-xs font-black text-[#ef5368] uppercase tracking-widest mb-1">
            Tournament Champions
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-[#fffbd4] tracking-tight uppercase drop-shadow-[0_3px_0_#0d0d0d]">
            Victory Podium
          </h1>
          <p className="text-xs font-bold text-[#fffbd4]/70 mt-1">
            Cumulative scores across {gameState.total_rounds || 1} tournament rounds
          </p>
        </div>

        {/* Podium Display with Balatro Depth */}
        <div className="p-6 md:p-8 flex items-end justify-center gap-3.5 md:gap-5 min-h-[210px]">
          
          {/* 2nd Place */}
          {second && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black text-[#ef5368] uppercase mb-0.5">2nd Place</div>
              <div className="font-black text-sm text-[#fffbd4] truncate max-w-[110px] mb-1">{second.team}</div>
              <div className="text-lg font-black text-[#ef5368] mb-2 drop-shadow-[0_1px_0_#0d0d0d]">{second.score} pts</div>
              <div className="w-full bg-[#ef5368] border-2 border-[#0d0d0d] border-t-4 border-t-[#fffbd4] rounded-t-2xl h-22 flex items-center justify-center shadow-[0_4px_0_#0d0d0d,inset_0_2px_0_rgba(255,255,255,0.25)]">
                <span className="text-2xl font-black text-[#fffbd4]">2</span>
              </div>
            </div>
          )}

          {/* 1st Place (Champion) */}
          <div className="flex-1 flex flex-col items-center -translate-y-3">
            <div className="text-xs font-black text-[#fffbd4] uppercase mb-0.5">Winner</div>
            <div className="font-black text-base text-[#fffbd4] truncate max-w-[130px] mb-1 drop-shadow-[0_1px_0_#0d0d0d]">
              {champion.team}
            </div>
            <div className="text-2xl font-black text-[#fffbd4] mb-2 drop-shadow-[0_2px_0_#0d0d0d]">
              {champion.score} pts
            </div>
            <div className="w-full bg-[#fffbd4] border-2 border-[#0d0d0d] border-t-4 border-t-white rounded-t-2xl h-32 flex items-center justify-center shadow-[0_6px_0_#0d0d0d,inset_0_2px_0_rgba(255,255,255,0.55)]">
              <span className="text-4xl font-black text-[#0d0d0d]">1</span>
            </div>
          </div>

          {/* 3rd Place */}
          {third && (
            <div className="flex-1 flex flex-col items-center">
              <div className="text-xs font-black text-[#891c1c] uppercase mb-0.5">3rd Place</div>
              <div className="font-black text-sm text-[#fffbd4] truncate max-w-[110px] mb-1">{third.team}</div>
              <div className="text-lg font-black text-[#fffbd4]/80 mb-2 drop-shadow-[0_1px_0_#0d0d0d]">{third.score} pts</div>
              <div className="w-full bg-[#891c1c] border-2 border-[#0d0d0d] border-t-4 border-t-[#ef5368] rounded-t-2xl h-16 flex items-center justify-center shadow-[0_4px_0_#0d0d0d,inset_0_2px_0_rgba(239,83,104,0.2)]">
                <span className="text-xl font-black text-[#fffbd4]">3</span>
              </div>
            </div>
          )}

        </div>

        {/* Full Leaderboard Table (if > 3 teams) */}
        {standings.length > 3 && (
          <div className="px-6 pb-4">
            <div className="balatro-card rounded-xl p-3 max-h-28 overflow-y-auto space-y-1 text-xs">
              {standings.slice(3).map((st, i) => (
                <div key={i} className="flex items-center justify-between text-[#fffbd4] px-2 py-0.5 font-bold">
                  <span>#{i + 4} {st.team}</span>
                  <span className="font-black text-[#fffbd4]">{st.score} pts</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="p-4 bg-[#0d0d0d] border-t-2 border-[#891c1c] flex justify-center gap-3">
          {!isHost && (
            <button
              type="button"
              onClick={() => { soundFx.playClick(); onReturnMenu(); }}
              className="balatro-btn-dark px-6 py-2.5 rounded-xl text-[#fffbd4] font-black text-xs uppercase tracking-wider cursor-pointer"
            >
              Main Menu
            </button>
          )}

          {isHost && (
            <button
              type="button"
              onClick={() => { soundFx.playFanfare(); onRematch(); }}
              className="balatro-btn-purple font-black px-8 py-2.5 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white"
            >
              Rematch
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
