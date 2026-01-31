import React, { useState, useEffect, useRef } from 'react';
import { Page, StoryData } from '../types';
import { generateImage, generateAudio } from '../services/gemini';
import { PigLoading } from './Mascot';

interface StoryBookProps {
  storyData: StoryData;
  onComplete: () => void;
  onUpdateStory: (updated: StoryData) => void;
}

const StoryBook: React.FC<StoryBookProps> = ({ storyData, onComplete, onUpdateStory }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(-1);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const highlightIntervalRef = useRef<number | null>(null);

  const book = storyData.book;
  const page = book.pages[currentPage];
  const words = page.text.split(' ');

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
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

  const speakText = async (text: string) => {
    if (isSpeaking) stopSpeaking();

    setIsSpeaking(true);
    setHighlightedWordIndex(-1);

    try {
      const base64Audio = await generateAudio(`Read this story page warmly and slowly: ${text}`);
      if (base64Audio) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        }
        const ctx = audioContextRef.current;
        const audioBuffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);

        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(ctx.destination);

        const duration = audioBuffer.duration;
        const timePerWord = (duration * 1000) / words.length;

        let startTime = Date.now();
        highlightIntervalRef.current = window.setInterval(() => {
          const elapsed = Date.now() - startTime;
          const index = Math.floor(elapsed / timePerWord);
          if (index < words.length) {
            setHighlightedWordIndex(index);
          } else {
            stopSpeaking();
          }
        }, 50);

        source.onended = () => stopSpeaking();
        currentSourceRef.current = source;
        source.start();
      }
    } catch (error) {
      console.error("Narrator failed", error);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch (e) { }
      currentSourceRef.current = null;
    }
    if (highlightIntervalRef.current) {
      window.clearInterval(highlightIntervalRef.current);
      highlightIntervalRef.current = null;
    }
    setIsSpeaking(false);
    setHighlightedWordIndex(-1);
  };

  useEffect(() => {
    const fetchImageAndSpeak = async () => {
      if (!page.image_url) {
        setIsLoadingImage(true);
        try {
          const url = await generateImage(page.image_prompt);
          if (url) {
            const updatedBook = { ...book };
            updatedBook.pages[currentPage].image_url = url;
            onUpdateStory({ ...storyData, book: updatedBook });
          }
        } catch (e) {
          console.error("Could not load image", e);
        }
        setIsLoadingImage(false);
      }
      speakText(page.text);
    };

    fetchImageAndSpeak();
    return () => stopSpeaking();
  }, [currentPage]);

  const handleNext = () => {
    if (currentPage < book.pages.length - 1) {
      setCurrentPage(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-black text-pink-600">{book.title}</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => speakText(page.text)}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isSpeaking ? 'bg-pink-500 text-white animate-pulse' : 'bg-pink-100 text-pink-500 hover:bg-pink-200'}`}
          >
            🔊
          </button>
          <span className="text-pink-400 font-bold bg-pink-50 px-3 py-1 rounded-full">
            Page {currentPage + 1} of {book.pages.length}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center">
        <div className="w-full md:w-1/2 aspect-square relative rounded-3xl overflow-hidden shadow-2xl border-4 border-pink-50 bg-stone-50">
          {isLoadingImage ? (
            <div className="absolute inset-0 flex items-center justify-center bg-pink-50/50">
              <PigLoading className="w-64 h-64" />
            </div>
          ) : (
            page.image_url && (
              <img src={page.image_url} alt="Story art" className="w-full h-full object-cover transition-opacity duration-500" />
            )
          )}
        </div>

        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6">
          <div className="bg-pink-50 p-8 rounded-3xl border-2 border-pink-100 min-h-[220px] flex flex-wrap items-center content-center gap-x-2 gap-y-2">
            {words.map((word, i) => (
              <span
                key={i}
                className={`text-2xl transition-all duration-300 ${i <= highlightedWordIndex ? 'text-pink-600 font-black scale-110' : 'text-stone-700 font-medium'}`}
              >
                {word}
              </span>
            ))}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={handlePrev}
              disabled={currentPage === 0}
              className={`flex-1 py-4 rounded-2xl font-black text-xl shadow-md transition-all ${currentPage === 0 ? 'bg-stone-200 text-stone-400 cursor-not-allowed' : 'bg-white text-pink-500 border-2 border-pink-100 hover:bg-pink-50'
                }`}
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex-[2] py-4 bg-pink-500 text-white rounded-2xl font-black text-xl shadow-md hover:bg-pink-600 transition-all"
            >
              {currentPage === book.pages.length - 1 ? 'Finish Story' : 'Next Page'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryBook;