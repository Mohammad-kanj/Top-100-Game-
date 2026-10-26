import React from 'react';
import { soundFx } from '../soundFx';
import { GameState } from '../types';

interface RoundSummaryModalProps {
  gameState: GameState;
  onNextRound: () => void;
  onViewPodium: () => void;
  onInspectBoard: () => void;
  onReturnMenu: () => void;
}

interface Top10Item {
  rank: number;
  name: string;
  revealed: boolean;
  team: string | null;
}

export default function RoundSummaryModal({
  gameState,
  onNextRound,
  onViewPodium,
  onInspectBoard,
  onReturnMenu
}: RoundSummaryModalProps): React.JSX.Element {
  const teams = gameState.teams || [];
  const roundScores = gameState.scores || [];
  const matchScores = gameState.match_scores || [];
  const totalRounds = gameState.total_rounds || 1;
  const currentMatchRound = gameState.current_match_round || 1;
  const isMulti = gameState.match_mode === 'multi';
  const isFinalRound = isMulti && currentMatchRound >= totalRounds;

  // Find round winner
  let maxScore = -1;
  let winnerIndex = 0;
  roundScores.forEach((s, idx) => {
    if (s > maxScore) {
      maxScore = s;
      winnerIndex = idx;
    }
  });

  const answers = gameState.current_round_answers || [];
  const revealedIndices = gameState.revealed_indices || [];

  // Top 10 answers status
  const top10Status: Top10Item[] = [];
  for (let i = 0; i < Math.min(10, answers.length); i++) {
    const by = gameState.revealed_by[i.toString()];
    const wasGuessedByTeam = Boolean(by && by !== 'MISSED' && by !== 'UNANSWERED' && by !== 'REVEALED');
    top10Status.push({
      rank: i + 1,
      name: answers[i],
      revealed: wasGuessedByTeam,
      team: wasGuessedByTeam ? by : null
    });
  }

  const isBossRush = gameState.match_mode === 'boss_rush';
  const displayWinner = gameState.winner || (teams[winnerIndex] ? `${teams[winnerIndex]} Wins` : 'Round Complete');

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="balatro-modal rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#003c5a] border-b-2 border-[#0071b4] p-6 text-center">
          <div className="text-xs font-black text-[#9cf6ff] uppercase tracking-widest mb-1">
            {isBossRush
              ? 'Boss Rush Run Complete'
              : isMulti
              ? `Round ${currentMatchRound} of ${totalRounds} Complete`
              : 'Game Complete'}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-[0_2px_0_#0c1079]">
            {isBossRush ? `Solo Run: ${roundScores[0] || 0} Pts` : displayWinner}
          </h2>
          <div className="text-xs font-bold text-[#6ad6cd] mt-1">
            Category: {gameState.current_round_title}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#9cf6ff]">

          {/* Cumulative Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black tracking-wider uppercase text-[#9cf6ff]">
                {isMulti ? 'Tournament Leaderboard (Cumulative)' : 'Round Final Scores'}
              </span>
              {isMulti && (
                <span className="text-[11px] font-black text-[#003c5a] bg-[#62f6bd] px-2.5 py-0.5 rounded-lg border-2 border-[#087d6a] border-b-4 shadow-[0_2px_0_#0c1079]">
                  Points Accumulate Across Rounds
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {teams.map((team, idx) => {
                const isWinner = idx === winnerIndex;
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 border-b-4 flex items-center justify-between ${
                      isWinner
                        ? 'bg-[#3120cd] border-[#62f6bd] border-b-[#0c1079] shadow-[0_4px_0_#0c1079,inset_0_1.5px_0_rgba(98,246,189,0.3)]'
                        : 'balatro-card'
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-white">
                        {team}
                      </div>
                      <div className="text-xs text-[#6ad6cd] font-semibold">
                        Round Points: <strong className="text-white">+{roundScores[idx] || 0}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-black drop-shadow-[0_1px_0_#0c1079] ${isWinner ? 'text-[#62f6bd]' : 'text-[#9cf6ff]'}`}>
                        {isMulti ? matchScores[idx] || 0 : roundScores[idx] || 0}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[#00b6de] uppercase">
                        {isMulti ? 'Total' : 'Points'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 10 Answer Highlights */}
          <div className="p-4 rounded-2xl balatro-card">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#9cf6ff] mb-3 drop-shadow-[0_1px_0_#0c1079]">
              Top 10 Items Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-black">
              {top10Status.map((item) => (
                <div
                  key={item.rank}
                  className={`p-2.5 rounded-xl border-2 border-b-3 flex items-center justify-between gap-2 ${
                    item.revealed
                      ? 'bg-[#003c5a] border-[#62f6bd] border-b-[#0c1079] text-[#62f6bd] shadow-[0_2px_0_#0c1079]'
                      : 'bg-[#4a089c] border-[#787bd1]/50 border-b-[#0c1079] text-slate-300 shadow-[0_2px_0_#0c1079]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-black shrink-0 text-[#00b6de]">#{item.rank}</span>
                    <span className="truncate" title={item.name}>{item.name}</span>
                  </div>
                  <span className={`font-mono text-[10px] uppercase shrink-0 font-bold ${item.revealed ? 'text-[#62f6bd]' : 'text-[#787bd1]'}`}>
                    {item.revealed ? item.team || 'Found' : 'Missed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#003c5a] border-t-2 border-[#0071b4] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); onInspectBoard(); }}
            className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#9cf6ff]"
          >
            Inspect Board
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { soundFx.playClick(); onReturnMenu(); }}
              className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#9cf6ff]"
            >
              Main Menu
            </button>

            {isFinalRound ? (
              <button
                type="button"
                onClick={() => { soundFx.playFanfare(); onViewPodium(); }}
                className="balatro-btn-primary font-black px-6 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-[#003c5a]"
              >
                Match Podium
              </button>
            ) : isMulti && currentMatchRound < totalRounds ? (
              <button
                type="button"
                onClick={() => { soundFx.playCorrect(); onNextRound(); }}
                className="balatro-btn-blue font-black px-6 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer text-white"
              >
                Round {currentMatchRound + 1}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { soundFx.playCorrect(); onNextRound(); }}
                className="balatro-btn-primary font-black px-6 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-[#003c5a]"
              >
                Play Again
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
