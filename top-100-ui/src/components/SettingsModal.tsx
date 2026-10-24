import React, { useState } from 'react';
import { soundFx } from '../soundFx';
import { GameSettings } from '../types';

interface SettingsModalProps {
  settings: GameSettings;
  onSave: (settings: GameSettings) => void;
  onClose: () => void;
  onReturnToMainMenu?: () => void;
}

export default function SettingsModal({
  settings,
  onSave,
  onClose,
  onReturnToMainMenu
}: SettingsModalProps): React.JSX.Element {
  const [localSettings, setLocalSettings] = useState<GameSettings>({ ...settings });
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
        <div className="bg-[#1a1442] border-b-2 border-[#2b2164] p-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_0_#0d0924]">
            Game Settings
          </h2>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-purple-300 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 flex items-center justify-center transition font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-purple-100">

          {/* Turn Timer */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-purple-300 mb-2">
              Turn Timer (Seconds)
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 0, label: 'Off' },
                { val: 15, label: '15s' },
                { val: 30, label: '30s' },
                { val: 60, label: '60s' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, turn_timer: val }); }}
                  className={`py-2 rounded-xl font-black text-sm border-2 border-b-4 transition cursor-pointer ${
                    localSettings.turn_timer === val
                      ? 'bg-blue-600 border-blue-900 text-white shadow-[0_3px_0_#0a1438,inset_0_2px_0_rgba(255,255,255,0.3)]'
                      : 'balatro-btn-dark text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Strikes */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-rose-300 mb-2">
              Max Strikes Before Elimination
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { val: 0, label: 'Off' },
                { val: 1, label: '1 Strike' },
                { val: 2, label: '2 Strikes' },
                { val: 3, label: '3 Strikes' },
                { val: 5, label: '5 Strikes' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, max_strikes: val }); }}
                  className={`py-2 px-1 rounded-xl font-black text-xs md:text-sm border-2 border-b-4 transition text-center cursor-pointer ${
                    localSettings.max_strikes === val
                      ? 'bg-rose-600 border-rose-950 text-white shadow-[0_3px_0_#3f0714,inset_0_2px_0_rgba(255,255,255,0.3)]'
                      : 'balatro-btn-dark text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Turns per Team */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-purple-300 mb-2">
              Max Turns Per Team
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { val: 0, label: 'Unlimited' },
                { val: 5, label: '5 Turns' },
                { val: 10, label: '10 Turns' }
              ].map(({ val, label }) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, max_turns: val }); }}
                  className={`py-2 rounded-xl font-black text-sm border-2 border-b-4 transition cursor-pointer ${
                    localSettings.max_turns === val
                      ? 'bg-purple-600 border-purple-950 text-white shadow-[0_3px_0_#1b0433,inset_0_2px_0_rgba(255,255,255,0.3)]'
                      : 'balatro-btn-dark text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scoring Formula */}
          <div>
            <label className="block text-xs font-black tracking-wider uppercase text-purple-300 mb-2">
              Scoring Formula
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, scoring_mode: 'top_answer' }); }}
                className={`p-3.5 rounded-xl text-left border-2 border-b-4 transition text-xs md:text-sm cursor-pointer ${
                  localSettings.scoring_mode === 'top_answer'
                    ? 'bg-[#291a5c] border-purple-400 border-b-[#1b0841] text-white shadow-[0_4px_0_#0e0424,inset_0_1.5px_0_rgba(255,255,255,0.2)]'
                    : 'balatro-card text-purple-200'
                }`}
              >
                <div className="font-black text-white">Top Answer Bonus</div>
                <div className="text-[11px] text-purple-200/70 mt-0.5">#1 = 100 pts, #100 = 1 pt</div>
              </button>

              <button
                type="button"
                onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, scoring_mode: 'deep_cut' }); }}
                className={`p-3.5 rounded-xl text-left border-2 border-b-4 transition text-xs md:text-sm cursor-pointer ${
                  localSettings.scoring_mode === 'deep_cut'
                    ? 'bg-[#291a5c] border-purple-400 border-b-[#1b0841] text-white shadow-[0_4px_0_#0e0424,inset_0_1.5px_0_rgba(255,255,255,0.2)]'
                    : 'balatro-card text-purple-200'
                }`}
              >
                <div className="font-black text-white">Deep Cut Bonus</div>
                <div className="text-[11px] text-purple-200/70 mt-0.5">#1 = 1 pt, #100 = 100 pts</div>
              </button>
            </div>
          </div>

          {/* Sound Controls */}
          <div className="pt-3 border-t-2 border-[#2b2164]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black tracking-wider uppercase text-purple-300">
                Sound Effects
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !sfxMuted;
                    setSfxMuted(next);
                    if (!next) soundFx.playCorrect();
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 border-b-4 transition cursor-pointer ${
                    !sfxMuted 
                      ? 'bg-blue-600 border-blue-900 text-white shadow-[0_2px_0_#0b112c]' 
                      : 'balatro-btn-dark text-slate-400'
                  }`}
                >
                  {sfxMuted ? 'Muted' : 'Enabled'}
                </button>
                <button
                  type="button"
                  onClick={() => soundFx.playCorrect()}
                  className="balatro-btn-dark px-3 py-1.5 rounded-xl text-xs font-black text-purple-200 cursor-pointer"
                  title="Test Sound"
                >
                  Test Sound
                </button>
              </div>
            </div>

            {!sfxMuted && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-purple-300">Volume</span>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  value={sfxVol}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSfxVol(v);
                    soundFx.setVolume(v);
                  }}
                  className="flex-1 accent-purple-400 cursor-pointer"
                />
                <span className="text-xs font-mono font-bold text-purple-300 w-8">{Math.round(sfxVol * 100)}%</span>
              </div>
            )}
          </div>

          {/* Return to Main Menu Option */}
          {onReturnToMainMenu && (
            <div className="pt-3 border-t-2 border-[#2b2164]">
              <button
                type="button"
                onClick={() => {
                  soundFx.playClick();
                  onClose();
                  onReturnToMainMenu();
                }}
                className="w-full py-3 px-4 balatro-btn-dark hover:border-rose-700 text-rose-300 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer text-center"
              >
                Return to Main Menu
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1442] border-t-2 border-[#2b2164] flex justify-between gap-3">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="balatro-btn-dark px-5 py-2.5 rounded-xl text-purple-200 font-black transition text-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="balatro-btn-white font-black px-7 py-2.5 rounded-xl transition tracking-wide text-sm cursor-pointer"
          >
            Save Settings
          </button>
        </div>

      </div>
    </div>
  );
}
