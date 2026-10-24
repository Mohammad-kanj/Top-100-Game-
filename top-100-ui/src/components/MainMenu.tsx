import React, { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';

interface MainMenuProps {
  onPlay: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  onToggleDisplayMode: () => void;
}

// Hollow Knight indicator: One cloud split in half on both sides
function SplitCloudIndicator({ side }: { side: 'left' | 'right' }): React.JSX.Element {
  return (
    <div
      className={`pointer-events-none flex items-center transition-all duration-300 ${
        side === 'left' ? 'cloud-half-left' : 'cloud-half-right'
      }`}
    >
      <svg
        viewBox="0 0 32 36"
        className="w-8 h-9 sm:w-9 sm:h-10 text-cyan-300 drop-shadow-[0_0_12px_rgba(56,189,248,0.95)] filter"
        fill="currentColor"
        style={{ transform: side === 'right' ? 'scaleX(-1)' : 'none' }}
      >
        {/* Left half of a split cloud: flat vertical inner seam on the right, puffy lobes on the outer left */}
        <path d="M 30 2 C 22 2 15 6 12 12 C 5 13 0 18 0 24 C 0 30 5 34 12 34 C 18 34 25 32 30 30 Z" />
        {/* Crisp inner cut seam highlight */}
        <line x1="30" y1="2" x2="30" y2="30" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" />
        {/* Small floating outer vapor dot */}
        <circle cx="5" cy="30" r="2.5" opacity="0.6" />
      </svg>
    </div>
  );
}

export default function MainMenu({
  onPlay,
  onHowToPlay,
  onSettings,
  onToggleFullscreen,
  isFullscreen,
  onToggleDisplayMode
}: MainMenuProps): React.JSX.Element {
  // Hollow Knight menu selection tracking (supports mouse hover & keyboard arrow navigation)
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const menuItems = [
    {
      id: 'play',
      label: 'PLAY GAME',
      action: () => { soundFx.playFanfare(); onPlay(); },
      btnClass: 'balatro-btn-blue font-black text-lg py-3.5 px-6 rounded-xl tracking-wider cursor-pointer uppercase shadow-lg w-full'
    },
    {
      id: 'how_to_play',
      label: 'HOW TO PLAY',
      action: () => { soundFx.playClick(); onHowToPlay(); },
      btnClass: 'balatro-btn-purple font-black text-sm py-2.5 px-6 rounded-xl tracking-wider cursor-pointer uppercase shadow-md w-full'
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      action: () => { soundFx.playClick(); onSettings(); },
      btnClass: 'balatro-btn-blue font-black text-sm py-2.5 px-6 rounded-xl tracking-wider cursor-pointer uppercase shadow-md w-full'
    },
    {
      id: 'display',
      label: 'DISPLAY',
      action: () => { soundFx.playClick(); onToggleDisplayMode(); },
      btnClass: 'balatro-btn-purple font-black text-xs py-2.5 px-6 rounded-xl tracking-wider cursor-pointer uppercase shadow-md w-full'
    }
  ];

  // Keyboard navigation (Arrow keys + Enter) like classic Hollow Knight / arcade
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundFx.playClick();
        setSelectedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        soundFx.playClick();
        setSelectedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuItems[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] p-4 text-center">
      
      {/* Top utility bar: fullscreen toggle */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={onToggleFullscreen}
          className="balatro-btn-dark text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      {/* Title Segment (Photoshop skewed Balatro Titan One font, 'TOP' in top-left, massive '100') */}
      <div className="mb-8 flex flex-col items-center select-none">
        <h1 className="arcade-skew-title">
          <span className="arcade-neon-top text-3xl sm:text-4xl md:text-5xl pl-1">
            TOP
          </span>
          <span className="arcade-neon-100 text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] -mt-1 sm:-mt-2 md:-mt-3">
            100
          </span>
        </h1>

        {/* Subtitle segment with reduced compact black capsule */}
        <div className="balatro-subtitle-capsule px-4 py-1.5 rounded-full inline-flex items-center justify-center mt-5 max-w-md">
          <p className="text-cyan-200 font-bold tracking-wider text-[10px] md:text-xs uppercase">
            Uncover hidden rankings. Outscore the competition.
          </p>
        </div>
      </div>

      {/* Central Menu: Chunky Arcade Boxed Buttons with Split Cloud Indicators */}
      <div className="flex flex-col gap-3.5 w-full max-w-xs relative">
        {menuItems.map((item, idx) => {
          const isSelected = selectedIndex === idx;

          return (
            <div
              key={item.id}
              className="relative flex items-center justify-center w-full"
              onMouseEnter={() => {
                if (selectedIndex !== idx) {
                  soundFx.playClick();
                  setSelectedIndex(idx);
                }
              }}
            >
              {/* Left Half of Split Cloud */}
              <div
                className={`absolute -left-11 sm:-left-12 transition-all duration-200 flex items-center justify-center z-20 ${
                  isSelected
                    ? 'opacity-100 translate-x-0 scale-100'
                    : 'opacity-0 translate-x-3 scale-75 pointer-events-none'
                }`}
              >
                <SplitCloudIndicator side="left" />
              </div>

              {/* Chunky Arcade Boxed Button */}
              <button
                type="button"
                onClick={item.action}
                className={item.btnClass}
              >
                {item.label}
              </button>

              {/* Right Half of Split Cloud */}
              <div
                className={`absolute -right-11 sm:-right-12 transition-all duration-200 flex items-center justify-center z-20 ${
                  isSelected
                    ? 'opacity-100 translate-x-0 scale-100'
                    : 'opacity-0 -translate-x-3 scale-75 pointer-events-none'
                }`}
              >
                <SplitCloudIndicator side="right" />
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
