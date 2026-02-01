
import React from 'react';
import { Badge } from '../types';

interface BadgeCollectionProps {
  badges: Badge[];
  onBack: () => void;
}

const BadgeCollection: React.FC<BadgeCollectionProps> = ({ badges, onBack }) => {
  return (
    <div className="flex-1 flex flex-col p-8 bg-gradient-to-b from-white to-pink-50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-4xl font-black text-pink-600 drop-shadow-sm">Money Skills</h2>
          <p className="text-stone-400 font-bold mt-1">Your learning credential wallet</p>
        </div>
        <button
          onClick={onBack}
          className="bg-white px-6 py-2 rounded-2xl text-pink-500 font-bold border-2 border-pink-100 hover:bg-pink-50 shadow-sm"
        >
          Back to Stories
        </button>
      </div>

      {badges.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-32 h-32 bg-stone-100 rounded-full flex items-center justify-center grayscale opacity-50">
            <span className="text-6xl">🎓</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-stone-700">Start your collection!</h3>
            <p className="text-stone-500 max-w-sm">Complete stories to earn Money Skills for your Piggy Wallet.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="bg-white p-5 rounded-[2rem] border-4 border-pink-50 shadow-lg hover:scale-105 transition-all relative group badge-glow flex flex-col items-center"
            >
              <div className="w-full aspect-square bg-gradient-to-br from-pink-50 to-white rounded-[1.5rem] flex items-center justify-center text-6xl mb-3 relative overflow-hidden ring-4 ring-pink-50/50">
                <div className="absolute inset-0 bg-pink-400/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="floating">{badge.image}</span>
              </div>

              <div className="text-center w-full space-y-1">
                <div className="bg-pink-100 text-pink-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider inline-block mb-1">
                  Skill: {badge.skillType || 'Money Basics'}
                </div>
                <h4 className="text-lg font-black text-stone-700 leading-tight">{badge.name}</h4>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">{badge.concept}</p>
                <div className="pt-2 border-t border-pink-50 mt-2 w-full">
                  <p className="text-[10px] text-stone-400 font-medium">Earned {badge.dateEarned}</p>
                </div>
              </div>

              {badge.mintAddress && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full shadow-sm">
                  VALIDATED
                </div>
              )}
            </div>
          ))}

          {/* Locked Slots */}
          {Array.from({ length: Math.max(0, 3 - badges.length) }).map((_, i) => (
            <div key={`locked-${i}`} className="bg-stone-50/50 p-6 rounded-[2.5rem] border-4 border-dashed border-stone-100 flex flex-col items-center justify-center space-y-4 opacity-50">
              <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center text-3xl">
                🔒
              </div>
              <p className="text-stone-300 font-bold text-xs uppercase tracking-widest">Locked</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12 p-6 bg-white/50 backdrop-blur rounded-3xl border border-pink-100 flex items-center gap-4">
        <div className="w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center text-2xl shadow-sm">🐷</div>
        <div>
          <p className="text-pink-600 font-black text-sm">Piggy Tip!</p>
          <p className="text-stone-600 text-xs">These badges show the world you're becoming a money master! Keep learning to fill your shelf.</p>
        </div>
      </div>
    </div>
  );
};

export default BadgeCollection;
