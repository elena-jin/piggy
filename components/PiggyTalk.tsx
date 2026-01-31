import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { StoryData } from '../types';
import { PigTalking } from './Mascot';

interface PiggyTalkProps {
  story: StoryData;
  onHome: () => void;
}

const PiggyTalk: React.FC<PiggyTalkProps> = ({ story, onHome }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [currentPiggyText, setCurrentPiggyText] = useState("");
  const [isMouthMoving, setIsMouthMoving] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const outAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    if (isActive) return;
    setIsConnecting(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              setIsMouthMoving(true);
              const ctx = outAudioContextRef.current!;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) setIsMouthMoving(false);
              };
              sourcesRef.current.add(source);
            }
            if (message.serverContent?.outputTranscription) {
              setCurrentPiggyText(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              setCurrentPiggyText("");
            }
            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
              setIsMouthMoving(false);
            }
          },
          onerror: () => setIsActive(false),
          onclose: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } }
          },
          systemInstruction: `You are Piggy. ${story.piggy_interaction_rules.style}. Topics: ${story.piggy_interaction_rules.allowed_topics}. Redirect: ${story.piggy_interaction_rules.redirect_rule}. Story Intro: ${story.piggy_intro.text}. Keep answers under 4 short sentences.`,
          outputAudioTranscription: {},
        }
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      if (audioContextRef.current) audioContextRef.current.close();
      if (outAudioContextRef.current) outAudioContextRef.current.close();
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 bg-gradient-to-b from-white to-pink-50">
      <div className="relative group">
        <PigTalking isTalking={isMouthMoving} className={`w-48 h-48 transition-all duration-300 transform ${isActive ? 'scale-110' : 'grayscale opacity-70'}`} />
        
        {!isActive && !isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center">
             <button 
              onClick={startSession}
              className="bg-pink-600 text-white px-6 py-3 rounded-full font-black text-xl shadow-xl hover:bg-pink-700 transition-all hover:scale-105"
            >
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
          <button 
            onClick={() => {
              if (sessionRef.current) sessionRef.current.close();
              setIsActive(false);
            }}
            className="text-pink-500 font-bold hover:text-pink-700 underline"
          >
            End Chat
          </button>
        )}
        
        {!isActive && !isConnecting && (
          <button
            onClick={onHome}
            className="px-10 py-4 bg-white text-pink-500 border-4 border-pink-100 rounded-full font-black text-lg hover:bg-pink-50 transition-all shadow-md active:scale-95"
          >
            Read Another Story 🏠
          </button>
        )}
      </div>
    </div>
  );
};

export default PiggyTalk;