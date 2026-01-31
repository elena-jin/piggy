import React, { useEffect, useRef, useState } from 'react';

const STATIC_PIG_FALLBACK = "https://api.dicebear.com/7.x/adventurer/svg?seed=piggy";

interface MascotProps {
  className?: string;
}

/**
 * PigLoading: Loops during content generation.
 * REMBG PREPROCESSED: assets/videos/transparent/pig-loading-alpha.mov
 */
export const PigLoading: React.FC<MascotProps> = ({ className = "w-48 h-48" }) => {
  return (
    <div className={`relative ${className} flex items-center justify-center pointer-events-none`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-contain"
        poster={STATIC_PIG_FALLBACK}
      >
        <source src="/assets/videos/transparent/pig-loading-transparent.mov" type="video/quicktime" />
        <img src={STATIC_PIG_FALLBACK} alt="Loading Pig" className="w-2/3 h-2/3 animate-bounce" />
      </video>
    </div>
  );
};

/**
 * PigTalking: Loops face-only region during chat.
 * REMBG PREPROCESSED: assets/videos/transparent/pig-gigging-transparent.mov
 */
export const PigTalking: React.FC<MascotProps & { isTalking?: boolean }> = ({ 
  className = "w-32 h-32", 
  isTalking = false 
}) => {
  return (
    <div className={`relative ${className} overflow-hidden rounded-full border-4 border-white shadow-xl bg-pink-50 flex items-center justify-center`}>
      <video
        autoPlay
        loop
        muted
        playsInline
        className={`w-full h-full object-cover transition-transform duration-500 ${isTalking ? 'scale-110' : 'scale-100'}`}
        style={{ objectPosition: '50% 20%' }}
        poster={STATIC_PIG_FALLBACK}
      >
        <source src="/assets/videos/transparent/pig-gigging-transparent.mov" type="video/quicktime" />
        <img src={STATIC_PIG_FALLBACK} alt="Talking Pig" />
      </video>
    </div>
  );
};

/**
 * PigSuccess: Plays once then triggers onComplete.
 * REMBG PREPROCESSED: assets/videos/transparent/pig-good-job-transparent.mov
 */
export const PigSuccess: React.FC<MascotProps & { onComplete: () => void }> = ({ 
  className = "w-full h-full", 
  onComplete 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      if (!videoRef.current || hasError) {
        onComplete();
      }
    }, 6000);
    return () => clearTimeout(safetyTimer);
  }, [onComplete, hasError]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 animate-fadeIn">
      <h2 className="text-5xl font-black text-pink-600 animate-bounce tracking-tight text-center">HOORAY!<br/>YOU DID IT!</h2>
      <div className={`relative ${className} max-w-sm aspect-square bg-white rounded-[3rem] overflow-hidden shadow-2xl border-8 border-pink-100`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          onEnded={onComplete}
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
          poster={STATIC_PIG_FALLBACK}
        >
          <source src="/assets/videos/transparent/pig-good-job-transparent.mov" type="video/quicktime" />
          <img src={STATIC_PIG_FALLBACK} alt="Good Job Pig" className="w-full h-full p-10" />
        </video>
      </div>
      <div className="text-center space-y-2">
        <p className="text-2xl font-bold text-stone-700">You earned a Gold Star! ⭐</p>
        <p className="text-stone-400 font-medium italic">Let's check what we learned...</p>
      </div>
    </div>
  );
};