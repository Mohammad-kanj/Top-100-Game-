import React from 'react';

interface BalatroLoadingScreenProps {
  message?: string;
  roundNumber?: number;
  totalRounds?: number;
  colorTheme?: 'red' | 'blue';
}

export default function BalatroLoadingScreen({
  message = 'DEALING 100 TILES...',
  roundNumber,
  totalRounds,
  colorTheme = 'red'
}: BalatroLoadingScreenProps): React.JSX.Element {
  const isBlue = colorTheme === 'blue';

  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0f23] flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-200">
      
      {/* Deep Balatro CRT Vignette Overlay */}
      <div className={`absolute inset-0 pointer-events-none ${
        isBlue
          ? 'bg-[radial-gradient(ellipse_at_center,rgba(14,20,34,0.4)_0%,rgba(13,13,13,0.95)_75%,#05070f_100%)]'
          : 'bg-[radial-gradient(ellipse_at_center,rgba(10,15,35,0.4)_0%,rgba(13,13,13,0.95)_75%,#05070f_100%)]'
      }`} />

      {/* Floating 3D Arcade "TOP 100" Symbol */}
      <div className="relative z-10 flex flex-col items-center balatro-loading-wobble">
        <div className={`arcade-skew-title flex flex-col items-start scale-110 sm:scale-125 md:scale-140 filter ${
          isBlue
            ? 'drop-shadow-[0_15px_30px_rgba(56,189,248,0.45)] balatro-loading-title-shadow'
            : 'drop-shadow-[0_15px_30px_rgba(239,83,104,0.4)]'
        }`}>
          <span className="arcade-neon-top text-4xl sm:text-5xl md:text-6xl pl-1">
            TOP
          </span>
          <span className="arcade-neon-100 text-8xl sm:text-9xl md:text-[11rem] -mt-2 sm:-mt-3">
            100
          </span>
        </div>

        {/* Orbiting Arcade Sparks */}
        <div
          className={`absolute -inset-6 rounded-full border animate-spin ${
            isBlue ? 'border-[#38bdf8]/30' : 'border-[#ef5368]/25'
          }`}
          style={{ animationDuration: '6s' }}
        />
        <div
          className={`absolute -inset-12 rounded-full border animate-spin ${
            isBlue ? 'border-[#1e40af]/30' : 'border-[#891c1c]/25'
          }`}
          style={{ animationDuration: '10s', animationDirection: 'reverse' }}
        />
      </div>

      {/* Balatro Arcade Loading Capsule */}
      <div className="relative z-10 mt-12 flex flex-col items-center gap-3">
        <div className={`balatro-panel px-6 py-2.5 rounded-2xl flex items-center gap-3 border-2 ${
          isBlue
            ? 'border-[#1e40af] shadow-[0_4px_0_#0d0d0d,0_0_20px_rgba(56,189,248,0.3)]'
            : 'border-[#891c1c] shadow-[0_4px_0_#0d0d0d,0_0_20px_rgba(239,83,104,0.25)]'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full animate-ping ${
            isBlue ? 'bg-[#38bdf8]' : 'bg-[#ef5368]'
          }`} />
          <span className="font-black text-xs sm:text-sm uppercase tracking-widest text-[#fffbd4] drop-shadow-[0_1px_2px_#0d0d0d]">
            {roundNumber && totalRounds ? `DEALING ROUND ${roundNumber} OF ${totalRounds}...` : message}
          </span>
        </div>

        {/* Arcade Loading Bar */}
        <div className={`w-48 sm:w-60 h-2 bg-[#0d0d0d] rounded-full overflow-hidden border p-0.5 ${
          isBlue ? 'border-[#1e40af]' : 'border-[#891c1c]'
        }`}>
          <div className={`h-full rounded-full balatro-loading-bar ${
            isBlue
              ? 'bg-gradient-to-r from-[#1e40af] via-[#38bdf8] to-[#fffbd4]'
              : 'bg-gradient-to-r from-[#891c1c] via-[#ef5368] to-[#fffbd4]'
          }`} />
        </div>
      </div>

    </div>
  );
}
