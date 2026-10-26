import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../soundFx';
import { GameState } from '../types';

interface PostGameCelebrationModalProps {
  gameState: GameState;
  onInspectBoard: () => void;
  onNextRound: () => void;
  onReturnMenu: () => void;
}

interface CorrectGuess {
  rank: number;
  name: string;
  points: number;
}

interface TeamStanding {
  team: string;
  originalIndex: number;
  score: number;
  roundScore: number;
  guesses: CorrectGuess[];
}

export default function PostGameCelebrationModal({
  gameState,
  onInspectBoard,
  onNextRound,
  onReturnMenu
}: PostGameCelebrationModalProps): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const teams = gameState.teams || [];
  const roundScores = gameState.scores || [];
  const matchScores = gameState.match_scores || [];
  const isMulti = gameState.match_mode === 'multi';
  const isBossRush = gameState.match_mode === 'boss_rush';
  const totalRounds = gameState.total_rounds || 1;
  const currentMatchRound = gameState.current_match_round || 1;
  const isFinalRound = isMulti && currentMatchRound >= totalRounds;
  const answers = gameState.current_round_answers || [];

  // Build standings data with all correct guesses
  const standings: TeamStanding[] = teams.map((team, idx) => {
    const score = isMulti ? matchScores[idx] || 0 : roundScores[idx] || 0;
    const roundScore = roundScores[idx] || 0;

    // Extract all answers found by this team
    const guesses: CorrectGuess[] = [];
    Object.entries(gameState.revealed_by || {}).forEach(([idxStr, byTeam]) => {
      if (byTeam === team) {
        const answerIdx = parseInt(idxStr, 10);
        if (!isNaN(answerIdx) && answerIdx >= 0 && answerIdx < answers.length) {
          const rank = answerIdx + 1;
          guesses.push({
            rank,
            name: answers[answerIdx],
            points: rank // Deep cut points = rank
          });
        }
      }
    });

    // Sort guesses by rank ascending
    guesses.sort((a, b) => a.rank - b.rank);

    return {
      team,
      originalIndex: idx,
      score,
      roundScore,
      guesses
    };
  });

  // Sort standings by score descending (if winner is explicitly set, prioritize winner as #1)
  standings.sort((a, b) => {
    if (gameState.winner) {
      if (a.team === gameState.winner) return -1;
      if (b.team === gameState.winner) return 1;
    }
    return b.score - a.score;
  });

  const totalTeams = standings.length;
  const currentStanding = standings[selectedIdx] || standings[0] || {
    team: 'Team',
    originalIndex: 0,
    score: 0,
    roundScore: 0,
    guesses: []
  };

  const currentPlace = selectedIdx + 1;

  // Handle arrow navigation
  const handlePrev = () => {
    soundFx.playClick();
    setSelectedIdx((prev) => (prev > 0 ? prev - 1 : totalTeams - 1));
  };

  const handleNext = () => {
    soundFx.playClick();
    setSelectedIdx((prev) => (prev < totalTeams - 1 ? prev + 1 : 0));
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalTeams]);

  // Auto-scrolling wheel animation for correct guesses (only when > 2 answers)
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isPaused || currentStanding.guesses.length <= 2) return;

    let animId: number;
    const speed = 2.5; // pixels per frame (2.6x faster auto-scroll)

    const step = () => {
      if (!container) return;
      container.scrollLeft += speed;

      // When reaching near end, loop back smoothly
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 8) {
        container.scrollLeft = 0;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPaused, selectedIdx, currentStanding.guesses.length]);

  // Theme styling based on standing place (1st Mint, 2nd Cyan, 3rd Royal Violet, 4th+ Cobalt)
  const getTheme = (place: number) => {
    if (place === 1) {
      return {
        badgeText: isBossRush ? 'SOLO CHALLENGER' : '1ST PLACE - WINNER',
        badgeClass: 'bg-[#62f6bd] text-[#003c5a] font-black shadow-[0_2px_8px_rgba(98,246,189,0.5)]',
        borderClass: 'border-[#62f6bd] shadow-[0_0_40px_rgba(98,246,189,0.5)]',
        nameColor: 'text-[#62f6bd] drop-shadow-[0_4px_0_#0c1079]',
        scoreColor: 'text-[#9cf6ff] drop-shadow-[0_4px_0_#0c1079]',
        cardBg: 'bg-[#003c5a] border-[#62f6bd] shadow-[0_4px_0_#0c1079]',
        tileRankBg: 'bg-[#62f6bd] text-[#003c5a]',
        tileAccent: 'border-[#62f6bd]/80 text-[#62f6bd]'
      };
    }
    if (place === 2) {
      return {
        badgeText: '2ND PLACE - RUNNER UP',
        badgeClass: 'bg-[#00b6de] text-white font-black shadow-[0_2px_8px_rgba(0,182,222,0.5)]',
        borderClass: 'border-[#00b6de] shadow-[0_0_30px_rgba(0,182,222,0.4)]',
        nameColor: 'text-white drop-shadow-[0_4px_0_#0c1079]',
        scoreColor: 'text-[#00b6de] drop-shadow-[0_4px_0_#0c1079]',
        cardBg: 'bg-[#003c5a] border-[#00b6de] shadow-[0_4px_0_#0c1079]',
        tileRankBg: 'bg-[#00b6de] text-white',
        tileAccent: 'border-[#00b6de]/80 text-white'
      };
    }
    if (place === 3) {
      return {
        badgeText: '3RD PLACE',
        badgeClass: 'bg-[#4a34de] text-[#9cf6ff] border border-[#787bd1]',
        borderClass: 'border-[#787bd1] shadow-[0_0_25px_rgba(120,123,209,0.3)]',
        nameColor: 'text-[#9cf6ff] drop-shadow-[0_4px_0_#0c1079]',
        scoreColor: 'text-[#62f6bd] drop-shadow-[0_4px_0_#0c1079]',
        cardBg: 'bg-[#3120cd] border-[#787bd1]/80 shadow-[0_4px_0_#0c1079]',
        tileRankBg: 'bg-[#4a34de] text-[#9cf6ff]',
        tileAccent: 'border-[#787bd1]/80 text-[#9cf6ff]'
      };
    }
    return {
      badgeText: `${place}TH PLACE`,
      badgeClass: 'bg-[#3120cd] text-[#6ad6cd] border border-[#0071b4]',
      borderClass: 'border-[#0071b4]/90 shadow-[0_0_20px_rgba(0,113,180,0.2)]',
      nameColor: 'text-white drop-shadow-[0_4px_0_#0c1079]',
      scoreColor: 'text-[#9cf6ff] drop-shadow-[0_4px_0_#0c1079]',
      cardBg: 'bg-[#003c5a] border-[#0071b4]/60 shadow-[0_4px_0_#0c1079]',
      tileRankBg: 'bg-[#0071b4] text-white',
      tileAccent: 'border-[#0071b4]/80 text-[#6ad6cd]'
    };
  };

  const theme = getTheme(currentPlace);

  // Prepare display guesses (duplicate array if small to allow seamless auto-scrolling loop, but not when <= 2)
  const isScrollable = currentStanding.guesses.length > 2;
  const displayGuesses =
    isScrollable && currentStanding.guesses.length < 8
      ? [...currentStanding.guesses, ...currentStanding.guesses, ...currentStanding.guesses]
      : currentStanding.guesses;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-3 md:p-6 animate-in zoom-in-95 duration-300">
      <div
        className={`balatro-modal rounded-3xl w-full max-w-3xl overflow-hidden flex flex-col border-3 transition-all duration-300 ${theme.borderClass}`}
      >
        {/* Celebration Header */}
        <div className="bg-[#003c5a] p-5 md:p-6 text-center border-b-2 border-[#0071b4] relative">
          
          {/* Top Banner Tag */}
          <div className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 shadow-sm border border-white/20">
            <span className={theme.nameColor}>
              {isBossRush
                ? 'Boss Rush Challenge Complete'
                : gameState.surrendered
                ? 'Round Surrendered'
                : isMulti
                ? `Tournament Round ${currentMatchRound} of ${totalRounds}`
                : 'Match Results'}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white tracking-wide uppercase drop-shadow-[0_3px_0_#0c1079]">
            {isBossRush ? 'Run Results' : 'Results'}
          </h1>

          <div className="text-xs font-bold text-[#9cf6ff]/80 mt-1">
            Category: <span className="text-white font-extrabold">{gameState.current_round_title}</span>
          </div>
        </div>

        {/* Carousel & Team Card Area with UI Arrows */}
        <div className="p-4 md:p-7 flex flex-col items-center relative">

          {/* Left / Right UI Navigation Arrows */}
          {totalTeams > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous Team"
                title="Previous Team (Left Arrow)"
                className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-[#3120cd] hover:bg-[#4a34de] border-2 border-[#787bd1] border-b-4 shadow-[0_4px_0_#0c1079] text-white flex items-center justify-center text-xl md:text-2xl font-black cursor-pointer transition active:translate-y-0.5 active:shadow-[0_1px_0_#0c1079]"
              >
                ◀
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Next Team"
                title="Next Team (Right Arrow)"
                className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 md:w-13 md:h-13 rounded-2xl bg-[#3120cd] hover:bg-[#4a34de] border-2 border-[#787bd1] border-b-4 shadow-[0_4px_0_#0c1079] text-white flex items-center justify-center text-xl md:text-2xl font-black cursor-pointer transition active:translate-y-0.5 active:shadow-[0_1px_0_#0c1079]"
              >
                ▶
              </button>
            </>
          )}

          {/* Main Showcase Panel for Current Standing */}
          <div className="w-full max-w-xl text-center px-8">
            
            {/* Standing Badge */}
            <div className="mb-2">
              <span
                className={`inline-block px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${theme.badgeClass}`}
              >
                {theme.badgeText}
              </span>
            </div>

            {/* Team Name in Place Color */}
            <h2
              className={`text-3xl md:text-5xl font-black uppercase tracking-tight mb-1 truncate px-2 ${theme.nameColor}`}
            >
              {currentStanding.team}
            </h2>

            {/* Score Underneath */}
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className={`text-4xl md:text-6xl font-black ${theme.scoreColor}`}>
                {currentStanding.score}
              </span>
              <span className="text-sm md:text-base font-black uppercase tracking-wider text-[#9cf6ff]">
                {isMulti ? 'Total Pts' : 'Points'}
              </span>
              {isMulti && (
                <span className="text-xs font-mono font-bold text-[#6ad6cd] ml-2">
                  (+{currentStanding.roundScore} this round)
                </span>
              )}
            </div>

            {/* Paging Indicators / Dots */}
            {totalTeams > 1 && (
              <div className="flex items-center justify-center gap-2 mb-5">
                {standings.map((st, i) => {
                  const dotTheme = getTheme(i + 1);
                  const isCurrent = i === selectedIdx;
                  return (
                    <button
                      key={st.team}
                      type="button"
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedIdx(i);
                      }}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        isCurrent
                          ? `w-8 ${dotTheme.badgeClass}`
                          : 'w-2.5 bg-white/20 hover:bg-white/40'
                      }`}
                      title={`Jump to ${st.team} (${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'})`}
                    />
                  );
                })}
              </div>
            )}

            {/* Scrolling Wheel Header */}
            <div className="flex items-center justify-between mb-2 px-1">
              <div className="text-xs font-black uppercase tracking-wider text-[#62f6bd] flex items-center gap-1.5">
                <span>{isScrollable ? 'Correct Guesses Wheel' : 'Correct Guesses'}</span>
                <span className="text-[10px] text-[#00b6de] font-normal">
                  ({currentStanding.guesses.length} {currentStanding.guesses.length === 1 ? 'answer' : 'answers'})
                </span>
              </div>
              {currentStanding.guesses.length > 0 && isScrollable && (
                <span className="text-[10px] font-mono font-bold text-[#00b6de]">
                  {isPaused ? 'Paused (Hovered)' : 'Auto-Scrolling'}
                </span>
              )}
            </div>

            {/* THE SCROLLING WHEEL CONTAINER */}
            <div
              className="relative w-full rounded-2xl bg-[#0c1079] border-2 border-[#0071b4] p-3 overflow-hidden shadow-[inset_0_3px_8px_rgba(12,16,121,0.7)]"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={() => setIsPaused(true)}
              onTouchEnd={() => setIsPaused(false)}
            >
              {currentStanding.guesses.length === 0 ? (
                <div className="py-7 text-center text-xs font-bold text-[#9cf6ff]/70 uppercase tracking-wide">
                  No correct answers found for this team this round.
                </div>
              ) : (
                <div
                  ref={scrollRef}
                  className={`flex items-center gap-3 py-1 ${
                    isScrollable 
                      ? 'overflow-x-auto no-scrollbar scroll-smooth' 
                      : 'justify-center overflow-x-hidden'
                  }`}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {displayGuesses.map((item, idx) => (
                    <div
                      key={`${item.rank}-${idx}`}
                      className={`shrink-0 w-44 md:w-48 p-3 rounded-xl border-2 border-b-4 flex flex-col justify-between transition transform hover:scale-105 select-none ${theme.cardBg}`}
                    >
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`font-mono text-[10px] font-black px-2 py-0.5 rounded-md ${theme.tileRankBg}`}
                        >
                          #{item.rank}
                        </span>
                        <span className="font-mono text-[11px] font-black text-[#62f6bd]">
                          +{item.points} pts
                        </span>
                      </div>
                      <div className="font-black text-xs md:text-sm text-white line-clamp-2 leading-tight text-left">
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isScrollable && (
              <div className="text-[10px] text-[#6ad6cd]/60 font-semibold mt-1 text-center">
                Tip: Hover over the scrolling wheel to pause and read answers
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-5 bg-[#003c5a] border-t-2 border-[#0071b4] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onInspectBoard();
            }}
            className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#9cf6ff]"
          >
            Inspect 100 Board Tiles
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onReturnMenu();
              }}
              className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#9cf6ff]"
            >
              Main Menu
            </button>

            {isMulti && currentMatchRound < totalRounds ? (
              <button
                type="button"
                onClick={() => {
                  soundFx.playCorrect();
                  onNextRound();
                }}
                className="balatro-btn-purple font-black px-6 py-2.5 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white"
              >
                Next Round ({currentMatchRound + 1})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFx.playVictorySound();
                  onNextRound();
                }}
                className="balatro-btn-primary font-black px-6 py-2.5 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-[#003c5a]"
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
