import { useState } from 'react';
import { soundFx } from '../soundFx';

export default function MainMenu({ onPlay, onHowToPlay, onSettings, onTeams, onToggleFullscreen, isFullscreen }) {
  const [isMuted, setIsMuted] = useState(soundFx.isMuted());

  const handleAudioToggle = () => {
    const next = soundFx.toggleMuted();
    setIsMuted(next);
    if (!next) soundFx.playCorrect();
  };

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[90vh] p-4 text-center">
      
      {/* Top utility bar */}
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <button
          onClick={handleAudioToggle}
          className="bg-[#17153b]/80 hover:bg-[#252254] text-white border border-gray-700 p-2.5 rounded-xl transition text-base"
          title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
        <button
          onClick={onToggleFullscreen}
          className="bg-[#17153b]/80 hover:bg-[#252254] text-white border border-gray-700 p-2.5 rounded-xl transition text-base"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? '🗗' : '⛶'}
        </button>
      </div>

      {/* Cyber Arcade Title */}
      <div className="mb-10 max-w-2xl animate-in fade-in zoom-in duration-500">
        <div className="inline-block bg-[#FF007F]/20 border border-[#FF007F] text-[#FF007F] px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(255,0,127,0.3)]">
          ★ CYBER ARCADE TRIVIA ★
        </div>
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#FFE600] via-[#FF007F] to-[#00F0FF] tracking-tighter drop-shadow-[0_0_35px_rgba(255,0,127,0.8)] leading-none mb-3">
          TOP 100
        </h1>
        <p className="text-gray-300 font-bold tracking-widest text-sm md:text-base uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.6)]">
          Guess the rankings • Reveal the board • Take the crown
        </p>
      </div>

      {/* Menu Action Buttons */}
      <div className="flex flex-col gap-4 w-full max-w-sm mb-12">
        <button
          type="button"
          onClick={() => { soundFx.playFanfare(); onPlay(); }}
          className="group relative bg-gradient-to-r from-[#00F0FF] to-[#00a8ff] hover:brightness-110 text-black font-black text-xl py-4 px-8 rounded-2xl transition shadow-[0_0_25px_rgba(0,240,255,0.5)] active:scale-95 flex items-center justify-center gap-3 tracking-wider uppercase"
        >
          <span>🎮</span> PLAY GAME
        </button>

        <button
          type="button"
          onClick={() => { soundFx.playClick(); onHowToPlay(); }}
          className="bg-[#17153b] hover:bg-[#221f52] border-2 border-[#FFE600]/40 hover:border-[#FFE600] text-[#FFE600] font-black text-base py-3.5 px-6 rounded-2xl transition shadow-[0_0_15px_rgba(255,230,0,0.2)] active:scale-95 flex items-center justify-center gap-3 tracking-wider uppercase"
        >
          <span>📖</span> HOW TO PLAY
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { soundFx.playClick(); onSettings(); }}
            className="bg-[#17153b] hover:bg-[#221f52] border-2 border-[#2c2866] hover:border-[#00F0FF]/50 text-gray-200 font-bold text-sm py-3 px-4 rounded-xl transition active:scale-95 flex items-center justify-center gap-2 tracking-wide"
          >
            <span>⚙️</span> SETTINGS
          </button>

          <button
            type="button"
            onClick={() => { soundFx.playClick(); onTeams(); }}
            className="bg-[#17153b] hover:bg-[#221f52] border-2 border-[#2c2866] hover:border-[#FF007F]/50 text-gray-200 font-bold text-sm py-3 px-4 rounded-xl transition active:scale-95 flex items-center justify-center gap-2 tracking-wide"
          >
            <span>👥</span> TEAMS
          </button>
        </div>
      </div>

      {/* Footer Host hint */}
      <div className="text-[11px] font-mono text-gray-500 tracking-wider">
        Host console shortcut: <span className="text-gray-400 font-bold">Ctrl + Shift + H</span>
      </div>

    </div>
  );
}
