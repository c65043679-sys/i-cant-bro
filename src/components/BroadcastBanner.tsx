import React, { useState, useEffect } from 'react';
import { Radio, X } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const BroadcastBanner: React.FC = () => {
  const [announcement, setAnnouncement] = useState(() => {
    return localStorage.getItem('nexus_site_announcement') || '';
  });
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;
    let eventSource: EventSource | null = null;
    let bc: BroadcastChannel | null = null;

    const applyAnnouncement = (msg: string) => {
      const clean = (msg || '').trim();
      setAnnouncement(clean);
      if (clean) {
        setDismissed(false);
        localStorage.setItem('nexus_site_announcement', clean);
      } else {
        localStorage.removeItem('nexus_site_announcement');
      }
    };

    // 1. Initial fetch from server API
    fetch('/api/broadcast')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.message === 'string') {
          applyAnnouncement(data.message);
        }
      })
      .catch(() => {});

    // 2. Connect to Server-Sent Events (SSE) for instant push
    try {
      eventSource = new EventSource('/api/live-stream');
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'broadcast') {
            applyAnnouncement(payload.data?.message || '');
          } else if (payload.type === 'init' && payload.broadcast) {
            applyAnnouncement(payload.broadcast.message || '');
          }
        } catch (e) {}
      };
      eventSource.onerror = () => {
        // EventSource auto-retries connection natively
      };
    } catch (e) {
      console.warn('SSE not supported or failed to connect:', e);
    }

    // 3. BroadcastChannel for instant cross-tab sync
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('nexus_broadcast_channel');
        bc.onmessage = (event) => {
          if (event.data && typeof event.data.message === 'string') {
            applyAnnouncement(event.data.message);
          }
        };
      }
    } catch (e) {}

    // 4. Firestore real-time snapshot
    try {
      unsubscribeFirestore = onSnapshot(doc(db, 'config', 'broadcast'), (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          applyAnnouncement(data.message || '');
        }
      }, (err) => {
        console.warn('Broadcast firestore listener notice:', err);
      });
    } catch (err) {
      console.warn('Broadcast firestore init notice:', err);
    }

    // 5. Local custom and storage events
    const handleLocalUpdate = () => {
      applyAnnouncement(localStorage.getItem('nexus_site_announcement') || '');
    };
    window.addEventListener('nexus_announcement_updated', handleLocalUpdate);

    return () => {
      if (eventSource) eventSource.close();
      if (bc) bc.close();
      if (unsubscribeFirestore) unsubscribeFirestore();
      window.removeEventListener('nexus_announcement_updated', handleLocalUpdate);
    };
  }, []);

  if (!announcement || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black px-4 py-2 text-xs font-black flex items-center justify-between shadow-lg shadow-amber-500/10 z-[60] relative">
      <div className="flex items-center gap-2 max-w-4xl mx-auto truncate">
        <Radio className="w-4 h-4 shrink-0 animate-pulse" />
        <span className="truncate">{announcement}</span>
      </div>
      <button 
        onClick={() => setDismissed(true)}
        className="p-1 hover:bg-black/10 rounded-full transition-colors cursor-pointer"
        title="Dismiss announcement"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
