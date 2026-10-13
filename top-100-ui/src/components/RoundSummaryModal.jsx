import { soundFx } from '../soundFx';

export default function RoundSummaryModal({
  gameState,
  onNextRound,
  onViewPodium,
  onInspectBoard,
  onReturnMenu
}) {
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
  const top10Status = [];
  for (let i = 0; i < Math.min(10, answers.length); i++) {
    top10Status.push({
      rank: i + 1,
      name: answers[i],
      revealed: revealedIndices.includes(i),
      team: gameState.revealed_by[i.toString()] || null
    });
  }

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0e26] border-2 border-[#FFE600] rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(255,230,0,0.35)] flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#17153b] via-[#241a4a] to-[#17153b] border-b border-[#FFE600]/30 p-6 text-center">
          <div className="text-xs font-black text-[#FFE600] uppercase tracking-widest mb-1">
            {isMulti ? `ROUND ${currentMatchRound} OF ${totalRounds} COMPLETE` : 'ROUND COMPLETE'}
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-[0_0_15px_rgba(255,230,0,0.7)]">
            🏆 {teams[winnerIndex]} WINS THE ROUND!
          </h2>
          <div className="text-sm font-bold text-[#00F0FF] mt-1">
            Category: {gameState.current_round_title}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-gray-200">

          {/* Cumulative Leaderboard */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black tracking-widest uppercase text-[#00F0FF]">
                {isMulti ? '📊 TOURNAMENT LEADERBOARD (CUMULATIVE)' : '📊 ROUND FINAL SCORES'}
              </span>
              {isMulti && (
                <span className="text-[11px] font-bold text-[#FF007F] bg-[#FF007F]/10 px-2.5 py-0.5 rounded-full border border-[#FF007F]/30">
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
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      isWinner
                        ? 'bg-[#FFE600]/15 border-[#FFE600] shadow-[0_0_12px_rgba(255,230,0,0.3)]'
                        : 'bg-[#17153b] border-gray-800'
                    }`}
                  >
                    <div>
                      <div className="font-black text-sm text-white flex items-center gap-1.5">
                        {isWinner && <span>⭐</span>}
                        <span>{team}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Round Points: <strong className="text-gray-200">+{roundScores[idx] || 0}</strong>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-black text-[#00F0FF]">
                        {isMulti ? matchScores[idx] || 0 : roundScores[idx] || 0}
                      </div>
                      <div className="text-[10px] font-mono text-gray-400 uppercase">
                        {isMulti ? 'Total Pts' : 'Points'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top 10 Answer Highlights */}
          <div className="p-4 rounded-2xl bg-[#17153b]/80 border border-gray-800">
            <h3 className="text-xs font-black tracking-widest uppercase text-[#FFE600] mb-3">
              🔍 TOP 10 ITEMS BREAKDOWN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {top10Status.map((item) => (
                <div
                  key={item.rank}
                  className={`p-2 rounded-lg border flex items-center justify-between gap-2 ${
                    item.revealed
                      ? 'bg-green-500/10 border-green-500/30 text-green-300'
                      : 'bg-red-500/10 border-red-500/30 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-mono font-bold shrink-0">#{item.rank}</span>
                    <span className="font-bold truncate" title={item.name}>{item.name}</span>
                  </div>
                  <span className="font-mono text-[10px] uppercase shrink-0 font-bold">
                    {item.revealed ? item.team || 'FOUND' : 'MISSED'}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="p-5 bg-[#12102e] border-t border-[#252254] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); onInspectBoard(); }}
            className="px-4 py-2.5 rounded-xl border border-gray-700 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition"
          >
            👀 INSPECT BOARD
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => { soundFx.playClick(); onReturnMenu(); }}
              className="px-4 py-2.5 rounded-xl border border-gray-700 hover:bg-white/10 text-gray-300 font-bold text-xs uppercase tracking-wider transition"
            >
              MAIN MENU
            </button>

            {isFinalRound ? (
              <button
                type="button"
                onClick={() => { soundFx.playFanfare(); onViewPodium(); }}
                className="bg-gradient-to-r from-[#FFE600] to-[#FF007F] hover:brightness-110 text-black font-black px-6 py-2.5 rounded-xl transition shadow-[0_0_20px_rgba(255,230,0,0.5)] tracking-wider uppercase text-sm"
              >
                🏆 MATCH PODIUM
              </button>
            ) : isMulti ? (
              <button
                type="button"
                onClick={() => { soundFx.playCorrect(); onNextRound(); }}
                className="bg-[#00F0FF] hover:bg-[#00d0df] text-black font-black px-6 py-2.5 rounded-xl transition shadow-[0_0_20px_rgba(0,240,255,0.4)] tracking-wider uppercase text-sm"
              >
                ROUND {currentMatchRound + 1} ➔
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { soundFx.playCorrect(); onNextRound(); }}
                className="bg-[#00F0FF] hover:bg-[#00d0df] text-black font-black px-6 py-2.5 rounded-xl transition shadow-[0_0_20px_rgba(0,240,255,0.4)] tracking-wider uppercase text-sm"
              >
                NEXT CATEGORY ➔
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
