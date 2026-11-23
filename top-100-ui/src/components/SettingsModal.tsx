import React, { useState, useRef } from 'react';
import { soundFx } from '../soundFx';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
  onQuitGame?: () => void;
  onReturnToMainMenu?: () => void;
  isOnline?: boolean;
  isHost?: boolean;
  onReturnToLobby?: () => void;
}

export default function SettingsModal({
  settings,
  onSave,
  onClose,
  onQuitGame,
  isOnline,
  isHost,
  onReturnToLobby,
}: SettingsModalProps): React.JSX.Element {
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);

  // Snapshot initial audio & visual state so Cancel can cleanly revert
  const initialSettingsRef = useRef({
    sfxVolume: soundFx.getSfxVolume(),
    muted: soundFx.isMuted(),
    reduceMotion: typeof localStorage !== 'undefined' ? localStorage.getItem('top100_reduce_motion') === 'true' : false,
    brightness: typeof localStorage !== 'undefined' && localStorage.getItem('top100_brightness')
      ? parseFloat(localStorage.getItem('top100_brightness')!)
      : 100,
    colorTheme: typeof localStorage !== 'undefined' && localStorage.getItem('top100_color_theme') === 'blue'
      ? ('blue' as 'red' | 'blue')
      : ('red' as 'red' | 'blue')
  });

  const [isMuted, setIsMuted] = useState<boolean>(initialSettingsRef.current.muted);
  const [sfxVol, setSfxVol] = useState<number>(initialSettingsRef.current.sfxVolume);
  const [reduceMotion, setReduceMotion] = useState<boolean>(initialSettingsRef.current.reduceMotion);
  const [brightness, setBrightness] = useState<number>(initialSettingsRef.current.brightness);
  const [colorTheme, setColorTheme] = useState<'red' | 'blue'>(initialSettingsRef.current.colorTheme);

  const applyBrightness = (val: number): void => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.filter = `brightness(${val / 100})`;
    }
  };

  const handleBrightnessChange = (val: number): void => {
    setBrightness(val);
    applyBrightness(val);
  };

  const handleResetBrightness = (): void => {
    soundFx.playSettingsChange();
    setBrightness(100);
    applyBrightness(100);
  };

  const handleToggleTheme = (theme: 'red' | 'blue'): void => {
    soundFx.playSettingsChange();
    setColorTheme(theme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-blue', theme === 'blue');
    }
  };

  const handleCancel = (): void => {
    // Revert sound settings to their pre-modal state
    soundFx.setSfxVolume(initialSettingsRef.current.sfxVolume);
    soundFx.setMuted(initialSettingsRef.current.muted);

    // Revert reduce motion
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('reduce-motion', initialSettingsRef.current.reduceMotion);
    }

    // Revert brightness
    applyBrightness(initialSettingsRef.current.brightness);

    // Revert color theme
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('theme-blue', initialSettingsRef.current.colorTheme === 'blue');
    }

    soundFx.playClick();
    onClose();
  };

  const handleSave = (): void => {
    soundFx.setMuted(isMuted);
    soundFx.setSfxVolume(sfxVol);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('top100_reduce_motion', String(reduceMotion));
      localStorage.setItem('top100_brightness', String(brightness));
      localStorage.setItem('top100_color_theme', colorTheme);
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('reduce-motion', reduceMotion);
      document.documentElement.classList.toggle('theme-blue', colorTheme === 'blue');
    }
    applyBrightness(brightness);

    soundFx.playCorrect();
    onSave({
      ...settings,
      sfx_enabled: !isMuted,
      sfx_volume: sfxVol,
      reduce_motion: reduceMotion,
      brightness: brightness,
      color_theme: colorTheme
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="balatro-modal rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0d0d0d] border-b-2 border-[#891c1c] p-5 flex items-center justify-between">
          <h2 className="text-xl md:text-2xl font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_2px_0_#0d0d0d]">
            Settings
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#fffbd4]">

          {/* Audio Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs md:text-sm font-black tracking-wider uppercase text-[#fffbd4]">
                Sound Effects
              </span>
              <button
                type="button"
                onMouseEnter={() => soundFx.playHover()}
                onClick={() => {
                  const next = !isMuted;
                  setIsMuted(next);
                  soundFx.setMuted(next);
                  if (!next) soundFx.playClick();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer border transition ${
                  isMuted
                    ? 'bg-[#891c1c] text-[#fffbd4] border-[#ef5368] shadow-md'
                    : 'balatro-btn-dark text-[#fffbd4] border-[#891c1c]'
                }`}
              >
                {isMuted ? '🔇 Audio Muted' : '🔊 Audio Active'}
              </button>
            </div>

            {/* SFX Volume */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#fffbd4]">SFX Volume</span>
                <button
                  type="button"
                  disabled={isMuted}
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => soundFx.playCorrect()}
                  className="text-[11px] font-black text-[#ef5368] hover:text-[#fffbd4] uppercase tracking-wider cursor-pointer disabled:opacity-40"
                >
                  🔊 Test SFX
                </button>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  disabled={isMuted}
                  value={sfxVol}
                  onMouseEnter={() => soundFx.playHover()}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSfxVol(v);
                    soundFx.setSfxVolume(v);
                  }}
                  onMouseUp={() => soundFx.playSettingsChange()}
                  onTouchEnd={() => soundFx.playSettingsChange()}
                  className="flex-1 accent-[#ef5368] settings-slider-red cursor-pointer h-3 disabled:opacity-40"
                />
                <span className="text-sm font-mono font-black text-[#fffbd4] w-12 text-right">
                  {isMuted ? '0%' : `${Math.round(sfxVol * 100)}%`}
                </span>
              </div>
            </div>
          </div>

          {/* Visual & Display Controls */}
          <div className="pt-4 border-t-2 border-[#891c1c]/40 space-y-4">
            <span className="text-xs md:text-sm font-black tracking-wider uppercase text-[#fffbd4] block">
              Visual & Display
            </span>

            {/* Brightness Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#fffbd4]">Brightness</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono font-black text-[#fffbd4]">
                    {brightness}%
                  </span>
                  {brightness !== 100 && (
                    <button
                      type="button"
                      onMouseEnter={() => soundFx.playHover()}
                      onClick={handleResetBrightness}
                      className="text-[11px] font-black text-[#ef5368] hover:text-[#fffbd4] uppercase tracking-wider cursor-pointer"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="150"
                  step="5"
                  value={brightness}
                  onMouseEnter={() => soundFx.playHover()}
                  onChange={(e) => handleBrightnessChange(parseFloat(e.target.value))}
                  onMouseUp={() => soundFx.playSettingsChange()}
                  onTouchEnd={() => soundFx.playSettingsChange()}
                  className="flex-1 accent-[#ef5368] settings-slider-red cursor-pointer h-3"
                />
              </div>
              <p className="text-[11px] text-[#fffbd4]/60 font-semibold">
                Adjust overall screen lighting (50% dim to 150% bright). Default is 100%.
              </p>
            </div>

            {/* Color Theme Palette Toggle */}
            <div className="space-y-2 pt-2 border-t border-slate-700/60">
              <span className="text-xs md:text-sm font-black tracking-wider uppercase text-[#fffbd4]">
                Color Theme Mode
              </span>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => handleToggleTheme('red')}
                  className={`py-3 px-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                    colorTheme === 'red'
                      ? 'bg-[#891c1c]/40 border-[#ef5368] shadow-md'
                      : 'bg-[#0a0f23] border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full theme-red-swatch border border-white shadow-sm shrink-0" />
                    <div>
                      <div className="text-xs md:text-sm font-black text-[#fffbd4]">Red Theme</div>
                      <div className="text-[10px] text-[#fffbd4]/60 font-semibold">Cyber Crimson</div>
                    </div>
                  </div>
                  {colorTheme === 'red' && (
                    <span className="text-xs font-black text-[#fffbd4]">✓</span>
                  )}
                </button>

                <button
                  type="button"
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => handleToggleTheme('blue')}
                  className={`py-3 px-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                    colorTheme === 'blue'
                      ? 'bg-blue-950/60 border-sky-400 shadow-md'
                      : 'bg-[#0a0f23] border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-[#38bdf8] border border-white shadow-sm shrink-0" />
                    <div>
                      <div className="text-xs md:text-sm font-black text-[#fffbd4]">Blue Theme</div>
                      <div className="text-[10px] text-[#fffbd4]/60 font-semibold">Sapphire Cobalt</div>
                    </div>
                  </div>
                  {colorTheme === 'blue' && (
                    <span className="text-xs font-black text-[#fffbd4]">✓</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[#fffbd4]/60 font-semibold">
                Toggle between Cyber Crimson (classic red) and Sapphire Cobalt (all red shades turn to blue).
              </p>
            </div>

            {/* Reduce Motion */}
            <button
              type="button"
              onMouseEnter={() => soundFx.playHover()}
              onClick={() => {
                soundFx.playSettingsChange();
                setReduceMotion(!reduceMotion);
              }}
              className={`w-full p-3.5 rounded-2xl border-2 flex items-center justify-between text-left transition cursor-pointer ${
                reduceMotion
                  ? 'bg-[#891c1c]/30 border-[#ef5368] shadow-md'
                  : 'bg-[#0a0f23] border-[#891c1c]'
              }`}
            >
              <div>
                <div className="text-xs md:text-sm font-black text-[#fffbd4]">
                  Reduce Motion & Celebrations
                </div>
                <div className="text-[11px] text-[#fffbd4]/70 font-semibold mt-0.5">
                  Disable particle confetti, swirl background vortex, and steady carousel inspection.
                </div>
              </div>
              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center font-black text-xs ${
                reduceMotion
                  ? 'bg-[#ef5368] border-[#fffbd4] text-[#fffbd4]'
                  : 'bg-[#0d0d0d] border-[#891c1c] text-transparent'
              }`}>
                ✓
              </div>
            </button>
          </div>

          {/* Online Host Action: Return to Lobby with Team */}
          {isOnline && isHost && onReturnToLobby && (
            <div className="pt-4 border-t-2 border-slate-700">
              <button
                type="button"
                onMouseEnter={() => soundFx.playHover()}
                onClick={() => {
                  soundFx.playClick();
                  onReturnToLobby();
                }}
                className="w-full py-3.5 px-4 balatro-btn-blue text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl transition cursor-pointer text-center shadow-md flex items-center justify-center gap-2"
              >
                <span>Return to Lobby with Team</span>
              </button>
            </div>
          )}

          {/* In-Game Only: Quit Game Button */}
          {onQuitGame && (
            <div className="pt-4 border-t-2 border-slate-700">
              <button
                type="button"
                onMouseEnter={() => soundFx.playHover()}
                onClick={() => {
                  soundFx.playClick();
                  setShowQuitConfirm(true);
                }}
                className="w-full py-3.5 px-4 balatro-btn-red text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-2xl transition cursor-pointer text-center shadow-md flex items-center justify-center gap-2"
              >
                <span>✕</span>
                <span>Quit Game</span>
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d0d0d] border-t-2 border-slate-700 flex justify-between gap-3">
          <button
            onClick={handleCancel}
            onMouseEnter={() => soundFx.playHover()}
            className="balatro-btn-dark px-6 py-3 rounded-2xl text-[#fffbd4] font-black transition text-sm md:text-base uppercase tracking-wider cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            onMouseEnter={() => soundFx.playHover()}
            className="balatro-btn-purple font-black px-8 py-3 rounded-2xl transition tracking-wider text-sm md:text-base uppercase cursor-pointer text-white shadow-md"
          >
            Save
          </button>
        </div>

        {/* Quit Confirmation Popup Overlay */}
        {showQuitConfirm && onQuitGame && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
            <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-sm w-full text-center border-[#ef5368] shadow-2xl">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg md:text-xl font-black text-[#ef5368] uppercase tracking-wider mb-2">
                Quit Game?
              </h3>
              <p className="text-sm text-[#fffbd4]/80 font-semibold mb-6 leading-relaxed">
                Your current round progress will be lost. Are you sure you want to quit?
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => {
                    soundFx.playClick();
                    setShowQuitConfirm(false);
                  }}
                  className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-[#fffbd4]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => {
                    soundFx.playClick();
                    setShowQuitConfirm(false);
                    onClose();
                    onQuitGame();
                  }}
                  className="balatro-btn-red px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-white shadow-lg flex items-center gap-1.5"
                >
                  <span>✕</span>
                  <span>Yes, Quit</span>
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
