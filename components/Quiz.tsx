
import React, { useState } from 'react';
import { KnowledgeCheck } from '../types';

interface QuizProps {
  questions: KnowledgeCheck[];
  onComplete: () => void;
  recap: { summary: string[], lesson: string };
  isMinting?: boolean;
}

const Quiz: React.FC<QuizProps> = ({ questions, onComplete, recap, isMinting }) => {
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 for Recap screen
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const handleAnswer = (id: string) => {
    if (isCorrect !== null) return;
    setSelectedId(id);
    const correct = id === questions[currentIndex].correct_answer;
    setIsCorrect(correct);
  };

  const handleNext = () => {
    setSelectedId(null);
    setIsCorrect(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  if (currentIndex === -1) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 text-center">
        <div className="text-6xl">✨</div>
        <h2 className="text-4xl font-black text-pink-600">What a Great Story!</h2>
        <div className="bg-pink-50 p-8 rounded-3xl border-2 border-pink-100 max-w-xl">
          <p className="text-xl text-stone-600 font-bold mb-4">Quick Recap:</p>
          <ul className="text-left space-y-3">
            {recap.summary.map((s, i) => (
              <li key={i} className="flex items-start gap-2 text-stone-500">
                <span className="text-pink-500">●</span> {s}
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 bg-white rounded-2xl border border-pink-200">
            <p className="text-pink-600 font-black">Today's Lesson:</p>
            <p className="text-stone-700 font-medium italic">{recap.lesson}</p>
          </div>
        </div>
        <button
          onClick={handleNext}
          className="px-12 py-4 bg-pink-500 text-white text-xl font-black rounded-full shadow-lg hover:bg-pink-600 transition-all"
        >
          Check Your Knowledge!
        </button>
      </div>
    );
  }

  const q = questions[currentIndex];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8">
      <div className="text-center space-y-2">
        <span className="text-pink-400 font-bold uppercase tracking-wider">Question {currentIndex + 1} of {questions.length}</span>
        <h2 className="text-3xl font-black text-stone-800">{q.question}</h2>
      </div>

      <div className="w-full max-w-md space-y-4">
        {q.choices.map(choice => (
          <button
            key={choice.id}
            onClick={() => handleAnswer(choice.id)}
            className={`w-full p-6 text-left rounded-2xl text-xl font-bold border-4 transition-all ${
              selectedId === choice.id
                ? isCorrect ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
                : isCorrect !== null && choice.id === q.correct_answer 
                  ? 'bg-green-50 border-green-500 text-green-700'
                  : 'bg-white border-pink-50 text-stone-600 hover:border-pink-200'
            }`}
          >
            <span className="inline-block w-8">{choice.id}.</span> {choice.text}
          </button>
        ))}
      </div>

      {isCorrect !== null && (
        <div className={`w-full max-w-md p-6 rounded-2xl border-2 text-center animate-bounce ${isCorrect ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'}`}>
          <p className="font-black text-lg mb-1">{isCorrect ? 'Correct! 🌟' : 'Not quite! 🐷'}</p>
          <p className="font-medium text-sm">{q.explanation}</p>
        </div>
      )}

      {isCorrect !== null && (
        <button
          onClick={handleNext}
          disabled={isMinting}
          className={`px-12 py-4 text-white text-xl font-black rounded-full shadow-lg transition-all ${isMinting ? 'bg-stone-400 cursor-not-allowed' : 'bg-stone-800 hover:bg-stone-900'}`}
        >
          {isMinting ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Minting Your Badge...
            </span>
          ) : (
            currentIndex === questions.length - 1 ? 'Get Your Reward!' : 'Next Question'
          )}
        </button>
      )}
    </div>
  );
};

export default Quiz;
