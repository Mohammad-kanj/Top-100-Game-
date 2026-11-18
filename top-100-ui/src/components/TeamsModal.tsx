import React, { useState } from 'react';
import { soundFx } from '../soundFx';

interface TeamsModalProps {
  teams: string[];
  onSave: (teams: string[]) => void;
  onClose: () => void;
}

export default function TeamsModal({ teams, onSave, onClose }: TeamsModalProps): React.JSX.Element {
  const [localTeams, setLocalTeams] = useState<string[]>([...teams]);

  const addTeam = (): void => {
    soundFx.playClick();
    if (localTeams.length < 8) {
      setLocalTeams([...localTeams, `Team ${localTeams.length + 1}`]);
    }
  };

  const removeTeam = (index: number): void => {
    soundFx.playClick();
    if (localTeams.length > 1) {
      setLocalTeams(localTeams.filter((_, i) => i !== index));
    }
  };

  const updateName = (index: number, name: string): void => {
    const updated = [...localTeams];
    updated[index] = name;
    setLocalTeams(updated);
  };

  const handleSave = (): void => {
    soundFx.playCorrect();
    const cleaned = localTeams.map((t, idx) => t.trim() || `Team ${idx + 1}`);
    onSave(cleaned);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="balatro-modal rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0d0d0d] border-b-2 border-[#891c1c] p-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_2px_0_#0d0d0d]">
            Team Setup
          </h2>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            onMouseEnter={() => soundFx.playHover()}
            className="text-[#fffbd4]/70 hover:text-[#fffbd4] hover:bg-[#891c1c]/30 rounded-xl w-8 h-8 flex items-center justify-center transition font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-3 text-[#fffbd4]">
          <div className="text-xs text-[#fffbd4] font-black uppercase tracking-wider mb-2">
            Participating Teams (1 to 8 teams)
          </div>

          {localTeams.map((team, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-7 text-center font-black text-xs text-[#ef5368]">
                #{idx + 1}
              </span>
              <input
                type="text"
                value={team}
                onChange={(e) => updateName(idx, e.target.value)}
                placeholder={`Team ${idx + 1}`}
                maxLength={24}
                className="flex-1 bg-[#0d0d0d] border-2 border-[#891c1c] border-b-4 border-b-[#0a0f23] focus:border-[#fffbd4] text-[#fffbd4] placeholder-[#fffbd4]/40 px-3.5 py-2.5 rounded-xl font-black outline-none text-sm transition shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
              />
              {localTeams.length > 1 && (
                <button
                  type="button"
                  onMouseEnter={() => soundFx.playHover()}
                  onClick={() => removeTeam(idx)}
                  className="balatro-btn-red text-white w-9 h-9 rounded-xl font-black transition flex items-center justify-center cursor-pointer text-xs"
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
              onMouseEnter={() => soundFx.playHover()}
              onClick={addTeam}
              className="w-full mt-2 py-3 rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#fffbd4] text-[#fffbd4] font-black text-xs sm:text-sm uppercase tracking-wider bg-[#0d0d0d] hover:bg-slate-800 transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              + Add Another Team
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d0d0d] border-t-2 border-slate-700 flex justify-between gap-3">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
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
            Save Teams
          </button>
        </div>

      </div>
    </div>
  );
}
