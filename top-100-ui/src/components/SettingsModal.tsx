import React, { useState } from 'react';
import { soundFx } from '../soundFx';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
  onQuitGame?: () => void;
  onReturnToMainMenu?: () => void;
}

export default function SettingsModal({
  settings,
  onSave,
  onClose,
  onQuitGame,
  onReturnToMainMenu
}: SettingsModalProps): React.JSX.Element {
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);
  const [localSettings, setLocalSettings] = useState<GameSettings>(() => {
    const s = { ...settings };
    if (!s.end_condition || !['both', 'turns', 'points'].includes(s.end_condition)) {
      s.end_condition = 'both';
    }
    if (s.turn_timer === undefined || ![0, 30, 60, 90].includes(s.turn_timer)) {
      s.turn_timer = 30;
    }
    if (s.max_turns === undefined || ![0, 10, 15, 20].includes(s.max_turns)) {
      s.max_turns = s.end_condition === 'turns' ? 15 : 0;
    }
    if (s.point_threshold === undefined || ![0, 250, 500, 750, 1000, 1500, 2500].includes(s.point_threshold)) {
      s.point_threshold = 500;
    }
    return s;
  });
  const [sfxMuted, setSfxMuted] = useState<boolean>(soundFx.isMuted());
  const [sfxVol, setSfxVol] = useState<number>(soundFx.getVolume());

  const handleSave = (): void => {
    soundFx.setMuted(sfxMuted);
    soundFx.setVolume(sfxVol);
    soundFx.playCorrect();
    onSave({
      ...localSettings,
      sfx_enabled: !sfxMuted,
      sfx_volume: sfxVol
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="balatro-modal rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#003c5a] border-b-2 border-[#0071b4] p-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_0_#0c1079]">
              Settings
            </h2>
            {onQuitGame && (
              <span className="bg-[#3120cd]/50 text-[#62f6bd] border border-[#62f6bd]/50 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                ⏸ Paused
              </span>
            )}
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-[#9cf6ff] hover:text-[#62f6bd] hover:bg-white/10 rounded-xl w-8 h-8 flex items-center justify-center transition font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-[#9cf6ff]">

          {/* End Condition Mode */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-[#9cf6ff] mb-2">
              Game End Condition
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 'both', label: 'Turns + Points' },
                { val: 'turns', label: 'Turns Only' },
                { val: 'points', label: 'Points Only' }
              ].map(({ val, label }) => {
                const isSelected = (localSettings.end_condition || 'both') === val;
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      soundFx.playSettingsChange();
                      const updated: GameSettings = {
                        ...localSettings,
                        end_condition: val as 'both' | 'turns' | 'points'
                      };
                      if (val === 'turns' && (updated.max_turns === 0 || !updated.max_turns)) {
                        updated.max_turns = 15;
                      }
                      if (val === 'points' && (!updated.point_threshold || updated.point_threshold === 0)) {
                        updated.point_threshold = 500;
                      }
                      setLocalSettings(updated);
                    }}
                    className={`py-2 px-1 rounded-xl font-black text-xs md:text-sm border-2 border-b-4 transition cursor-pointer text-center ${
                      isSelected
                        ? 'bg-[#62f6bd] border-[#087d6a] border-b-[#0c1079] text-[#003c5a] shadow-[0_3px_0_#0c1079,inset_0_2px_0_rgba(255,255,255,0.6)]'
                        : 'balatro-btn-dark text-[#6ad6cd]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-[#6ad6cd]/80 font-semibold mt-1.5">
              {(localSettings.end_condition || 'both') === 'both' && 'Whichever happens first: hitting point target or finishing turn limit.'}
              {localSettings.end_condition === 'turns' && 'Round ends when turn limit is reached. Highest points win!'}
              {localSettings.end_condition === 'points' && 'Race to the target score! No turn limits apply.'}
            </p>
          </div>

          {/* Turn Timer */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-[#9cf6ff] mb-2">
              Turn Timer
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: 'Off (Untimed)' },
                { val: 30, label: '30 secs' },
                { val: 60, label: '60 secs' },
                { val: 90, label: '90 secs' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { soundFx.playSettingsChange(); setLocalSettings({ ...localSettings, turn_timer: val }); }}
                  className={`py-2 px-1 rounded-xl font-black text-xs md:text-sm border-2 border-b-4 transition cursor-pointer text-center ${
                    localSettings.turn_timer === val
                      ? 'bg-[#62f6bd] border-[#087d6a] border-b-[#0c1079] text-[#003c5a] shadow-[0_3px_0_#0c1079,inset_0_2px_0_rgba(255,255,255,0.6)]'
                      : 'balatro-btn-dark text-[#6ad6cd]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Winning Point Threshold */}
          <div className={localSettings.end_condition === 'turns' ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black tracking-wider uppercase text-[#9cf6ff]">
                Winning Point Threshold
              </label>
              {localSettings.end_condition === 'turns' && (
                <span className="text-[10px] font-black text-[#00b6de] uppercase tracking-wide">
                  (Disabled in Turns Only)
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { val: 250, label: '250' },
                { val: 500, label: '500' },
                { val: 750, label: '750' },
                { val: 1000, label: '1000' },
                { val: 1500, label: '1500' },
                { val: 2500, label: '2500' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { soundFx.playSettingsChange(); setLocalSettings({ ...localSettings, point_threshold: val }); }}
                  className={`py-2 px-1 rounded-xl font-black text-xs md:text-sm border-2 border-b-4 transition text-center cursor-pointer ${
                    (localSettings.point_threshold ?? 500) === val
                      ? 'bg-[#62f6bd] border-[#087d6a] border-b-[#0c1079] text-[#003c5a] shadow-[0_3px_0_#0c1079,inset_0_2px_0_rgba(255,255,255,0.6)]'
                      : 'balatro-btn-dark text-[#6ad6cd]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#6ad6cd]/80 font-semibold mt-1.5">
              Single round win target, or overall cumulative match target in tournaments.
            </p>
          </div>

          {/* Max Turns per Team */}
          <div className={localSettings.end_condition === 'points' ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black tracking-wider uppercase text-[#9cf6ff]">
                Max Turns Per Team
              </label>
              {localSettings.end_condition === 'points' && (
                <span className="text-[10px] font-black text-[#00b6de] uppercase tracking-wide">
                  (Unlimited in Points Only)
                </span>
              )}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: 'Unlimited', disabled: localSettings.end_condition === 'turns' },
                { val: 10, label: '10 Turns' },
                { val: 15, label: '15 Turns' },
                { val: 20, label: '20 Turns' }
              ].map(({ val, label, disabled }) => (
                <button
                  key={val}
                  type="button"
                  disabled={disabled}
                  onClick={() => { soundFx.playSettingsChange(); setLocalSettings({ ...localSettings, max_turns: val }); }}
                  className={`py-2 rounded-xl font-black text-xs md:text-sm border-2 border-b-4 transition cursor-pointer ${
                    disabled
                      ? 'opacity-30 cursor-not-allowed balatro-btn-dark text-slate-500'
                      : localSettings.max_turns === val
                      ? 'bg-[#62f6bd] border-[#087d6a] border-b-[#0c1079] text-[#003c5a] shadow-[0_3px_0_#0c1079,inset_0_2px_0_rgba(255,255,255,0.6)]'
                      : 'balatro-btn-dark text-[#6ad6cd]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Sound Controls */}
          <div className="pt-3 border-t-2 border-[#0071b4]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black tracking-wider uppercase text-[#9cf6ff]">
                Sound Effects
              </span>
              <button
                type="button"
                onClick={() => soundFx.playCorrect()}
                className="balatro-btn-dark px-3 py-1.5 rounded-xl text-xs font-black text-[#62f6bd] cursor-pointer"
                title="Test Sound"
              >
                Test Sound
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#9cf6ff]">Volume</span>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={sfxVol}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setSfxVol(v);
                  soundFx.setVolume(v);
                  soundFx.setMuted(v <= 0);
                }}
                onMouseUp={() => soundFx.playSettingsChange()}
                onTouchEnd={() => soundFx.playSettingsChange()}
                className="flex-1 accent-[#62f6bd] cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-[#62f6bd] w-10 text-right">{Math.round(sfxVol * 100)}%</span>
            </div>
          </div>

          {/* Quit Game Button (Only shown when mid-game) */}
          {onQuitGame && (
            <div className="pt-3 border-t-2 border-[#0071b4]">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowQuitConfirm(true);
                }}
                className="w-full py-3 px-4 balatro-btn-red text-rose-100 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
              >
                Quit Game
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#003c5a] border-t-2 border-[#0071b4] flex justify-between gap-3">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="balatro-btn-dark px-5 py-2.5 rounded-xl text-[#9cf6ff] font-black transition text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="balatro-btn-primary font-black px-7 py-2.5 rounded-xl transition tracking-wide text-sm cursor-pointer text-[#003c5a]"
          >
            Save
          </button>
        </div>

      </div>

      {/* Quit Confirmation Popup Overlay */}
      {showQuitConfirm && onQuitGame && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in">
          <div className="balatro-modal p-6 md:p-8 rounded-3xl max-w-sm w-full text-center animate-in zoom-in-95 border-rose-600">
            <div className="text-3xl mb-2">⚠️</div>
            <h3 className="text-lg font-black text-rose-400 uppercase tracking-wider mb-2">
              Quit Game?
            </h3>
            <p className="text-sm text-[#9cf6ff]/80 font-semibold mb-6 leading-relaxed">
              Your round data will be lost. Are you sure you want to quit?
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowQuitConfirm(false);
                }}
                className="balatro-btn-dark px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  setShowQuitConfirm(false);
                  onClose();
                  onQuitGame();
                }}
                className="balatro-btn-red px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer text-white shadow-lg"
              >
                Yes, Quit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
