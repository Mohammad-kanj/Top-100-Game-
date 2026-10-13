import { useState } from 'react';
import { soundFx } from '../soundFx';

export default function HostOverrideModal({ gameState, onOverride, onClose }) {
  const [selectedAction, setSelectedAction] = useState('reveal');
  const [tileNumber, setTileNumber] = useState('');
  const [targetTeam, setTargetTeam] = useState(0);
  const [scoreDelta, setScoreDelta] = useState(10);
  const [statusMsg, setStatusMsg] = useState('');

  const teams = gameState.teams || [];

  const handleReveal = async () => {
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

  const handleScore = async (delta) => {
    soundFx.playCorrect();
    await onOverride({
      action: 'score',
      team_index: targetTeam,
      delta: delta
    });
    setStatusMsg(`Adjusted ${teams[targetTeam]}'s score by ${delta > 0 ? `+${delta}` : delta}`);
  };

  const handleStrike = async (delta) => {
    soundFx.playClick();
    await onOverride({
      action: 'strike',
      team_index: targetTeam,
      delta: delta
    });
    setStatusMsg(`Adjusted ${teams[targetTeam]}'s strikes by ${delta > 0 ? `+${delta}` : delta}`);
  };

  const handleSkipTurn = async () => {
    soundFx.playClick();
    await onOverride({ action: 'skip_turn' });
    setStatusMsg('Turn passed without penalty.');
  };

  const handleFinishRound = async () => {
    soundFx.playFanfare();
    await onOverride({ action: 'finish_round' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-[#0b0c1e] border-2 border-red-500 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1b0d1e] border-b border-red-500/40 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛡️</span>
            <div>
              <h2 className="text-xl font-black text-red-400 tracking-wider uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]">
                HOST CONTROL CONSOLE
              </h2>
              <div className="text-[11px] font-mono text-gray-400">Secret Hotkey: Ctrl + Shift + H</div>
            </div>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Action Selector */}
        <div className="flex border-b border-[#252254] bg-[#0c0b20]">
          {[
            { id: 'reveal', label: 'REVEAL TILE' },
            { id: 'score', label: 'ADJUST SCORE' },
            { id: 'strike', label: 'FORGIVE STRIKE' },
            { id: 'controls', label: 'ROUND TOOLS' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { soundFx.playClick(); setSelectedAction(tab.id); setStatusMsg(''); }}
              className={`flex-1 py-3 text-xs font-black tracking-wider transition-all border-b-2 ${
                selectedAction === tab.id
                  ? 'border-red-500 text-red-400 bg-red-500/10'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-gray-200 text-sm">
          {statusMsg && (
            <div className="p-2.5 rounded-lg bg-green-500/20 border border-green-500/40 text-green-300 font-bold text-xs text-center animate-in fade-in">
              {statusMsg}
            </div>
          )}

          {/* Reveal Tile Tab */}
          {selectedAction === 'reveal' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Tile Rank to Reveal (1 to 100):
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={tileNumber}
                  onChange={(e) => setTileNumber(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full bg-[#17153b] border border-gray-700 focus:border-red-500 text-white px-4 py-2.5 rounded-xl font-bold outline-none text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Award Points to Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#17153b] border border-gray-700 focus:border-red-500 text-white px-4 py-2.5 rounded-xl font-bold outline-none text-sm"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>{t}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleReveal}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-3 rounded-xl transition shadow-[0_0_15px_rgba(239,68,68,0.4)] tracking-wider uppercase text-sm mt-2"
              >
                MANUALLY REVEAL TILE
              </button>
            </div>
          )}

          {/* Adjust Score Tab */}
          {selectedAction === 'score' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Target Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#17153b] border border-gray-700 focus:border-red-500 text-white px-4 py-2.5 rounded-xl font-bold outline-none text-sm"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {t} (Current: {gameState.scores[idx] || 0} pts)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
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
                    className="bg-[#17153b] hover:bg-red-500/20 border border-gray-700 hover:border-red-500 text-white py-2.5 rounded-xl font-black text-sm transition"
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
                <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                  Target Team:
                </label>
                <select
                  value={targetTeam}
                  onChange={(e) => setTargetTeam(parseInt(e.target.value, 10))}
                  className="w-full bg-[#17153b] border border-gray-700 focus:border-red-500 text-white px-4 py-2.5 rounded-xl font-bold outline-none text-sm"
                >
                  {teams.map((t, idx) => (
                    <option key={idx} value={idx}>
                      {t} (Strikes: {gameState.strikes[idx] || 0})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => handleStrike(-1)}
                  className="flex-1 bg-green-600/30 hover:bg-green-600/50 border border-green-500 text-green-300 py-3 rounded-xl font-black transition text-sm"
                >
                  -1 STRIKE (FORGIVE)
                </button>
                <button
                  type="button"
                  onClick={() => handleStrike(1)}
                  className="flex-1 bg-red-600/30 hover:bg-red-600/50 border border-red-500 text-red-300 py-3 rounded-xl font-black transition text-sm"
                >
                  +1 STRIKE
                </button>
              </div>
            </div>
          )}

          {/* Round Tools */}
          {selectedAction === 'controls' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleSkipTurn}
                className="w-full bg-[#17153b] hover:bg-white/10 border border-gray-600 text-white py-3 rounded-xl font-bold transition text-sm"
              >
                ⏭️ Skip Turn Without Strike
              </button>
              <button
                type="button"
                onClick={handleFinishRound}
                className="w-full bg-red-600/40 hover:bg-red-600/70 border border-red-500 text-red-200 py-3 rounded-xl font-black transition text-sm"
              >
                🏁 Force End Round Now
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#12102e] border-t border-[#252254] flex justify-end">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="px-6 py-2 rounded-xl text-gray-300 hover:bg-white/10 font-bold transition text-sm"
          >
            CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}
