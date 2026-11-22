import React, { useState, useEffect, useRef } from 'react';
import { soundFx } from '../soundFx';
import { GameState } from '../types';

interface PostGameCelebrationModalProps {
  gameState: GameState;
  isHost?: boolean;
  onInspectBoard: () => void;
  onNextRound: () => void;
  onPlayAgain: () => void;
  onReturnMenu: () => void;
  onReturnToLobby?: () => void;
  onSelectCategories?: () => void;
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
  isHost = true,
  onInspectBoard,
  onNextRound,
  onPlayAgain,
  onReturnMenu,
  onReturnToLobby,
  onSelectCategories
}: PostGameCelebrationModalProps): React.JSX.Element {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const scrollStartXRef = useRef<number>(0);

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

  // Global release listener so drag finishes even if pointer exits container
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  // Auto-scrolling wheel animation for correct guesses (only when > 2 answers)
  useEffect(() => {
    const container = scrollRef.current;
    const isReduceMotion = typeof localStorage !== 'undefined' && localStorage.getItem('top100_reduce_motion') === 'true';
    if (!container || isDragging || isReduceMotion || currentStanding.guesses.length <= 2) return;

    let animId: number;
    const speed = 1.2; // pixels per frame (smooth leisurely pace)

    const step = () => {
      if (!container || isDraggingRef.current) return;
      container.scrollLeft += speed;

      // When reaching near end, loop back smoothly
      if (container.scrollLeft >= container.scrollWidth - container.clientWidth - 8) {
        container.scrollLeft = 0;
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isDragging, selectedIdx, currentStanding.guesses.length]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !scrollRef.current || !isScrollable) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX;
    scrollStartXRef.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const deltaX = e.pageX - dragStartXRef.current;
    scrollRef.current.scrollLeft = scrollStartXRef.current - deltaX;
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!scrollRef.current || !isScrollable || e.touches.length === 0) return;
    setIsDragging(true);
    isDraggingRef.current = true;
    dragStartXRef.current = e.touches[0].pageX;
    scrollStartXRef.current = scrollRef.current.scrollLeft;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !scrollRef.current || e.touches.length === 0) return;
    const deltaX = e.touches[0].pageX - dragStartXRef.current;
    scrollRef.current.scrollLeft = scrollStartXRef.current - deltaX;
  };

  const handleTouchEnd = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
    }
  };

  // Theme styling based on standing place (1st Lemon Chiffon, 2nd Coral Rose, 3rd Crimson, 4th+ Navy)
  const getTheme = (place: number) => {
    if (place === 1) {
      return {
        badgeText: isBossRush ? (gameState.winner === 'Co-op Squad' ? 'CO-OP SQUAD VICTORY' : 'SOLO CHALLENGER') : '1ST PLACE - WINNER',
        badgeClass: 'bg-[#fffbd4] text-[#0d0d0d] font-black shadow-[0_2px_8px_rgba(255,251,212,0.5)]',
        borderClass: 'border-[#fffbd4] shadow-[0_0_40px_rgba(255,251,212,0.3)]',
        nameColor: 'text-[#fffbd4] drop-shadow-[0_4px_0_#0d0d0d]',
        scoreColor: 'text-[#ef5368] drop-shadow-[0_4px_0_#0d0d0d]',
        cardBg: 'bg-[#0d0d0d] border-[#fffbd4] shadow-[0_4px_0_#891c1c]',
        tileRankBg: 'bg-[#fffbd4] text-[#0d0d0d]',
        tileAccent: 'border-[#fffbd4] text-[#fffbd4]'
      };
    }
    if (place === 2) {
      return {
        badgeText: '2ND PLACE - RUNNER UP',
        badgeClass: 'bg-[#ef5368] text-[#fffbd4] font-black shadow-[0_2px_8px_rgba(239,83,104,0.5)]',
        borderClass: 'border-[#ef5368] shadow-[0_0_30px_rgba(239,83,104,0.3)]',
        nameColor: 'text-[#fffbd4] drop-shadow-[0_4px_0_#0d0d0d]',
        scoreColor: 'text-[#ef5368] drop-shadow-[0_4px_0_#0d0d0d]',
        cardBg: 'bg-[#0d0d0d] border-[#ef5368] shadow-[0_4px_0_#891c1c]',
        tileRankBg: 'bg-[#ef5368] text-[#fffbd4]',
        tileAccent: 'border-[#ef5368] text-[#fffbd4]'
      };
    }
    if (place === 3) {
      return {
        badgeText: '3RD PLACE',
        badgeClass: 'bg-[#891c1c] text-[#fffbd4] border border-[#ef5368]/60',
        borderClass: 'border-[#891c1c] shadow-[0_0_25px_rgba(137,28,28,0.3)]',
        nameColor: 'text-[#fffbd4] drop-shadow-[0_4px_0_#0d0d0d]',
        scoreColor: 'text-[#fffbd4] drop-shadow-[0_4px_0_#0d0d0d]',
        cardBg: 'bg-[#0d0d0d] border-[#891c1c] shadow-[0_4px_0_#0a0f23]',
        tileRankBg: 'bg-[#891c1c] text-[#fffbd4]',
        tileAccent: 'border-[#891c1c] text-[#fffbd4]'
      };
    }
    return {
      badgeText: `${place}TH PLACE`,
      badgeClass: 'bg-[#0a0f23] text-[#fffbd4] border border-[#891c1c]',
      borderClass: 'border-[#891c1c]/90 shadow-[0_0_20px_rgba(137,28,28,0.2)]',
      nameColor: 'text-[#fffbd4] drop-shadow-[0_4px_0_#0d0d0d]',
      scoreColor: 'text-[#fffbd4]/80 drop-shadow-[0_4px_0_#0d0d0d]',
      cardBg: 'bg-[#0a0f23] border-[#891c1c] shadow-[0_4px_0_#0d0d0d]',
      tileRankBg: 'bg-[#0d0d0d] text-[#fffbd4]',
      tileAccent: 'border-[#891c1c] text-[#fffbd4]/70'
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
        <div className="bg-[#0d0d0d] p-5 md:p-6 text-center border-b-2 border-[#891c1c] relative">
          
          {/* Top Banner Tag */}
          <div className="inline-block px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest mb-2 shadow-sm border border-[#891c1c]/50 bg-[#0a0f23]">
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

          <h1 className="text-3xl md:text-5xl font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_3px_0_#0d0d0d]">
            {isBossRush ? 'Run Results' : 'Results'}
          </h1>

          <div className="text-xs font-bold text-[#fffbd4]/80 mt-1">
            Category: <span className="text-[#fffbd4] font-extrabold">{gameState.current_round_title}</span>
          </div>
        </div>

        {/* Carousel & Team Card Area with UI Arrows */}
        <div className="p-4 md:p-7 flex flex-col items-center relative">

          {/* Left / Right UI Navigation Arrows */}
          {totalTeams > 1 && (
            <>
              <div className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={handlePrev}
                  aria-label="Previous Team"
                  title="Previous Team (Left Arrow)"
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#0d0d0d] hover:bg-[#891c1c] border-2 border-[#891c1c] border-b-4 shadow-[0_4px_0_#0a0f23] text-[#fffbd4] flex items-center justify-center cursor-pointer transition active:scale-95 active:shadow-[0_2px_0_#0a0f23] select-none touch-manipulation"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-30 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleNext}
                  aria-label="Next Team"
                  title="Next Team (Right Arrow)"
                  className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-[#0d0d0d] hover:bg-[#891c1c] border-2 border-[#891c1c] border-b-4 shadow-[0_4px_0_#0a0f23] text-[#fffbd4] flex items-center justify-center cursor-pointer transition active:scale-95 active:shadow-[0_2px_0_#0a0f23] select-none touch-manipulation"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6 pointer-events-none"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
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
              <span className="text-sm md:text-base font-black uppercase tracking-wider text-[#fffbd4]">
                {isMulti ? 'Total Pts' : 'Points'}
              </span>
              {isMulti && (
                <span className="text-xs font-mono font-bold text-[#ef5368] ml-2">
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
              <div className="text-xs font-black uppercase tracking-wider text-[#ef5368] flex items-center gap-1.5">
                <span>{isScrollable ? 'Correct Guesses Wheel' : 'Correct Guesses'}</span>
                <span className="text-[10px] text-[#fffbd4]/60 font-normal">
                  ({currentStanding.guesses.length} {currentStanding.guesses.length === 1 ? 'answer' : 'answers'})
                </span>
              </div>
              {currentStanding.guesses.length > 0 && isScrollable && (
                <span className="text-[10px] font-mono font-bold text-[#ef5368]">
                  {isDragging ? 'Paused (Dragging)' : 'Auto-Scrolling'}
                </span>
              )}
            </div>

            {/* THE SCROLLING WHEEL CONTAINER */}
            <div
              className={`relative w-full rounded-2xl bg-[#0d0d0d] border-2 border-[#891c1c] p-3 overflow-hidden shadow-[inset_0_3px_8px_rgba(0,0,0,0.7)] select-none ${
                isScrollable ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {currentStanding.guesses.length === 0 ? (
                <div className="py-7 text-center text-xs font-bold text-[#fffbd4]/60 uppercase tracking-wide">
                  No correct answers found for this team this round.
                </div>
              ) : (
                <div
                  ref={scrollRef}
                  className={`flex items-center gap-3 py-1 ${
                    isScrollable 
                      ? 'overflow-x-auto no-scrollbar' 
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
                        <span className="font-mono text-[11px] font-black text-[#ef5368]">
                          +{item.points} pts
                        </span>
                      </div>
                      <div className="font-black text-xs md:text-sm text-[#fffbd4] line-clamp-2 leading-tight text-left">
                        {item.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isScrollable && (
              <div className="text-[10px] text-[#fffbd4]/60 font-semibold mt-1 text-center">
                Tip: Click and drag or swipe horizontally to browse answers
              </div>
            )}

          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3 md:p-4 bg-[#0d0d0d] border-t-2 border-[#891c1c] flex flex-nowrap items-center justify-center gap-2 md:gap-3 overflow-x-auto w-full">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onInspectBoard();
            }}
            className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4] whitespace-nowrap shrink-0"
          >
            Inspect Board
          </button>

          {onSelectCategories && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onSelectCategories();
              }}
              className="balatro-btn-dark border border-amber-500/50 hover:border-amber-400 text-amber-300 hover:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
            >
              Categories
            </button>
          )}

          {onReturnToLobby && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onReturnToLobby();
              }}
              className="balatro-btn-blue font-black px-5 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white whitespace-nowrap shrink-0"
            >
              Return to Lobby with Team
            </button>
          )}

          {!isHost && (
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onReturnMenu();
              }}
              className="balatro-btn-dark px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4] whitespace-nowrap shrink-0"
            >
              Main Menu
            </button>
          )}

          {isHost && (
            isMulti && currentMatchRound < totalRounds ? (
              <button
                type="button"
                onClick={() => {
                  soundFx.playCorrect();
                  onNextRound();
                }}
                className="balatro-btn-blue font-black px-5 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white whitespace-nowrap shrink-0"
              >
                Next Round ({currentMatchRound + 1})
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onPlayAgain();
                }}
                className="balatro-btn-purple font-black px-5 py-2 rounded-xl tracking-wider uppercase text-xs cursor-pointer shadow-md text-white whitespace-nowrap shrink-0"
              >
                Play Again
              </button>
            )
          )}
        </div>

      </div>
    </div>
  );
}
