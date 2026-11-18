import React, { useState, useEffect } from 'react';
import { soundFx } from '../soundFx';

interface MainMenuProps {
  onPlay: () => void;
  onOnlinePlay?: () => void;
  onHowToPlay: () => void;
  onSettings: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

// Indicator: Chunky Glowing Arcade Arrows pointing towards selected button (Crimson/Coral in Red mode, Sapphire/Cyan in Blue mode)
function MenuArrowIndicator({ side }: { side: 'left' | 'right' }): React.JSX.Element {
  return (
    <div
      className={`pointer-events-none flex items-center transition-all duration-300 ${
        side === 'left' ? 'arrow-indicator-left' : 'arrow-indicator-right'
      }`}
    >
      <svg
        viewBox="0 0 36 36"
        className="menu-arrow-svg w-8 h-8 sm:w-9 sm:h-9 filter"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transform: side === 'right' ? 'scaleX(-1)' : 'none' }}
      >
        {/* Outer thick chevron pointing right */}
        <path
          className="arrow-chevron-outer"
          d="M 6 6 L 22 18 L 6 30 L 12 30 L 28 18 L 12 6 Z"
          stroke="#0d0d0d"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Inner neon accent chevron */}
        <path
          className="arrow-chevron-inner"
          d="M 10 10 L 21 18 L 10 26 L 14 26 L 25 18 L 14 10 Z"
        />
        {/* Leading apex highlight dot */}
        <circle cx="28" cy="18" r="2" fill="#fffbd4" />
      </svg>
    </div>
  );
}

export default function MainMenu({
  onPlay,
  onOnlinePlay,
  onHowToPlay,
  onSettings,
  onToggleFullscreen,
  isFullscreen
}: MainMenuProps): React.JSX.Element {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [showQuitModal, setShowQuitModal] = useState<boolean>(false);
  const [hasExitedMessage, setHasExitedMessage] = useState<boolean>(false);

  const confirmQuit = (): void => {
    soundFx.playClick();
    setHasExitedMessage(true);
    try {
      window.close();
    } catch {
      // ignore
    }
    setTimeout(() => {
      try {
        window.open('', '_self', '');
        window.close();
      } catch {
        // ignore
      }
    }, 150);
  };

  const menuItems = [
    {
      id: 'play',
      label: 'PLAY GAME',
      action: () => { soundFx.playFanfare(); onPlay(); },
      btnClass: 'arcade-pixel-btn arcade-btn-whitish text-xl sm:text-2xl shadow-lg'
    },
    {
      id: 'online',
      label: 'ONLINE PLAY',
      action: () => {
        soundFx.playFanfare();
        if (onOnlinePlay) {
          onOnlinePlay();
        } else {
          alert('Online Play Lobby opening...');
        }
      },
      btnClass: 'arcade-pixel-btn arcade-btn-whitish text-lg sm:text-xl shadow-md'
    },
    {
      id: 'how_to_play',
      label: 'HOW TO PLAY',
      action: () => { soundFx.playClick(); onHowToPlay(); },
      btnClass: 'arcade-pixel-btn arcade-btn-whitish text-lg sm:text-xl shadow-md'
    },
    {
      id: 'settings',
      label: 'SETTINGS',
      action: () => { soundFx.playClick(); onSettings(); },
      btnClass: 'arcade-pixel-btn arcade-btn-whitish text-lg sm:text-xl shadow-md'
    },
    {
      id: 'quit',
      label: 'QUIT GAME',
      isQuit: true,
      action: () => {
        soundFx.playClick();
        setShowQuitModal(true);
      },
      btnClass: 'arcade-pixel-btn arcade-btn-whitish text-lg sm:text-xl shadow-md'
    }
  ];

  // Keyboard navigation (Arrow keys + Enter)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showQuitModal) {
        if (e.key === 'Escape') {
          soundFx.playClick();
          setShowQuitModal(false);
        } else if (e.key === 'Enter') {
          confirmQuit();
        }
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        soundFx.playHover();
        setSelectedIndex((prev) => (prev + 1) % menuItems.length);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        soundFx.playHover();
        setSelectedIndex((prev) => (prev - 1 + menuItems.length) % menuItems.length);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        menuItems[selectedIndex].action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, showQuitModal]);

  return (
    <div
      className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] pt-14 pb-6 px-4 text-center"
      style={{ fontFamily: "'Archivo', system-ui, sans-serif" }}
    >
      {/* Top utility bar: fullscreen symbol only (quit button removed from top-right) */}
      {!isFullscreen && (
        <div className="absolute top-4 right-4 flex items-center gap-3 z-20">
          <button
            type="button"
            onClick={() => {
              soundFx.playClick();
              onToggleFullscreen();
            }}
            onMouseEnter={() => soundFx.playHover()}
            className="balatro-btn-dark w-11 h-11 rounded-xl flex items-center justify-center text-[#fffbd4] cursor-pointer transition active:translate-y-0.5"
            title="Fullscreen"
            aria-label="Fullscreen"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
      )}

      {/* Title Segment */}
      <div className="mb-8 flex flex-col items-center select-none relative">
        <h1 className="arcade-skew-title pvz-portal-pop">
          <span className="arcade-neon-top text-3xl sm:text-4xl md:text-5xl pl-1">
            TOP
          </span>
          <span className="arcade-neon-100 text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] -mt-1 sm:-mt-2 md:-mt-3">
            100
          </span>
        </h1>
      </div>

      {/* Central Menu: Pixel Art 3D Beveled Buttons with Split Cloud Indicators */}
      <div className="flex flex-col gap-4 w-full max-w-sm relative">
        {menuItems.map((item, idx) => {
          const isSelected = selectedIndex === idx;

          return (
            <div
              key={item.id}
              className="relative flex items-center justify-center w-full"
              onMouseEnter={() => {
                soundFx.playHover();
                setSelectedIndex(idx);
              }}
            >
              {/* Left Glowing Arrow Indicator */}
              <div
                className={`absolute -left-11 sm:-left-13 transition-all duration-200 flex items-center justify-center z-20 pointer-events-none ${
                  isSelected
                    ? 'opacity-100 translate-x-0 scale-100'
                    : 'opacity-0 translate-x-3 scale-75'
                }`}
                style={{ top: 'calc(50% - 6px)' }}
              >
                <MenuArrowIndicator side="left" />
              </div>

              {/* Chunky Pixel Art 3D Push Button without any logo */}
              <button
                type="button"
                onClick={item.action}
                className={item.btnClass}
              >
                <span>{item.label}</span>
              </button>

              {/* Right Glowing Arrow Indicator */}
              <div
                className={`absolute -right-11 sm:-right-13 transition-all duration-200 flex items-center justify-center z-20 pointer-events-none ${
                  isSelected
                    ? 'opacity-100 translate-x-0 scale-100'
                    : 'opacity-0 -translate-x-3 scale-75'
                }`}
                style={{ top: 'calc(50% - 6px)' }}
              >
                <MenuArrowIndicator side="right" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Retro Arcade Quit Confirmation Modal (logo removed) */}
      {showQuitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-150">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-md w-full text-center border-4 border-[#891c1c] shadow-[0_12px_0_#0d0d0d] animate-in zoom-in-95 duration-150 bg-[#0a0f23]">
            <h3 className="text-2xl md:text-3xl font-black text-[#ef5368] uppercase tracking-wider mb-3 drop-shadow-[0_2px_0_#0d0d0d]">
              Quit Game?
            </h3>

            {hasExitedMessage ? (
              <p className="text-sm md:text-base text-[#fffbd4] font-bold mb-6 leading-relaxed">
                Game closed. You can now safely close this browser tab or window.
              </p>
            ) : (
              <p className="text-sm md:text-base text-[#fffbd4]/90 font-bold mb-6 leading-relaxed">
                Are you sure you want to quit Top 100?
              </p>
            )}

            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowQuitModal(false);
                  setHasExitedMessage(false);
                }}
                onMouseEnter={() => soundFx.playHover()}
                className="arcade-pixel-btn pixel-btn-dark text-sm sm:text-base cursor-pointer min-w-[120px]"
              >
                Cancel
              </button>
              {!hasExitedMessage && (
                <button
                  type="button"
                  onClick={confirmQuit}
                  onMouseEnter={() => soundFx.playHover()}
                  className="arcade-pixel-btn balatro-btn-red text-white text-sm sm:text-base cursor-pointer flex items-center justify-center min-w-[130px]"
                >
                  <span>Yes, Quit</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
