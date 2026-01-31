import React, { useEffect, useRef, useState, Suspense } from 'react';
// We use the standard react-spline import for Vite/CRA.
// The user provided snippet used '/next' but this is a Vite project.
const Spline = React.lazy(() => import('@splinetool/react-spline'));

const SPLINE_SCENE_URL = "https://prod.spline.design/Bn1AQAPxDSYRxt39/scene.splinecode";

interface MascotProps {
  className?: string;
}

// ------------------------------------------------------------------
// Shared Spline Wrapper
// ------------------------------------------------------------------
interface PiggySplineProps {
  className?: string;
  isMouthOpen?: boolean;
  onLoad?: (splineApp: any) => void;
}

const PiggySpline: React.FC<PiggySplineProps> = ({ className, isMouthOpen = false, onLoad }) => {
  const splineRef = useRef<any>(null);

  const handleLoad = (splineApp: any) => {
    splineRef.current = splineApp;
    if (onLoad) onLoad(splineApp);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMouthOpen && splineRef.current) {
      // Rapidly toggle between open (1) and closed (0)
      interval = setInterval(() => {
        const randomValue = Math.random() > 0.5 ? 1 : 0;
        try {
          splineRef.current.setVariable('mouthOpen', randomValue);
        } catch (e) { /* ignore */ }
      }, 120);
    } else if (splineRef.current) {
      // Return to base state
      try {
        splineRef.current.setVariable('mouthOpen', 0);
      } catch (e) { /* ignore */ }
    }
    return () => clearInterval(interval);
  }, [isMouthOpen]);

  return (
    <div className={`relative ${className} overflow-hidden group`}>
      {/* Hide Spline Logo Hack */}
      <style>{`
        #spline-watermark { display: none !important; }
        a[href*="spline.design"] { display: none !important; }
      `}</style>
      <div className="w-full h-full transform scale-[1.25] origin-center">
        <Suspense fallback={<div className="w-full h-full bg-pink-50 animate-pulse rounded-full" />}>
          <Spline
            scene={SPLINE_SCENE_URL}
            onLoad={handleLoad}
            className="w-full h-full"
          />
        </Suspense>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// Exported Componets
// ------------------------------------------------------------------

/**
 * PigLoading: Loops idle animation (default scene state).
 */
export const PigLoading: React.FC<MascotProps> = ({ className = "w-64 h-64" }) => {
  return (
    <div className={`relative ${className} rounded-full border-8 border-pink-100 shadow-xl bg-pink-50 overflow-hidden flex items-center justify-center`}>
      <PiggySpline className="w-full h-full object-cover" />
    </div>
  );
};

/**
 * PigTalking: Toggles mouth based on isTalking prop.
 */
export const PigTalking: React.FC<MascotProps & { isTalking?: boolean }> = ({
  className = "w-32 h-32",
  isTalking = false
}) => {
  return (
    <div className={`relative ${className} rounded-full border-4 border-white shadow-xl bg-pink-50 flex items-center justify-center overflow-hidden`}>
      <PiggySpline
        className="w-full h-full transition-transform duration-500"
        isMouthOpen={isTalking}
      />
    </div>
  );
};

/**
 * PigSuccess: Plays for fixed duration then triggers onComplete.
 * For now, just shows the happy pig scene (same scene).
 */
export const PigSuccess: React.FC<MascotProps & { onComplete: () => void }> = ({
  className = "w-full h-full",
  onComplete
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 4000); // Auto advance after 4 seconds of "celebration"
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 animate-fadeIn">
      <h2 className="text-5xl font-black text-pink-600 animate-bounce tracking-tight text-center">HOORAY!<br />YOU DID IT!</h2>
      <div className={`relative ${className} max-w-sm aspect-square bg-white rounded-[3rem] overflow-hidden shadow-2xl border-8 border-pink-100`}>
        <PiggySpline className="w-full h-full" />
      </div>
      <div className="text-center space-y-2">
        <p className="text-2xl font-bold text-stone-700">You earned a Gold Star! ⭐</p>
        <p className="text-stone-400 font-medium italic">Let's check what we learned...</p>
      </div>
    </div>
  );
};