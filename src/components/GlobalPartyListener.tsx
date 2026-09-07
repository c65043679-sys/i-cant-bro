import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAchievements } from './AchievementsContext';

export const GlobalPartyListener: React.FC = () => {
  const { unlockAchievement } = useAchievements();

  useEffect(() => {
    let lastSeenTs = 0;

    const firePartyEffects = (mode: string = 'fireworks') => {
      if (mode === 'fireworks' || mode === 'all') {
        const duration = 3.5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 35, spread: 360, ticks: 70, zIndex: 99999 };

        const interval: any = setInterval(function() {
          const timeLeft = animationEnd - Date.now();
          if (timeLeft <= 0) {
            return clearInterval(interval);
          }
          const particleCount = 60 * (timeLeft / duration);
          confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.1, y: Math.random() - 0.2 } });
          confetti({ ...defaults, particleCount, origin: { x: Math.random() * 0.4 + 0.5, y: Math.random() - 0.2 } });
        }, 200);
      } else {
        // Cannon blast
        confetti({
          particleCount: 150,
          spread: 100,
          origin: { y: 0.6 },
          zIndex: 99999
        });
      }
    };

    // 1. BroadcastChannel for instant local & proxy party triggering
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('nexus_party_channel');
        bc.onmessage = (event) => {
          if (event.data && event.data.mode) {
            firePartyEffects(event.data.mode);
            try { unlockAchievement('party_starter'); } catch (e) {}
          }
        };
      }
    } catch (e) {
      console.warn('BroadcastChannel error:', e);
    }

    // 2. Custom window event
    const handleCustomParty = (e: CustomEvent) => {
      const mode = e.detail?.mode || 'fireworks';
      firePartyEffects(mode);
      try { unlockAchievement('party_starter'); } catch (e) {}
    };
    window.addEventListener('nexus_party_fire' as any, handleCustomParty);

    // 3. Storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'nexus_party_signal' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.mode) {
            firePartyEffects(parsed.mode);
            try { unlockAchievement('party_starter'); } catch (err) {}
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 4. Firestore snapshot
    let unsub: (() => void) | null = null;
    try {
      unsub = onSnapshot(doc(db, 'config', 'party'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const ts = data.timestamp || 0;
          if (ts > 0 && ts !== lastSeenTs) {
            lastSeenTs = ts;
            // Trigger effect if received within last 30 seconds
            if (Date.now() - ts < 30000) {
              firePartyEffects(data.mode);
              try { unlockAchievement('party_starter'); } catch (e) {}
            }
          }
        }
      }, (err) => {
        console.warn('Party listener offline:', err);
      });
    } catch (e) {
      console.error('Party listener init failed:', e);
    }

    return () => {
      if (bc) bc.close();
      window.removeEventListener('nexus_party_fire' as any, handleCustomParty);
      window.removeEventListener('storage', handleStorage);
      if (unsub) unsub();
    };
  }, []);

  return null;
};

