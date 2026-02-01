import React, { useState, useEffect, useRef } from 'react';
import { StoryData } from '../types';
import { generateImage } from '../services/gemini';
import { streamAudioFromText } from '../services/elevenlabs';
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
  const speakRequestIdRef = useRef(0);

  const book = storyData.book;
  const page = book.pages[currentPage];
  const words = page.text.split(' ');

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

  const speakText = async (text: string) => {
    // 1. Stop any currently playing audio immediately
    stopSpeaking();

    // 2. Set distinct state to show we are "loading" audio
    setIsSpeaking(true);
    setHighlightedWordIndex(-1);

    // 3. Increment request ID to invalidate previous pending requests
    const myRequestId = ++speakRequestIdRef.current;

    // 4. Create a local flag to check if this request becomes stale due to page change
    const myPageId = currentPage;

    try {
      console.log(`[StoryBook] Speaking page ${myPageId} (req=${myRequestId}): "${text.substring(0, 20)}..."`);

      const audioBufferData = await streamAudioFromText(text);

      // Check if we have been superseded by a newer request
      if (speakRequestIdRef.current !== myRequestId) {
        console.log(`[StoryBook] Request superseded (req=${myRequestId}, current=${speakRequestIdRef.current}), discarding audio.`);
        return;
      }

      // Check if user moved to another page while we were fetching (redundant with ID check usually, but good for safety)
      if (currentPage !== myPageId) {
        console.log(`[StoryBook] Page changed (req=${myRequestId}, curr=${currentPage}), discarding audio.`);
        return;
      }

      if (audioBufferData) {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;

        // Ensure context is running (browser autoplay policy)
        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const audioBuffer = await ctx.decodeAudioData(audioBufferData);

        // Check again after decoding
        if (speakRequestIdRef.current !== myRequestId) return;

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
            if (highlightIntervalRef.current) {
              window.clearInterval(highlightIntervalRef.current);
              highlightIntervalRef.current = null;
            }
          }
        }, 50);

        source.onended = () => {
          // Only reset state if we are still on the same page/same audio
          if (currentSourceRef.current === source) {
            setIsSpeaking(false);
            setHighlightedWordIndex(-1);
            currentSourceRef.current = null;
          }
        };

        currentSourceRef.current = source;
        source.start();
        console.log(`[StoryBook] Audio started for page ${myPageId}`);
      } else {
        console.warn("[StoryBook] No audio data received");
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error("[StoryBook] Narrator failed", error);
      setIsSpeaking(false);
    }
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
    return () => {
      // Don't call stopSpeaking here because it sets state which might be unmounted?
      // Actually safe to call, but cleaner to just stop source.
      if (currentSourceRef.current) {
        try { currentSourceRef.current.stop(); } catch (e) { }
      }
      if (highlightIntervalRef.current) {
        window.clearInterval(highlightIntervalRef.current);
      }
    };
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