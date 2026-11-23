import React from 'react';
import { soundFx } from '../soundFx';
import { GameState } from '../types';

interface RoundSummaryModalProps {
  gameState: GameState;
  isHost?: boolean;
  onNextRound: () => void;
  onPlayAgain?: () => void;
  onViewPodium: () => void;
  onInspectBoard: () => void;
  onReturnMenu: () => void;
  onSelectCategories?: () => void;
}

interface Top10Item {
  rank: number;
  name: string;
  revealed: boolean;
  team: string | null;
}

export default function RoundSummaryModal({
  gameState,
  isHost = true,
  onNextRound,
  onPlayAgain,
  onViewPodium,
  onInspectBoard,
  onReturnMenu,
  onSelectCategories
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

  // In Boss Rush: tally contributions per player from revealed_by
  const playerContributions: { name: string; count: number; points: number }[] = [];
  if (isBossRush && gameState.revealed_by) {
    const tally: Record<string, { count: number; points: number }> = {};
    Object.entries(gameState.revealed_by).forEach(([idxStr, playerName]) => {
      if (playerName && playerName !== 'MISSED' && playerName !== 'UNANSWERED' && playerName !== 'REVEALED') {
        const idx = parseInt(idxStr, 10);
        const pts = !isNaN(idx) ? 100 - idx : 0;
        if (!tally[playerName]) {
          tally[playerName] = { count: 0, points: 0 };
        }
        tally[playerName].count += 1;
        tally[playerName].points += pts;
      }
    });
    Object.entries(tally).forEach(([name, data]) => {
      playerContributions.push({ name, count: data.count, points: data.points });
    });
    playerContributions.sort((a, b) => b.points - a.points);
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="balatro-modal rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-[#0d0d0d] border-b-2 border-[#891c1c] p-6 text-center">
          <div className="text-xs font-black text-[#ef5368] uppercase tracking-widest mb-1">
            {isBossRush
              ? 'Boss Rush Run Complete'
              : isMulti
              ? `Round ${currentMatchRound} of ${totalRounds} Complete`
              : 'Game Complete'}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-[#fffbd4] tracking-tight uppercase drop-shadow-[0_2px_0_#0d0d0d]">
            {isBossRush ? `${teams[0] || 'Co-op Squad'}: ${roundScores[0] || 0} Pts` : displayWinner}
          </h2>
          <div className="text-xs font-bold text-[#fffbd4]/80 mt-1">
            Category: {gameState.current_round_title}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#fffbd4]">

          {/* Cumulative Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-black tracking-wider uppercase text-[#fffbd4]">
                {isMulti ? 'Tournament Leaderboard (Cumulative)' : 'Round Final Scores'}
              </span>
              {isMulti && (
                <span className="text-[11px] font-black text-[#0d0d0d] bg-[#fffbd4] px-2.5 py-0.5 rounded-lg border-2 border-[#891c1c] border-b-4 shadow-[0_2px_0_#0d0d0d]">
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
                        ? 'bg-[#0d0d0d] border-[#fffbd4] border-b-[#891c1c] shadow-[0_4px_0_#0d0d0d,inset_0_1.5px_0_rgba(255,251,212,0.3)]'
                        : 'balatro-card'
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-[#fffbd4]">
                        {team}
                      </div>
                      <div className="text-xs text-[#fffbd4]/70 font-semibold">
                        Round Points: <strong className="text-[#fffbd4]">+{roundScores[idx] || 0}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className={`text-2xl font-black drop-shadow-[0_1px_0_#0d0d0d] ${isWinner ? 'text-[#fffbd4]' : 'text-[#fffbd4]/80'}`}>
                        {isMulti ? matchScores[idx] || 0 : roundScores[idx] || 0}
                      </div>
                      <div className="text-[10px] font-mono font-bold text-[#ef5368] uppercase">
                        {isMulti ? 'Total' : 'Points'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Boss Rush Squad Member Contributions */}
          {isBossRush && playerContributions.length > 0 && (
            <div className="p-4 rounded-2xl balatro-card">
              <h3 className="text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-3 drop-shadow-[0_1px_0_#0d0d0d] flex items-center justify-between">
                <span>Squad Player Contributions</span>
                <span className="text-[11px] text-[#ef5368] font-bold">
                  {playerContributions.reduce((sum, p) => sum + p.count, 0)} Answers Found
                </span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {playerContributions.map((p) => (
                  <div
                    key={p.name}
                    className="p-3 rounded-xl bg-[#0d0d0d] border-2 border-[#891c1c] flex items-center justify-between gap-2 shadow-[0_2px_0_#0d0d0d]"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-black text-xs text-[#fffbd4] truncate">{p.name}</div>
                      <div className="text-[10px] text-[#fffbd4]/60 font-semibold">{p.count} answers</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-[#fffbd4]">{p.points}</div>
                      <div className="text-[9px] font-mono font-bold text-[#ef5368] uppercase">PTS</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top 10 Answer Highlights */}
          <div className="p-4 rounded-2xl balatro-card">
            <h3 className="text-xs font-black tracking-wider uppercase text-[#fffbd4] mb-3 drop-shadow-[0_1px_0_#0d0d0d]">
              Top 10 Items Breakdown
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-black">
              {top10Status.map((item) => (
                <div
                  key={item.rank}
                  className={`p-2.5 rounded-xl border-2 border-b-3 flex items-center justify-between gap-2 ${
                    item.revealed
                      ? 'bg-[#0d0d0d] border-[#fffbd4] border-b-[#891c1c] text-[#fffbd4] shadow-[0_2px_0_#0d0d0d]'
                      : 'bg-[#0a0f23] border-[#891c1c]/50 border-b-[#0d0d0d] text-[#fffbd4]/50 shadow-[0_2px_0_#0d0d0d]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-black shrink-0 text-[#ef5368]">#{item.rank}</span>
                    <span className="truncate" title={item.name}>{item.name}</span>
                  </div>
                  <span className={`font-mono text-[10px] uppercase shrink-0 font-bold ${item.revealed ? 'text-[#fffbd4]' : 'text-[#891c1c]'}`}>
                    {item.revealed ? item.team || 'Found' : 'Missed'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-[#0d0d0d] border-t-2 border-[#891c1c] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { soundFx.playClick(); onInspectBoard(); }}
              className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
            >
              Inspect Board
            </button>
            {onSelectCategories && (
              <button
                type="button"
                onClick={() => { soundFx.playClick(); onSelectCategories(); }}
                className="balatro-btn-dark border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer shadow-sm"
              >
                Categories
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {!isHost && (
              <button
                type="button"
                onClick={() => { soundFx.playClick(); onReturnMenu(); }}
                className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
              >
                Main Menu
              </button>
            )}

            {isHost && (
              isFinalRound ? (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playCorrect();
                    if (onPlayAgain) {
                      onPlayAgain();
                    } else {
                      onNextRound();
                    }
                  }}
                  className="balatro-btn-purple font-black px-6 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white"
                >
                  Play Again
                </button>
              ) : isMulti && currentMatchRound < totalRounds ? (
                <button
                  type="button"
                  onClick={() => { soundFx.playCorrect(); onNextRound(); }}
                  className="balatro-btn-blue font-black px-6 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer text-white shadow-md"
                >
                  Round {currentMatchRound + 1}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playCorrect();
                    if (onPlayAgain) {
                      onPlayAgain();
                    } else {
                      onNextRound();
                    }
                  }}
                  className="balatro-btn-purple font-black px-6 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white"
                >
                  Play Again
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
