import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from './SettingsContext';
import { Activity } from 'lucide-react';
import { useEasterEgg } from '../context/EasterEggContext';

export const FpsCounter: React.FC = () => {
  const { settings } = useSettings();
  const { solvePart } = useEasterEgg();
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const requestRef = useRef<number | null>(null);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);

  const handleFpsClick = () => {
    clickCountRef.current++;
    if (clickCountRef.current >= 5) {
      solvePart(9, 'live_action');
      clickCountRef.current = 0;
    }
    clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 2500);
  };

  useEffect(() => {
    if (!settings.showFpsCounter) return;

    const calcFps = () => {
      const now = performance.now();
      frameCountRef.current++;

      if (now - lastTimeRef.current >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      requestRef.current = requestAnimationFrame(calcFps);
    };

    requestRef.current = requestAnimationFrame(calcFps);

    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [settings.showFpsCounter]);

  if (!settings.showFpsCounter) return null;

  const fpsColor =
    fps >= 50 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
    fps >= 30 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
    'text-rose-400 bg-rose-500/10 border-rose-500/20';

  return (
    <div 
      onClick={handleFpsClick}
      title="Performance FPS Counter"
      className={`fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold backdrop-blur-md shadow-lg pointer-events-auto cursor-pointer select-none active:scale-95 transition-transform ${fpsColor}`}
    >
      <Activity className="w-3.5 h-3.5 animate-pulse" />
      <span>{fps} FPS</span>
    </div>
  );
};
