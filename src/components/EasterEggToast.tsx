import React from 'react';
import { Sparkles, KeyRound, X } from 'lucide-react';
import { useEasterEgg } from '../context/EasterEggContext';

export const EasterEggToast: React.FC = () => {
  const { latestNotification, clearNotification, openCodex, auraActive, toggleAura } = useEasterEgg();

  return (
    <>
      {/* Genesis Glitch Aura Overlay (when unlocked & active) */}
      {auraActive && (
        <div className="fixed inset-0 pointer-events-none z-[40] overflow-hidden">
          <div className="absolute inset-0 border-4 border-amber-500/20 shadow-[inset_0_0_40px_rgba(245,158,11,0.15)] animate-pulse" />
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />
          {/* Quick Corner Glow Dismiss */}
          <div className="absolute top-2 right-4 pointer-events-auto opacity-60 hover:opacity-100 transition-opacity">
            <button
              onClick={() => toggleAura(false)}
              className="px-2.5 py-1 rounded-full bg-slate-950/90 border border-amber-500/40 text-[10px] font-mono text-amber-300 hover:text-white flex items-center gap-1.5 shadow-lg backdrop-blur-sm cursor-pointer"
              title="Turn off Golden Corner Glow"
            >
              <X className="w-3 h-3 text-amber-400" />
              <span>Turn off Corner Glow</span>
            </button>
          </div>
        </div>
      )}

      {/* Rune Shatter Toast Notification */}
      {latestNotification && (
        <div className="fixed bottom-6 right-6 z-[95] max-w-sm w-full bg-slate-950/95 border-2 border-amber-500/60 rounded-xl p-3.5 shadow-2xl shadow-amber-950/60 flex items-start gap-3 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-mono text-xl text-amber-300 shrink-0 font-bold shadow-inner">
            {latestNotification.rune}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-400" />
              ANCIENT SEAL SHATTERED (#{latestNotification.id})
            </div>
            <div className="text-xs font-bold text-white truncate mt-0.5">
              {latestNotification.title}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => {
                  openCodex('seals');
                  clearNotification();
                }}
                className="text-[11px] font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 px-2.5 py-1 rounded-md border border-amber-500/40 transition-colors flex items-center gap-1 font-mono"
              >
                <KeyRound className="w-3 h-3" /> View in Codex
              </button>
            </div>
          </div>

          <button
            onClick={clearNotification}
            className="text-slate-500 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </>
  );
};
