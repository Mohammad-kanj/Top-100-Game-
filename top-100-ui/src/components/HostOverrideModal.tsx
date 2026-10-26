import React, { useState } from 'react';
import { soundFx } from '../soundFx';
import { GameState, HostOverrideData } from '../types';

interface HostOverrideModalProps {
  gameState: GameState;
  onOverride: (data: HostOverrideData) => Promise<void>;
  onClose: () => void;
}

export default function HostOverrideModal({ gameState, onOverride, onClose }: HostOverrideModalProps): React.JSX.Element {
  const [selectedAction, setSelectedAction] = useState<'reveal' | 'score' | 'controls'>('reveal');
  const [tileNumber, setTileNumber] = useState<string>('');
  const [targetTeam, setTargetTeam] = useState<number>(0);
  const [statusMsg, setStatusMsg] = useState<string>('');

  const teams = gameState.teams || [];

  const handleReveal = async (): Promise<void> => {
    const rank = parseInt(tileNumber, 10);
    if (isNaN(rank) || rank < 1 || rank > 100) {
      setStatusMsg('Please enter a rank between 1 and 100');
      return;
    }
    const idx = rank - 1;
    soundFx.playCorrect();
    await onOverride({
      action: 'reveal',
      index: idx,
      team_index: targetTeam
    });
    setStatusMsg(`Tile #${rank} revealed for ${teams[targetTeam] || 'Host'}`);
    setTileNumber('');
  };

  const handleScore = async (delta: number): Promise<void> => {
    soundFx.playCorrect();
    await onOverride({
      action: 'score',
      team_index: targetTeam,
      delta: delta
    });
    setStatusMsg(`Adjusted ${teams[targetTeam]}'s score by ${delta > 0 ? `+${delta}` : delta}`);
  };

  const handleSkipTurn = async (): Promise<void> => {
    soundFx.playClick();
    await onOverride({ action: 'skip_turn' });
    setStatusMsg('Turn passed.');
  };

  const handleFinishRound = async (): Promise<void> => {
    soundFx.playFanfare();
    await onOverride({ action: 'finish_round' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="balatro-modal rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#003c5a] border-b-2 border-[#0071b4] p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_0_#0c1079]">
              Host Console
            </h2>
            <div className="text-[11px] font-mono text-[#9cf6ff]/80 font-bold">Shortcut: Ctrl + Shift + H</div>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-[#9cf6ff] hover:text-[#62f6bd] hover:bg-white/10 rounded-xl w-8 h-8 flex items-center justify-center transition font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Selector */}
        <div className="flex border-b-2 border-[#0071b4] bg-[#0c1079]">
          {(['reveal', 'score', 'controls'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { soundFx.playClick(); setSelectedAction(tab); setStatusMsg(''); }}
              className={`flex-1 py-3 text-xs font-black tracking-wider transition-all border-b-4 cursor-pointer ${
                selectedAction === tab
                  ? 'border-[#62f6bd] text-[#62f6bd] bg-[#3120cd] shadow-[inset_0_2px_0_rgba(98,246,189,0.3)]'
                  : 'border-transparent text-[#6ad6cd] hover:text-white'
              }`}
            >
              {tab === 'reveal' ? 'REVEAL TILE' : tab === 'score' ? 'ADJUST SCORE' : 'ROUND TOOLS'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-[#9cf6ff] text-sm">
          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-[#003c5a] border-2 border-[#0071b4] text-[#62f6bd] font-black text-xs text-center animate-in fade-in shadow-[0_2px_0_#0c1079]">
              {statusMsg}
            </div>
          )}

          {/* Reveal Tile Tab */}
          {selectedAction === 'reveal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#9cf6ff] uppercase mb-1">
                  Tile Rank to Reveal (1 to 100):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tileNumber}
                  onChange={(e) => setTileNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-[#003c5a] border-2 border-[#0071b4] border-b-4 border-b-[#0c1079] focus:border-[#62f6bd] text-[#62f6bd] px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(12,16,121,0.5)]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-[#9cf6ff] uppercase mb-1">
                  Award Points to Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#003c5a] border-2 border-[#0071b4] border-b-4 border-b-[#0c1079] focus:border-[#62f6bd] text-[#62f6bd] px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(12,16,121,0.5)]"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleReveal}
                className="w-full balatro-btn-blue text-white font-black py-3 rounded-xl transition tracking-wide uppercase text-xs cursor-pointer mt-2"
              >
                Reveal Tile
              </button>
            </div>
          )}

          {/* Adjust Score Tab */}
          {selectedAction === 'score' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-[#9cf6ff] uppercase mb-1">
                  Target Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#003c5a] border-2 border-[#0071b4] border-b-4 border-b-[#0c1079] focus:border-[#62f6bd] text-[#62f6bd] px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(12,16,121,0.5)]"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {t} (Current: {gameState.scores[idx] || 0} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '+50 Pts', d: 50 },
                  { label: '+25 Pts', d: 25 },
                  { label: '+10 Pts', d: 10 },
                  { label: '-10 Pts', d: -10 }
                ].map(({ label, d }) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleScore(d)}
                    className="balatro-btn-dark py-3 rounded-xl font-black text-xs text-[#9cf6ff] hover:text-[#62f6bd] transition cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Round Tools */}
          {selectedAction === 'controls' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSkipTurn}
                className="w-full balatro-btn-dark py-3 rounded-xl font-black transition text-xs cursor-pointer text-[#9cf6ff]"
              >
                Skip Turn
              </button>
              <button
                type="button"
                onClick={handleFinishRound}
                className="w-full balatro-btn-red text-white py-3 rounded-xl font-black transition text-xs cursor-pointer"
              >
                Force End Round Now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#003c5a] border-t-2 border-[#0071b4] flex justify-end">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="balatro-btn-primary px-6 py-2.5 rounded-xl text-[#003c5a] font-black transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
