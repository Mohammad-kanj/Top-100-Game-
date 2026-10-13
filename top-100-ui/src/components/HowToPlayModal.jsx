import { useState } from 'react';
import { soundFx } from '../soundFx';

export default function HowToPlayModal({ onClose }) {
  const [activeTab, setActiveTab] = useState('objective');

  const tabs = [
    { id: 'objective', label: 'OBJECTIVE' },
    { id: 'scoring', label: 'SCORING' },
    { id: 'modes', label: 'MODES & STRIKES' },
    { id: 'tips', label: 'PRO TIPS' }
  ];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="bg-[#0f0e26] border-2 border-[#00F0FF] rounded-2xl w-full max-w-2xl overflow-hidden shadow-[0_0_40px_rgba(0,240,255,0.35)] flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#17153b] border-b border-[#00F0FF]/30 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🎮</span>
            <h2 className="text-2xl font-black text-[#00F0FF] tracking-wider uppercase drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
              HOW TO PLAY TOP 100
            </h2>
          </div>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-gray-400 hover:text-white hover:bg-white/10 rounded-lg p-2 transition font-bold text-xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#252254] bg-[#0c0b20]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { soundFx.playClick(); setActiveTab(tab.id); }}
              className={`flex-1 py-3 text-xs md:text-sm font-black tracking-wider transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#FF007F] text-[#FF007F] bg-[#1a173d] shadow-[0_4px_12px_rgba(255,0,127,0.3)]'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-gray-200 leading-relaxed text-sm md:text-base">
          {activeTab === 'objective' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#00F0FF]/20">
                <h3 className="text-lg font-black text-[#FFE600] mb-1">🎯 The Challenge</h3>
                <p>
                  Every round features a category with a hidden list of the <strong>Top 100 items</strong> (e.g. Highest-Grossing Movies, Best-Selling Games, Fastest Animals).
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#00F0FF]/20">
                <h3 className="text-lg font-black text-[#00F0FF] mb-1">👥 Team Turns</h3>
                <p>
                  Teams rotate taking turns guessing items on the board. Correct guesses flip open that tile, revealing the name and awarding points to the team!
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#00F0FF]/20">
                <h3 className="text-lg font-black text-[#FF007F] mb-1">🏆 Winning</h3>
                <p>
                  In a <strong>Single Round</strong>, the team with the most points when the round ends wins! In a <strong>Multi-Round Tournament</strong> (2–5 rounds), points accumulate across all rounds to crown the champion!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#FFE600]/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">⭐</span>
                  <h3 className="text-lg font-black text-[#FFE600]">Top Answer Bonus (Default)</h3>
                </div>
                <p>
                  Points are inversely scaled: <strong className="text-white">Points = 101 - Rank</strong>.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs md:text-sm text-gray-300">
                  <li>Rank #1 (the biggest item) awards <strong className="text-[#FFE600]">100 points</strong>.</li>
                  <li>Rank #50 awards <strong className="text-[#FFE600]">51 points</strong>.</li>
                  <li>Rank #100 awards <strong className="text-[#FFE600]">1 point</strong>.</li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#00F0FF]/30">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">💡</span>
                  <h3 className="text-lg font-black text-[#00F0FF]">Deep Cut Bonus (Setting)</h3>
                </div>
                <p>
                  Rewards knowing obscure trivia: <strong className="text-white">Points = Rank</strong> (e.g. Rank #100 awards 100 points, Rank #1 awards 1 point).
                </p>
              </div>

              <div className="p-3 bg-[#FF007F]/15 border border-[#FF007F]/40 rounded-xl text-center font-bold text-[#FF007F] text-xs">
                ⚡ In Multi-Round matches, points carry forward cumulatively!
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-red-500/30">
                <h3 className="text-lg font-black text-red-400 mb-1">❌ Strike & Elimination Mode</h3>
                <p>
                  Incorrect guesses add a <strong className="text-red-400">Strike (X)</strong>. Accumulating 3 strikes eliminates that team from the current round! The remaining teams continue until round completion.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#00F0FF]/30">
                <h3 className="text-lg font-black text-[#00F0FF] mb-1">⏱️ Turn Timers</h3>
                <p>
                  If enabled in Settings (15s, 30s, or 60s), teams must submit their guess before the countdown hits zero. When time runs out, the turn is passed and a strike is recorded.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#17153b]/80 border border-[#FFE600]/30">
                <h3 className="text-lg font-black text-[#FFE600] mb-1">🔄 Turn Limits</h3>
                <p>
                  Optional cap on the number of guesses each team gets per category (e.g., 5 or 10 turns each).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#17153b]/80 border border-[#00F0FF]/20">
                <strong className="text-[#00F0FF]">🔡 Smart Fuzzy Matching:</strong> Minor typos (1–2 letters off) are automatically corrected! Articles like <em>"The"</em> or <em>"A"</em> can be omitted.
              </div>
              <div className="p-3.5 rounded-xl bg-[#17153b]/80 border border-[#FF007F]/20">
                <strong className="text-[#FF007F]">🎬 Key Subtitles:</strong> Guessing distinctive subtitles like <em>"Endgame"</em> will match <em>"Avengers: Endgame"</em>.
              </div>
              <div className="p-3.5 rounded-xl bg-[#17153b]/80 border border-[#FFE600]/20">
                <strong className="text-[#FFE600]">🎮 Sequel Protection:</strong> Guessing a base title like <em>"Resident Evil"</em> will <strong>never</strong> match <em>"Resident Evil 6"</em>. To get a sequel, include its number!
              </div>
              <div className="p-3.5 rounded-xl bg-[#17153b]/80 border border-purple-500/20">
                <strong className="text-purple-400">🔢 Numbers & Roman Numerals:</strong> Both work interchangeably (e.g. <em>"GTA 5"</em> = <em>"Grand Theft Auto V"</em>).
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#12102e] border-t border-[#252254] flex justify-end">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="bg-[#00F0FF] hover:bg-[#00d0df] text-black font-black px-6 py-2.5 rounded-xl transition shadow-[0_0_15px_rgba(0,240,255,0.4)] tracking-wider"
          >
            GOT IT!
          </button>
        </div>

      </div>
    </div>
  );
}
