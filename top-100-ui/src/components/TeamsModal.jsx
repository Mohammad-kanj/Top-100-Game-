import { useState } from 'react';
import { soundFx } from '../soundFx';

export default function TeamsModal({ teams, onSave, onClose }) {
  const [localTeams, setLocalTeams] = useState([...teams]);

  const addTeam = () => {
    soundFx.playClick();
    if (localTeams.length < 8) {
      setLocalTeams([...localTeams, `Team ${localTeams.length + 1}`]);
    }
  };

  const removeTeam = (index) => {
    soundFx.playClick();
    if (localTeams.length > 1) {
      setLocalTeams(localTeams.filter((_, i) => i !== index));
    }
  };

  const updateName = (index, name) => {
    const updated = [...localTeams];
    updated[index] = name;
    setLocalTeams(updated);
  };

  const handleSave = () => {
    soundFx.playCorrect();
    const cleaned = localTeams.map((t, idx) => t.trim() || `Team ${idx + 1}`);
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0f0e26] border-2 border-[#00F0FF] rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.35)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#17153b] border-b border-[#00F0FF]/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👥</span>
            <h2 className="text-2xl font-black text-[#00F0FF] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">
              TEAM SETUP
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
        <div className="p-6 overflow-y-auto space-y-3">
          <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-2">
            Configure Participating Teams (1 - 8 teams)
          </div>

          {localTeams.map((team, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-7 text-center font-black text-sm text-[#00F0FF]">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={team}
                onChange={(e) => updateName(idx, e.target.value)}
                placeholder={`Team ${idx + 1}`}
                maxLength={24}
                className="flex-1 bg-[#17153b] border border-[#2c2866] focus:border-[#00F0FF] text-white px-3.5 py-2.5 rounded-xl font-bold outline-none shadow-inner text-sm transition"
              />
              {localTeams.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeTeam(idx)}
                  className="bg-red-500/20 hover:bg-red-500/40 text-red-400 border border-red-500/40 w-10 h-10 rounded-xl font-black transition flex items-center justify-center"
                  title="Remove Team"
                >
                  ✕
                </button>
              )}
            </div>
          ))}

          {localTeams.length < 8 && (
            <button
              type="button"
              onClick={addTeam}
              className="w-full mt-2 py-2.5 rounded-xl border border-dashed border-[#00F0FF]/50 hover:border-[#00F0FF] text-[#00F0FF] font-black text-xs uppercase tracking-wider bg-[#00F0FF]/5 hover:bg-[#00F0FF]/15 transition flex items-center justify-center gap-2"
            >
              <span>➕</span> Add Another Team
            </button>
          )}
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
            className="bg-[#00F0FF] hover:bg-[#00d0df] text-black font-black px-8 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,240,255,0.4)] tracking-wider"
          >
            SAVE TEAMS
          </button>
        </div>

      </div>
    </div>
  );
}
