import React, { useState, useEffect } from 'react';
import { AppState, StoryData, Badge, User } from './types';
import { generateStory } from './services/gemini';
import { getWalletAddress, mintBadgeOnChain, getBadgeMetadata } from './services/solana';
import { storyStorage } from './services/storage';
import { authService } from './services/auth';
import Auth from './components/Auth';
import Setup from './components/Setup';
import StoryBook from './components/StoryBook';
import PiggyTalk from './components/PiggyTalk';
import Quiz from './components/Quiz';
import ParentCorner from './components/ParentCorner';
import BadgeCollection from './components/BadgeCollection';
import { PigLoading, PigSuccess } from './components/Mascot';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(AppState.AUTH);
  const [user, setUser] = useState<User | null>(null);
  const [story, setStory] = useState<StoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isMinting, setIsMinting] = useState(false);

  // Load session and wallet
  useEffect(() => {
    const init = async () => {
      const sessionUsername = authService.getSession();
      if (sessionUsername) {
        const userData = await authService.getUser(sessionUsername);
        if (userData) {
          setUser(userData);
          setState(AppState.SETUP);
        }
      }

      const addr = await getWalletAddress();
      if (addr) setWalletAddress(addr);
    };
    init();
  }, []);

  const handleLoginSuccess = async (username: string) => {
    const userData = await authService.getUser(username);
    setUser(userData);
    setState(AppState.SETUP);
  };

  const handleLogOut = () => {
    authService.logOut();
    setUser(null);
    setState(AppState.AUTH);
  };

  const getCacheKey = (age: number, concept: string) => `piggy_v2_${age}_${concept.replace(/\s+/g, '_')}`;

  const handleStartStory = async (age: number, concept: string) => {
    setError(null);
    const cacheKey = getCacheKey(age, concept);
    const cached = await storyStorage.get(cacheKey);

    if (cached) {
      setStory(cached);
      setState(AppState.READING);
      return;
    }

    setState(AppState.GENERATING);
    try {
      const data = await generateStory(age, concept);
      setStory(data);
      await storyStorage.set(cacheKey, data);
      setState(AppState.READING);
    } catch (err) {
      setError("Oops! Piggy is having a little trouble thinking. Let's try again later!");
      setState(AppState.SETUP);
    }
  };

  const updateCachedStory = async (updatedStory: StoryData) => {
    setStory(updatedStory);
    const cacheKey = getCacheKey(parseInt(updatedStory.book.age_band), updatedStory.book.concept);
    await storyStorage.set(cacheKey, updatedStory);
  };

  const handleFinishQuiz = async () => {
    if (user && story) {
      setIsMinting(true);
      const meta = getBadgeMetadata(story.book.concept);
      try {
        const sig = await mintBadgeOnChain(walletAddress || 'demo-wallet', story.book.concept, story.book.title);
        const newBadge: Badge = {
          id: sig,
          name: meta.name,
          concept: story.book.concept,
          image: meta.image,
          mintAddress: sig,
          dateEarned: new Date().toLocaleDateString(),
          storyTitle: story.book.title,
          skillType: meta.skillType || 'Money Basics'
        };

        await authService.saveBadge(user.username, newBadge);
        const updatedUser = await authService.getUser(user.username);
        setUser(updatedUser);
      } catch (e) {
        console.error("Minting failed", e);
      } finally {
        setIsMinting(false);
      }
    }
    setState(AppState.PIGGY_MODE);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {state !== AppState.AUTH && (
        <div className="max-w-4xl w-full flex space-x-4 mb-4">
          {/* Main User Panel */}
          <div className="flex-1 flex justify-between items-center bg-white/80 backdrop-blur px-6 py-3 rounded-3xl border border-pink-100 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-xl">🐷</span>
              <div>
                <p className="text-xs text-stone-400 font-bold uppercase tracking-widest">Piggy Wallet</p>
                <p className="font-black text-pink-600 text-lg leading-none">
                  {user?.badges.length || 0} Money Skills
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setState(AppState.COLLECTION)}
                className="bg-pink-50 text-pink-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-pink-100 transition-colors"
              >
                View Wallet
              </button>
            </div>
          </div>

          {/* Parent/Secondary Actions */}
          <div className="flex gap-2">
            <button
              title="Parent settings and login"
              onClick={() => setState(AppState.PARENT_CORNER)}
              className="bg-white w-14 rounded-3xl text-stone-400 font-bold shadow-sm border border-stone-100 hover:bg-stone-50 transition-all flex items-center justify-center text-2xl"
            >
              🔐
            </button>
          </div>
        </div>
      )}

      {state !== AppState.AUTH && (
        <div className="max-w-4xl w-full text-center mb-6 opacity-60 hover:opacity-100 transition-opacity cursor-help group">
          <p className="text-[10px] text-stone-400 font-medium bg-stone-100 inline-block px-3 py-1 rounded-full">
            ℹ️ Parents: Piggy Wallet is a learning record. In the future, it helps connect specific skills to real-world financial tools.
          </p>
        </div>
      )}

      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden min-h-[600px] flex flex-col border-8 border-pink-100 relative">

        {state === AppState.AUTH && (
          <Auth onLoginSuccess={handleLoginSuccess} />
        )}

        {state === AppState.SETUP && (
          <Setup onStart={handleStartStory} />
        )}

        {state === AppState.GENERATING && (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-center p-10">
            <PigLoading />
            <h2 className="text-3xl font-black text-pink-600 animate-pulse">Piggy is writing your story...</h2>
          </div>
        )}

        {state === AppState.READING && story && (
          <StoryBook
            storyData={story}
            onComplete={() => setState(AppState.SUCCESS_ANIMATION)}
            onUpdateStory={updateCachedStory}
          />
        )}

        {state === AppState.SUCCESS_ANIMATION && (
          <PigSuccess onComplete={() => setState(AppState.QUIZ)} />
        )}

        {state === AppState.QUIZ && story && (
          <Quiz questions={story.knowledge_check} onComplete={handleFinishQuiz} recap={story.piggy_recap} isMinting={isMinting} />
        )}

        {state === AppState.PIGGY_MODE && story && (
          <PiggyTalk story={story} onHome={() => setState(AppState.SETUP)} />
        )}

        {state === AppState.COLLECTION && (
          <BadgeCollection badges={user?.badges || []} onBack={() => setState(AppState.SETUP)} />
        )}

        {state === AppState.PARENT_CORNER && (
          <ParentCorner
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            onBack={() => setState(AppState.SETUP)}
            onLogOut={handleLogOut}
          />
        )}

        {error && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-100 text-red-600 px-4 py-2 rounded-full text-sm border border-red-200">
            {error}
          </div>
        )}
      </div>

      <p className="mt-4 text-pink-300 text-sm font-medium">Safe & Educational Learning for Kids</p>
    </div>
  );
};

export default App;