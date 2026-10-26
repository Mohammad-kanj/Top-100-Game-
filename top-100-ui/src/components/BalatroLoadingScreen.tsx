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
    <div className="fixed inset-0 z-[100] bg-[#0c1079] flex flex-col items-center justify-center select-none overflow-hidden animate-in fade-in duration-200">
      
      {/* Deep Balatro CRT Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,60,90,0.5)_0%,rgba(12,16,121,0.95)_75%,#4a089c_100%)]" />

      {/* Floating 3D Arcade "TOP 100" Symbol (In place of Balatro Joker Card) */}
      <div className="relative z-10 flex flex-col items-center balatro-loading-wobble">
        <div className="arcade-skew-title flex flex-col items-start scale-110 sm:scale-125 md:scale-140 filter drop-shadow-[0_15px_30px_rgba(98,246,189,0.4)]">
          <span className="arcade-neon-top text-4xl sm:text-5xl md:text-6xl pl-1">
            TOP
          </span>
          <span className="arcade-neon-100 text-8xl sm:text-9xl md:text-[11rem] -mt-2 sm:-mt-3">
            100
          </span>
        </div>

        {/* Orbiting Arcade Sparks */}
        <div className="absolute -inset-6 rounded-full border border-[#62f6bd]/25 animate-spin" style={{ animationDuration: '6s' }} />
        <div className="absolute -inset-12 rounded-full border border-[#787bd1]/25 animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }} />
      </div>

      {/* Balatro Arcade Loading Capsule */}
      <div className="relative z-10 mt-12 flex flex-col items-center gap-3">
        <div className="balatro-panel px-6 py-2.5 rounded-2xl flex items-center gap-3 border-2 border-[#0071b4] shadow-[0_4px_0_#0c1079,0_0_20px_rgba(98,246,189,0.25)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[#62f6bd] animate-ping" />
          <span className="font-black text-xs sm:text-sm uppercase tracking-widest text-[#9cf6ff] drop-shadow-[0_1px_2px_#0c1079]">
            {roundNumber && totalRounds ? `DEALING ROUND ${roundNumber} OF ${totalRounds}...` : message}
          </span>
        </div>

        {/* Arcade Loading Bar */}
        <div className="w-48 sm:w-60 h-2 bg-[#003c5a] rounded-full overflow-hidden border border-[#0071b4] p-0.5">
          <div className="h-full bg-gradient-to-r from-[#62f6bd] via-[#00b6de] to-[#107dee] rounded-full balatro-loading-bar" />
        </div>
      </div>

    </div>
  );
}
