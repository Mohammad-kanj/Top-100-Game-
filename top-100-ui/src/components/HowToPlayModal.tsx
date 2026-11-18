import React, { useState } from 'react';
import { soundFx } from '../soundFx';

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'objective' | 'modes' | 'tips'>('objective');

  const tabs: Array<{ id: 'objective' | 'modes' | 'tips'; label: string }> = [
    { id: 'objective', label: 'OBJECTIVE' },
    { id: 'modes', label: 'GAME MODES' },
    { id: 'tips', label: 'PRO TIPS' }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
      <div className="balatro-modal rounded-3xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#0d0d0d] border-b-2 border-[#891c1c] p-5 flex items-center justify-between">
          <h2 className="text-xl font-black text-[#fffbd4] tracking-wide uppercase drop-shadow-[0_2px_0_#0d0d0d]">
            How to Play Top 100
          </h2>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-[#891c1c] bg-[#0d0d0d]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onMouseEnter={() => soundFx.playHover()}
              onClick={() => { soundFx.playClick(); setActiveTab(tab.id); }}
              className={`flex-1 py-3 text-xs md:text-sm font-black tracking-wider transition-all border-b-4 cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#ef5368] text-[#fffbd4] bg-[#891c1c]/40 shadow-[inset_0_2px_0_rgba(239,83,104,0.3)]'
                  : 'border-transparent text-[#fffbd4]/70 hover:text-[#fffbd4] hover:bg-[#0a0f23]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-[#fffbd4] leading-relaxed text-sm">
          {activeTab === 'objective' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  The Challenge
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  Every round features a category with a hidden list of the <strong>Top 100 items</strong> (e.g. Highest-Grossing Movies, Best-Selling Games, Fastest Animals).
                </p>
              </div>
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Team Turns
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  Teams rotate taking turns guessing items on the board. Correct guesses flip open that tile, revealing the name and awarding points to the team.
                </p>
              </div>
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Scoring & Deep Cut Bonus
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  We use the <strong>Deep Cut Bonus</strong> scoring system where points awarded equal the rank of the answer (<strong className="text-[#fffbd4]">Points = Rank</strong>). Guessing more obscure or difficult items awards bigger points! For example, finding the <strong className="text-[#fffbd4]">#99 answer gives 99 points</strong>, while the <strong className="text-[#fffbd4]">#1 answer gives 1 point</strong>.
                </p>
                <div className="p-2.5 mt-2.5 bg-[#0d0d0d] border-2 border-[#891c1c] border-b-4 rounded-xl text-center font-black text-[#fffbd4] text-xs shadow-sm">
                  In Multi-Round matches, points carry forward cumulatively across rounds.
                </div>
              </div>
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Winning by Point Threshold
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  The first team to reach the <strong>Winning Point Threshold</strong> (e.g. 500 points, configurable in Settings) wins the game immediately! When the game ends, all remaining unanswered tiles are revealed so players can inspect the full board.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'modes' && (
            <div className="space-y-3.5">
              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Single Round & Multi-Round Tournament
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  Play head-to-head on a single board, or battle across 2 to 5 categories where points accumulate until a team reaches the target threshold!
                </p>
              </div>

              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Boss Rush Mode
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  One team tests their trivia mastery solo against an overall countdown clock (5 min, 10 min, or 15 min). Guess as many answers as you can before time expires!
                </p>
              </div>

              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Turn Timers
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  Configurable in Settings (30 secs, 60 secs, or 90 secs). Teams must submit their guess before the countdown hits zero. When time runs out, the turn passes to the next team.
                </p>
              </div>

              <div className="p-4 rounded-2xl balatro-card">
                <h3 className="text-sm font-black text-[#ef5368] uppercase tracking-wide mb-1">
                  Turn Limits
                </h3>
                <p className="text-xs text-[#fffbd4]/90 font-medium">
                  Optional cap on the number of guesses each team gets per category (Unlimited, 10, 15, or 20 turns each).
                </p>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-[#ef5368] font-black">Smart Matching:</strong> Minor typos (1 to 2 letters off) are automatically recognized. Leading articles like <em>"The"</em> or <em>"A"</em> can be omitted.
              </div>
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-[#ef5368] font-black">Key Subtitles:</strong> Guessing distinctive subtitles like <em>"Endgame"</em> will match <em>"Avengers: Endgame"</em>.
              </div>
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-[#ef5368] font-black">Sequel Protection:</strong> Guessing a base title like <em>"Resident Evil"</em> will not match <em>"Resident Evil 6"</em>. To guess a sequel, include its number.
              </div>
              <div className="p-3.5 rounded-xl balatro-card">
                <strong className="text-[#ef5368] font-black">Numbers & Roman Numerals:</strong> Both formats work interchangeably (e.g. <em>"GTA 5"</em> = <em>"Grand Theft Auto V"</em>).
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#0d0d0d] border-t-2 border-slate-700 flex justify-end">
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            onMouseEnter={() => soundFx.playHover()}
            className="balatro-btn-blue font-black px-8 py-3 rounded-2xl transition tracking-wider text-sm md:text-base uppercase cursor-pointer text-white shadow-md"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
