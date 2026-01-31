
import React, { useState } from 'react';

interface SetupProps {
  onStart: (age: number, concept: string) => void;
}

const CONCEPTS = [
  "Needs vs Wants",
  "The Power of Saving",
  "Opportunity Cost (Choices)",
  "Earning Money",
  "Budgeting Basics",
  "Sharing and Giving"
];

const Setup: React.FC<SetupProps> = ({ onStart }) => {
  const [age, setAge] = useState<number>(7);
  const [concept, setConcept] = useState<string>(CONCEPTS[0]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div className="space-y-2">
        <h1 className="text-5xl font-black text-pink-500 drop-shadow-sm">Hi, I'm Piggy!</h1>
        <p className="text-xl text-stone-500 font-medium">What shall we learn today?</p>
      </div>

      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-left">
          <label className="text-pink-600 font-bold ml-2">How old are you?</label>
          <div className="flex justify-between bg-pink-50 rounded-2xl p-2 border-2 border-pink-100">
            {[7, 8, 9, 10, 11, 12].map(a => (
              <button
                key={a}
                onClick={() => setAge(a)}
                className={`w-10 h-10 rounded-xl font-bold transition-all ${
                  age === a ? 'bg-pink-500 text-white shadow-md scale-110' : 'text-pink-300 hover:bg-pink-100'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-left">
          <label className="text-pink-600 font-bold ml-2">Pick a topic:</label>
          <div className="grid grid-cols-2 gap-3">
            {CONCEPTS.map(c => (
              <button
                key={c}
                onClick={() => setConcept(c)}
                className={`p-3 rounded-2xl text-sm font-bold border-2 transition-all ${
                  concept === c 
                    ? 'border-pink-500 bg-pink-500 text-white shadow-md' 
                    : 'border-pink-100 text-pink-400 bg-white hover:border-pink-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={() => onStart(age, concept)}
        className="px-12 py-4 bg-pink-500 text-white text-xl font-black rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-105 active:scale-95"
      >
        Start Adventure!
      </button>
    </div>
  );
};

export default Setup;
