import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAchievements } from './AchievementsContext';

export const GlobalPartyListener: React.FC = () => {
  const { unlockAchievement } = useAchievements();

  useEffect(() => {
    let lastSeenTs = Date.now(); // Ignore old events prior to mounting

    const firePartyEffects = (mode: string = 'fireworks') => {
      try {
        if (mode === 'fireworks' || mode === 'all') {
          // Instant burst right away
          confetti({
            particleCount: 80,
            spread: 100,
            origin: { x: 0.5, y: 0.4 },
            zIndex: 999999
          });

          const duration = 3.5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 32, spread: 360, ticks: 60, zIndex: 999999 };

          const interval: any = setInterval(function() {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) {
              return clearInterval(interval);
            }
            const particleCount = 45 * (timeLeft / duration);
            confetti({
              ...defaults,
              particleCount,
              origin: { x: Math.random() * 0.3 + 0.1, y: Math.random() * 0.35 + 0.15 }
            });
            confetti({
              ...defaults,
              particleCount,
              origin: { x: Math.random() * 0.3 + 0.6, y: Math.random() * 0.35 + 0.15 }
            });
          }, 250);
        } else {
          // High-velocity dual cannon blast
          confetti({
            particleCount: 120,
            angle: 60,
            spread: 80,
            origin: { x: 0.05, y: 0.65 },
            zIndex: 999999
          });
          confetti({
            particleCount: 120,
            angle: 120,
            spread: 80,
            origin: { x: 0.95, y: 0.65 },
            zIndex: 999999
          });
          confetti({
            particleCount: 100,
            spread: 100,
            origin: { x: 0.5, y: 0.55 },
            zIndex: 999999
          });
        }
      } catch (err) {
        console.error('Confetti execution error:', err);
      }
    };

    const handleIncomingParty = (mode: string, ts: number) => {
      if (ts && ts !== lastSeenTs) {
        lastSeenTs = ts;
        // Only trigger if happened recently (within 20s)
        if (Date.now() - ts < 20000) {
          firePartyEffects(mode || 'fireworks');
          try { unlockAchievement('party_starter'); } catch (e) {}
        }
      }
    };

    // 1. Server-Sent Events (SSE) for instant cross-user live push
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/live-stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'party' && payload.data) {
            handleIncomingParty(payload.data.mode, payload.data.timestamp);
          }
        } catch (e) {}
      };
    } catch (e) {
      console.warn('SSE party stream error:', e);
    }

    // 2. BroadcastChannel for instant same-browser cross-tab sync
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
    } catch (e) {}

    // 3. Custom window event for instant local execution
    const handleCustomParty = (e: CustomEvent) => {
      const mode = e.detail?.mode || 'fireworks';
      firePartyEffects(mode);
      try { unlockAchievement('party_starter'); } catch (e) {}
    };
    window.addEventListener('nexus_party_fire' as any, handleCustomParty);

    // 4. Storage event
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

    // 5. Firestore real-time snapshot
    let unsubFirestore: (() => void) | null = null;
    try {
      unsubFirestore = onSnapshot(doc(db, 'config', 'party'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const ts = data.timestamp || 0;
          handleIncomingParty(data.mode, ts);
        }
      }, (err) => {
        console.warn('Party firestore listener notice:', err);
      });
    } catch (e) {
      console.warn('Party firestore init notice:', e);
    }

    // 6. Fast polling fallback to /api/party (every 3.5s) in case SSE is blocked
    const pollInterval = setInterval(() => {
      fetch('/api/party')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.timestamp && data.timestamp !== lastSeenTs) {
            handleIncomingParty(data.mode, data.timestamp);
          }
        })
        .catch(() => {});
    }, 3500);

    return () => {
      if (eventSource) eventSource.close();
      if (bc) bc.close();
      if (unsubFirestore) unsubFirestore();
      clearInterval(pollInterval);
      window.removeEventListener('nexus_party_fire' as any, handleCustomParty);
      window.removeEventListener('storage', handleStorage);
    };
  }, [unlockAchievement]);

  return null;
};

