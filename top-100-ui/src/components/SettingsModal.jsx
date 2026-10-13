import { useState } from 'react';
import { soundFx } from '../soundFx';

export default function SettingsModal({ settings, onSave, onClose }) {
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [sfxMuted, setSfxMuted] = useState(soundFx.isMuted());
  const [sfxVol, setSfxVol] = useState(soundFx.getVolume());

  const handleSave = () => {
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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0e26] border-2 border-[#FFE600] rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_40px_rgba(255,230,0,0.3)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#17153b] border-b border-[#FFE600]/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⚙️</span>
            <h2 className="text-2xl font-black text-[#FFE600] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(255,230,0,0.7)]">
              GAME SETTINGS
            </h2>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-gray-200">

          {/* Turn Timer */}
          <div>
            <label className="block text-sm font-black tracking-wider uppercase text-[#00F0FF] mb-2">
              ⏱️ Turn Timer (Seconds)
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
                  className={`py-2 rounded-xl font-black text-sm border-2 transition ${
                    localSettings.turn_timer === val
                      ? 'bg-[#00F0FF] border-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                      : 'bg-[#17153b] border-[#2c2866] text-gray-300 hover:border-[#00F0FF]/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Strikes */}
          <div>
            <label className="block text-sm font-black tracking-wider uppercase text-red-400 mb-2">
              ❌ Max Strikes Before Elimination
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
                  className={`py-2 px-1 rounded-xl font-black text-xs md:text-sm border-2 transition text-center ${
                    localSettings.max_strikes === val
                      ? 'bg-red-500 border-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]'
                      : 'bg-[#17153b] border-[#2c2866] text-gray-300 hover:border-red-400/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Max Turns per Team */}
          <div>
            <label className="block text-sm font-black tracking-wider uppercase text-purple-400 mb-2">
              🔄 Max Turns Per Team
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
                  className={`py-2 rounded-xl font-black text-sm border-2 transition ${
                    localSettings.max_turns === val
                      ? 'bg-purple-500 border-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]'
                      : 'bg-[#17153b] border-[#2c2866] text-gray-300 hover:border-purple-400/50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Scoring Formula */}
          <div>
            <label className="block text-sm font-black tracking-wider uppercase text-[#FFE600] mb-2">
              ⭐ Scoring Formula
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, scoring_mode: 'top_answer' }); }}
                className={`p-3 rounded-xl font-bold text-left border-2 transition text-xs md:text-sm ${
                  localSettings.scoring_mode === 'top_answer'
                    ? 'bg-[#FFE600] border-[#FFE600] text-black shadow-[0_0_12px_rgba(255,230,0,0.4)]'
                    : 'bg-[#17153b] border-[#2c2866] text-gray-300 hover:border-[#FFE600]/50'
                }`}
              >
                <div className="font-black">Top Answer Bonus</div>
                <div className="text-[11px] opacity-80 mt-0.5">#1 = 100 pts, #100 = 1 pt</div>
              </button>

              <button
                type="button"
                onClick={() => { soundFx.playClick(); setLocalSettings({ ...localSettings, scoring_mode: 'deep_cut' }); }}
                className={`p-3 rounded-xl font-bold text-left border-2 transition text-xs md:text-sm ${
                  localSettings.scoring_mode === 'deep_cut'
                    ? 'bg-[#FFE600] border-[#FFE600] text-black shadow-[0_0_12px_rgba(255,230,0,0.4)]'
                    : 'bg-[#17153b] border-[#2c2866] text-gray-300 hover:border-[#FFE600]/50'
                }`}
              >
                <div className="font-black">Deep Cut Bonus</div>
                <div className="text-[11px] opacity-80 mt-0.5">#1 = 1 pt, #100 = 100 pts</div>
              </button>
            </div>
          </div>

          {/* Sound FX Audio Controls */}
          <div className="pt-2 border-t border-[#252254]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-black tracking-wider uppercase text-[#FF007F]">
                🔊 Retro Synth Sound FX
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = !sfxMuted;
                    setSfxMuted(next);
                    if (!next) soundFx.playCorrect();
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-black border transition ${
                    !sfxMuted 
                      ? 'bg-[#FF007F] border-[#FF007F] text-white' 
                      : 'bg-gray-800 border-gray-600 text-gray-400'
                  }`}
                >
                  {sfxMuted ? 'MUTED' : 'ENABLED'}
                </button>
                <button
                  type="button"
                  onClick={() => soundFx.playCorrect()}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold text-gray-200"
                  title="Test Sound"
                >
                  TEST 🎵
                </button>
              </div>
            </div>

            {!sfxMuted && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-400">Vol</span>
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
                  className="flex-1 accent-[#FF007F] cursor-pointer"
                />
                <span className="text-xs font-mono text-gray-400 w-8">{Math.round(sfxVol * 100)}%</span>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-[#12102e] border-t border-[#252254] flex justify-between gap-3">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="px-5 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 font-bold transition text-sm"
          >
            CANCEL
          </button>
          <button
            onClick={handleSave}
            className="bg-[#FFE600] hover:bg-[#ebd300] text-black font-black px-8 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(255,230,0,0.4)] tracking-wider"
          >
            SAVE SETTINGS
          </button>
        </div>

      </div>
    </div>
  );
}
