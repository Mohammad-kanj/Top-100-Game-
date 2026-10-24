import React, { useState } from 'react';
import { soundFx } from '../soundFx';

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'objective' | 'scoring' | 'modes' | 'tips'>('objective');

  const tabs: Array<{ id: 'objective' | 'scoring' | 'modes' | 'tips'; label: string }> = [
    { id: 'objective', label: 'OBJECTIVE' },
    { id: 'scoring', label: 'SCORING' },
    { id: 'modes', label: 'MODES & STRIKES' },
    { id: 'tips', label: 'PRO TIPS' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="balatro-modal rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#1a1442] border-b-2 border-[#2b2164] p-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-white tracking-wide uppercase drop-shadow-[0_2px_0_#0d0924]">
            How to Play Top 100
          </h2>
          <button 
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="text-purple-300 hover:text-white hover:bg-white/10 rounded-xl w-8 h-8 flex items-center justify-center transition font-black text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[#2b2164] bg-[#140f35]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { soundFx.playClick(); setActiveTab(tab.id); }}
              className={`flex-1 py-3 text-xs md:text-sm font-black tracking-wider transition-all border-b-4 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-purple-400 text-white bg-[#261c5c] shadow-[inset_0_2px_0_rgba(255,255,255,0.2)]'
                  : 'border-transparent text-purple-200/60 hover:text-white hover:bg-[#1d164a]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-purple-100 leading-relaxed text-sm">
          {activeTab === 'objective' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f0724]">
                  The Challenge
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Every round features a category with a hidden list of the <strong>Top 100 items</strong> (e.g. Highest-Grossing Movies, Best-Selling Games, Fastest Animals).
                </p>
              </div>
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f0724]">
                  Team Turns
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Teams rotate taking turns guessing items on the board. Correct guesses flip open that tile, revealing the name and awarding points to the team.
                </p>
              </div>
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f0724]">
                  Winning
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  In a <strong>Single Round</strong>, the team with the most points when the round ends wins. In a <strong>Multi-Round Tournament</strong> (2 to 5 rounds), points accumulate across all rounds to crown the champion.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'scoring' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f0724]">
                  Top Answer Bonus (Default)
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Points are inversely scaled: <strong className="text-white">Points = 101 - Rank</strong>.
                </p>
                <ul className="list-disc pl-5 mt-2 space-y-1 text-xs text-purple-200/80 font-medium">
                  <li>Rank #1 (the top item) awards <strong className="text-white font-black">100 points</strong>.</li>
                  <li>Rank #50 awards <strong className="text-white font-black">51 points</strong>.</li>
                  <li>Rank #100 awards <strong className="text-white font-black">1 point</strong>.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f0724]">
                  Deep Cut Bonus (Setting)
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Rewards knowing obscure trivia: <strong className="text-white">Points = Rank</strong> (e.g. Rank #100 awards 100 points, Rank #1 awards 1 point).
                </p>
              </div>

              <div className="p-3 bg-[#1e154a] border-2 border-[#36257e] border-b-4 rounded-xl text-center font-black text-purple-200 text-xs shadow-sm">
                In Multi-Round matches, points carry forward cumulatively.
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-rose-300 uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#3f0714]">
                  Strike & Elimination Mode
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Incorrect guesses add a <strong className="text-rose-400 font-black">Strike (X)</strong>. Accumulating 3 strikes eliminates that team from the current round while remaining teams continue.
                </p>
              </div>

              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-blue-300 uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f172a]">
                  Turn Timers
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  If enabled in Settings (15s, 30s, or 60s), teams must submit their guess before the countdown hits zero. When time runs out, the turn is passed and a strike is recorded.
                </p>
              </div>

              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-1 drop-shadow-[0_1px_0_#0f0724]">
                  Turn Limits
                </h3>
                <p className="text-xs text-purple-200/80 font-medium">
                  Optional cap on the number of guesses each team gets per category (e.g., 5 or 10 turns each).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-white font-black">Smart Matching:</strong> Minor typos (1 to 2 letters off) are automatically recognized. Leading articles like <em>"The"</em> or <em>"A"</em> can be omitted.
              </div>
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-white font-black">Key Subtitles:</strong> Guessing distinctive subtitles like <em>"Endgame"</em> will match <em>"Avengers: Endgame"</em>.
              </div>
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-white font-black">Sequel Protection:</strong> Guessing a base title like <em>"Resident Evil"</em> will not match <em>"Resident Evil 6"</em>. To guess a sequel, include its number.
              </div>
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-white font-black">Numbers & Roman Numerals:</strong> Both formats work interchangeably (e.g. <em>"GTA 5"</em> = <em>"Grand Theft Auto V"</em>).
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#1a1442] border-t-2 border-[#2b2164] flex justify-end">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="balatro-btn-white font-black px-7 py-2.5 rounded-xl transition tracking-wide text-sm cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
