import React, { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@11labs/client';
import { StoryData } from '../types';
import { PigTalking } from './Mascot';

interface PiggyTalkProps {
  story: StoryData;
  onHome: () => void;
}

const PIGGY_AGENT_ID = import.meta.env.VITE_ELEVENLABS_PIGGY_AGENT_ID;

const PiggyTalk: React.FC<PiggyTalkProps> = ({ story, onHome }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isMouthMoving, setIsMouthMoving] = useState(false);
  const [currentPiggyText, setCurrentPiggyText] = useState('');

  const conversationRef = React.useRef<any>(null);

  // Map StoryData into the dynamic variables the agent expects
  // Combine intro and full story content for the agent
  const getDynamicVariables = useCallback(() => ({
    _story_text_: `${story.piggy_intro.text}\n\nThe full story is:\n${story.book.pages.map(p => p.text).join('\n')}`,
    _story_lessons_: story.piggy_recap.lesson,
    _allowed_topics_: story.piggy_interaction_rules.allowed_topics,
    _redirect_rule_: story.piggy_interaction_rules.redirect_rule,
  }), [story]);

  const startConversation = async () => {
    if (isActive || isConnecting) return;

    if (!PIGGY_AGENT_ID) {
      console.error("Missing VITE_ELEVENLABS_PIGGY_AGENT_ID");
      return;
    }

    setIsConnecting(true);
    setCurrentPiggyText('');

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const conversation = await Conversation.startSession({
        agentId: PIGGY_AGENT_ID,
        connectionType: 'websocket', // Required by generic PublicSessionConfig
        dynamicVariables: (() => {
          const vars = getDynamicVariables();
          console.log('[PiggyTalk] Starting session with variables:', vars);
          console.log('[PiggyTalk] Story Title:', story.book.title);
          return vars;
        })(),
        onConnect: () => {
          setIsConnecting(false);
          setIsActive(true);
        },
        onDisconnect: () => {
          setIsActive(false);
          setIsMouthMoving(false);
        },
        onError: (err) => {
          console.error('Piggy conversation error:', err);
          setIsConnecting(false);
          setIsActive(false);
        },
        onModeChange: (mode) => {
          setIsMouthMoving(mode.mode === 'speaking');
        },
        onMessage: (msg) => {
          if (msg.source === 'ai') {
            setCurrentPiggyText(msg.message);
          }
        }
      });

      conversationRef.current = conversation;

    } catch (err) {
      console.error('Failed to start Piggy conversation:', err);
      setIsConnecting(false);
    }
  };

  const stopConversation = useCallback(async () => {
    if (conversationRef.current) {
      try { await conversationRef.current.endSession(); } catch (e) { }
      conversationRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
    setIsMouthMoving(false);
    setCurrentPiggyText('');
  }, []);

  useEffect(() => {
    return () => {
      stopConversation();
    };
  }, [stopConversation]);

  // --- JSX below is UNCHANGED from the existing design ---
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 bg-gradient-to-b from-white to-pink-50">
      <div className="relative group">
        <PigTalking isTalking={isMouthMoving} className={`w-48 h-48 transition-all duration-300 transform ${isActive ? 'scale-110' : 'grayscale opacity-70'}`} />
        {!isActive && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center">
            <button onClick={startConversation} className="bg-pink-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl hover:bg-pink-700 transition-all hover:scale-105">
              Talk to Piggy!
            </button>
          </div>
        )}
      </div>

      <div className="text-center max-w-lg space-y-4 min-h-[160px]">
        {isConnecting ? (
          <p className="text-pink-600 font-bold animate-pulse text-2xl">Piggy is waking up...</p>
        ) : isActive ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-3 h-3 bg-green-500 rounded-full animate-ping"></span>
              <span className="text-green-600 font-bold uppercase tracking-widest text-xs">Live with Piggy</span>
            </div>
            <div className="bg-white/80 backdrop-blur p-6 rounded-3xl border-2 border-pink-100 shadow-sm flex items-center justify-center text-center">
              <p className="text-xl text-stone-600 font-medium italic leading-relaxed">
                {currentPiggyText || "I'm listening! Ask me anything about the money choices in our story."}
              </p>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <h3 className="text-2xl font-black text-stone-700">Ready to chat?</h3>
            <p className="text-stone-400 font-medium">Piggy can't wait to hear what you learned!</p>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-6">
        {isActive && (
          <button onClick={stopConversation} className="text-pink-500 font-bold hover:text-pink-700 underline">End Chat</button>
        )}
        {!isActive && !isConnecting && (
          <button onClick={onHome} className="px-10 py-4 bg-white text-pink-500 border-4 border-pink-100 rounded-full font-black text-lg hover:bg-pink-50 transition-all shadow-md active:scale-95">
            Read Another Story 🏠
          </button>
        )}
      </div>
    </div>
  );
};

export default PiggyTalk;