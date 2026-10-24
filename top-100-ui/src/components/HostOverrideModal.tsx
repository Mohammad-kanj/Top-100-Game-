import React, { useState } from 'react';
import { soundFx } from '../soundFx';
import { GameState, HostOverrideData } from '../types';

interface HostOverrideModalProps {
  gameState: GameState;
  onOverride: (data: HostOverrideData) => Promise<void>;
  onClose: () => void;
}

export default function HostOverrideModal({ gameState, onOverride, onClose }: HostOverrideModalProps): React.JSX.Element {
  const [selectedAction, setSelectedAction] = useState<'reveal' | 'score' | 'strike' | 'controls'>('reveal');
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

  const handleStrike = async (delta: number): Promise<void> => {
    soundFx.playClick();
    await onOverride({
      action: 'strike',
      team_index: targetTeam,
      delta: delta
    });
    setStatusMsg(`Adjusted ${teams[targetTeam]}'s strikes by ${delta > 0 ? `+${delta}` : delta}`);
  };

  const handleSkipTurn = async (): Promise<void> => {
    soundFx.playClick();
    await onOverride({ action: 'skip_turn' });
    setStatusMsg('Turn passed without penalty.');
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
        <div className="bg-[#1a1442] border-b-2 border-[#2b2164] p-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_0_#0d0924]">
              Host Console
            </h2>
            <div className="text-[11px] font-mono text-purple-300/80 font-bold">Shortcut: Ctrl + Shift + H</div>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-purple-300 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 flex items-center justify-center transition font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Action Selector */}
        <div className="flex border-b-2 border-[#2b2164] bg-[#140f35]">
          {(['reveal', 'score', 'strike', 'controls'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { soundFx.playClick(); setSelectedAction(tab); setStatusMsg(''); }}
              className={`flex-1 py-3 text-xs font-black tracking-wider transition-all border-b-4 cursor-pointer ${
                selectedAction === tab
                  ? 'border-purple-400 text-white bg-[#261c5c] shadow-[inset_0_2px_0_rgba(255,255,255,0.2)]'
                  : 'border-transparent text-purple-200/60 hover:text-white'
              }`}
            >
              {tab === 'reveal' ? 'REVEAL TILE' : tab === 'score' ? 'ADJUST SCORE' : tab === 'strike' ? 'STRIKES' : 'ROUND TOOLS'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-purple-100 text-sm">
          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-blue-950/60 border-2 border-blue-600/70 text-blue-200 font-black text-xs text-center animate-in fade-in shadow-[0_2px_0_rgba(0,0,0,0.4)]">
              {statusMsg}
            </div>
          )}

          {/* Reveal Tile Tab */}
          {selectedAction === 'reveal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-purple-300 uppercase mb-1">
                  Tile Rank to Reveal (1 to 100):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tileNumber}
                  onChange={(e) => setTileNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-[#130f2f] border-2 border-[#3d2c70] border-b-4 border-b-[#1f153f] focus:border-purple-400 text-white px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-purple-300 uppercase mb-1">
                  Award Points to Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#130f2f] border-2 border-[#3d2c70] border-b-4 border-b-[#1f153f] focus:border-purple-400 text-white px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleReveal}
                className="w-full balatro-btn-purple text-white font-black py-3 rounded-xl transition tracking-wide uppercase text-xs cursor-pointer mt-2"
              >
                Reveal Tile
              </button>
            </div>
          )}

          {/* Adjust Score Tab */}
          {selectedAction === 'score' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-purple-300 uppercase mb-1">
                  Target Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#130f2f] border-2 border-[#3d2c70] border-b-4 border-b-[#1f153f] focus:border-purple-400 text-white px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
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
                    className="balatro-btn-dark py-3 rounded-xl font-black text-xs text-white transition cursor-pointer"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Forgive / Adjust Strike Tab */}
          {selectedAction === 'strike' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-purple-300 uppercase mb-1">
                  Target Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#130f2f] border-2 border-[#3d2c70] border-b-4 border-b-[#1f153f] focus:border-purple-400 text-white px-3.5 py-2.5 rounded-xl font-black outline-none text-sm shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {t} (Strikes: {gameState.strikes[idx] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => handleStrike(-1)}
                  className="flex-1 balatro-btn-blue text-white py-3 rounded-xl font-black transition text-xs cursor-pointer"
                >
                  -1 Strike (Forgive)
                </button>
                <button
                  type="button"
                  onClick={() => handleStrike(1)}
                  className="flex-1 balatro-btn-purple bg-rose-600 hover:bg-rose-500 border-rose-950 border-b-rose-950 shadow-[0_4px_0_#3f0714] text-white py-3 rounded-xl font-black transition text-xs cursor-pointer"
                >
                  +1 Strike
                </button>
              </div>
            </div>
          )}

          {/* Round Tools */}
          {selectedAction === 'controls' && (
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={handleSkipTurn}
                className="w-full balatro-btn-dark py-3 rounded-xl font-black transition text-xs cursor-pointer"
              >
                Skip Turn Without Strike
              </button>
              <button
                type="button"
                onClick={handleFinishRound}
                className="w-full balatro-btn-purple bg-rose-600 hover:bg-rose-500 border-rose-950 border-b-rose-950 shadow-[0_4px_0_#3f0714] text-white py-3 rounded-xl font-black transition text-xs cursor-pointer"
              >
                Force End Round Now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1442] border-t-2 border-[#2b2164] flex justify-end">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="balatro-btn-dark px-6 py-2.5 rounded-xl text-purple-200 font-black transition text-sm cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
