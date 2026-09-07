import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const GlobalEffectsListener: React.FC = () => {
  const [godModeAura, setGodModeAura] = useState(() => {
    return localStorage.getItem('nexus_godmode_aura') === 'true';
  });

  useEffect(() => {
    // 1. Listen to BroadcastChannel for instant cross-tab / proxy sync
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('nexus_effects_channel');
        bc.onmessage = (event) => {
          if (event.data && typeof event.data.godModeAura === 'boolean') {
            setGodModeAura(event.data.godModeAura);
            localStorage.setItem('nexus_godmode_aura', event.data.godModeAura ? 'true' : 'false');
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel not supported:', e);
    }

    // 2. Listen to window custom events
    const handleCustomEvent = (e: CustomEvent) => {
      setGodModeAura(!!e.detail);
    };
    window.addEventListener('nexus_godmode_toggle' as any, handleCustomEvent);

    // 3. Listen to localStorage storage events
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexus_godmode_aura') {
        setGodModeAura(e.newValue === 'true');
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Listen to Firestore doc
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, 'config', 'effects'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (typeof data.godModeAura === 'boolean') {
            setGodModeAura(data.godModeAura);
            localStorage.setItem('nexus_godmode_aura', data.godModeAura ? 'true' : 'false');
          }
          if (typeof data.matrixRain === 'boolean') {
            localStorage.setItem('nexus_matrix_rain', 'false');
          }
        }
      }, (err) => {
        console.warn('Global effects listener error:', err);
      });
    } catch (e) {
      console.error('Global effects snapshot error:', e);
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('nexus_godmode_toggle' as any, handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
      if (unsub) unsub();
    };
  }, []);

  if (!godModeAura) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] border-[6px] border-amber-400/80 shadow-[inset_0_0_120px_rgba(251,191,36,0.5)] animate-pulse transition-all duration-500">
      <div className="absolute top-2 right-4 bg-amber-500/90 text-black px-3 py-1 rounded-full font-black text-xs shadow-lg uppercase tracking-wider flex items-center gap-1.5 animate-bounce">
        <span className="w-2 h-2 rounded-full bg-black animate-ping" />
        God Mode Live Aura Active
      </div>
    </div>
  );
};

