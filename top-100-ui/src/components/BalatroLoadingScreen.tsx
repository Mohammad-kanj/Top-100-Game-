import React from 'react';

interface BalatroLoadingScreenProps {
  message?: string;
  roundNumber?: number;
  totalRounds?: number;
}

export default function BalatroLoadingScreen({
  message = 'DEALING 100 TILES...',
  roundNumber,
  totalRounds
}: BalatroLoadingScreenProps): React.JSX.Element {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0f23] flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-200">
      
      {/* Deep Balatro CRT Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(10,15,35,0.4)_0%,rgba(13,13,13,0.95)_75%,#05070f_100%)]" />

      {/* Floating 3D Arcade "TOP 100" Symbol */}
      <div className="relative z-10 flex flex-col items-center balatro-loading-wobble">
        <div className="arcade-skew-title flex flex-col items-start scale-110 sm:scale-125 md:scale-140 filter drop-shadow-[0_15px_30px_rgba(239,83,104,0.4)]">
          <span className="arcade-neon-top text-4xl sm:text-5xl md:text-6xl pl-1">
            TOP
          </span>
          <span className="arcade-neon-100 text-8xl sm:text-9xl md:text-[11rem] -mt-2 sm:-mt-3">
            100
          </span>
        </div>

        {/* Orbiting Arcade Sparks */}
        <div className="absolute -inset-6 rounded-full border border-[#ef5368]/25 animate-spin" style={{ animationDuration: '6s' }} />
        <div className="absolute -inset-12 rounded-full border border-[#891c1c]/25 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
      </div>

      {/* Balatro Arcade Loading Capsule */}
      <div className="relative z-10 mt-12 flex flex-col items-center gap-3">
        <div className="balatro-panel px-6 py-2.5 rounded-2xl flex items-center gap-3 border-2 border-[#891c1c] shadow-[0_4px_0_#0d0d0d,0_0_20px_rgba(239,83,104,0.25)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ef5368] animate-ping" />
          <span className="font-black text-xs sm:text-sm uppercase tracking-widest text-[#fffbd4] drop-shadow-[0_1px_2px_#0d0d0d]">
            {roundNumber && totalRounds ? `DEALING ROUND ${roundNumber} OF ${totalRounds}...` : message}
          </span>
        </div>

        {/* Arcade Loading Bar */}
        <div className="w-48 sm:w-60 h-2 bg-[#0d0d0d] rounded-full overflow-hidden border border-[#891c1c] p-0.5">
          <div className="h-full bg-gradient-to-r from-[#891c1c] via-[#ef5368] to-[#fffbd4] rounded-full balatro-loading-bar" />
        </div>
      </div>

    </div>
  );
}
