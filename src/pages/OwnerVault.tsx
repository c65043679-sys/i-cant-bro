import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { useSettings } from '../components/SettingsContext';
import { useAchievements } from '../components/AchievementsContext';
import { Game } from '../types';
import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  Crown, 
  ShieldCheck, 
  Zap, 
  PlusCircle, 
  Sparkles, 
  Volume2, 
  Terminal, 
  Flame, 
  Radio, 
  CheckCircle2, 
  Trash2,
  Tv,
  Activity,
  PartyPopper,
  Cpu,
  Wifi,
  RefreshCw,
  Play,
  Database,
  Gauge,
  Rocket,
  AlertTriangle,
  UserCheck
} from 'lucide-react';

// Web Audio Synthesis Helper for Retro 8-bit Sounds
const playRetroSound = (type: 'coin' | 'laser' | 'levelup' | 'win' | 'powerup') => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;

    if (type === 'coin') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'laser') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'levelup') {
      osc.type = 'triangle';
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      });
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'win') {
      osc.type = 'square';
      [440, 554.37, 659.25, 880].forEach((freq, idx) => {
        osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      });
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'powerup') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(880, now + 0.2);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (e) {
    console.error('Audio synthesis failed:', e);
  }
};

export const OwnerVault: React.FC = () => {
  const { isOwner, user, signIn, unlockOwner, unlockAllAvatars } = useAuth();
  const { settings, updateSetting } = useSettings();
  const { 
    unlockAchievement, 
    unlockAllAchievements, 
    wipeAllProgress,
    addGamePoints, 
    setCustomPoints, 
    addBonusXp, 
    setCustomXp, 
    gamePoints, 
    totalXp, 
    totalScore, 
    level, 
    levelTitle, 
    gamesPlayed,
    flushSave 
  } = useAchievements();

  useEffect(() => {
    if (isOwner) {
      try { unlockAchievement('vault_visitor'); } catch (e) {}
    }
  }, [isOwner]);

  const [activeTab, setActiveTab] = useState<'hacks' | 'injector' | 'command' | 'broadcast'>('hacks');

  // Admin Abuse & Injections state
  const [customPointsInput, setCustomPointsInput] = useState<string>('5000');
  const [customXpInput, setCustomXpInput] = useState<string>('5000');
  const [actionToast, setActionToast] = useState<string>('');

  const showActionToast = (msg: string) => {
    setActionToast(msg);
    setTimeout(() => setActionToast(''), 4500);
  };

  const handleAddPoints = async (amt: number) => {
    addGamePoints(amt);
    playRetroSound('coin');
    showActionToast(`💰 Injected +${amt.toLocaleString()} Game Points! Saved.`);
    await flushSave();
  };

  const handleSetPoints = async (amt: number) => {
    setCustomPoints(amt);
    playRetroSound('powerup');
    showActionToast(`⚡ Game Points set directly to ${amt.toLocaleString()} Pts! Saved.`);
    await flushSave();
  };

  const handleAddXp = async (amt: number) => {
    addBonusXp(amt);
    playRetroSound('levelup');
    showActionToast(`⭐ Injected +${amt.toLocaleString()} Trophy XP! Saved.`);
    await flushSave();
  };

  const handleSetXp = async (amt: number) => {
    setCustomXp(amt);
    playRetroSound('powerup');
    showActionToast(`🌟 Trophy XP set directly to ${amt.toLocaleString()} XP! Saved.`);
    await flushSave();
  };

  const handleUnlockAllAvatars = async () => {
    unlockAllAvatars();
    playRetroSound('win');
    showActionToast(`👑 Master Unlocked all 15+ Custom Avatars & Cosmic Skins!`);
    await flushSave();
  };

  const handleUnlockAllAch = async () => {
    unlockAllAchievements();
    playRetroSound('win');
    showActionToast(`🏆 Master Unlocked all Achievements & Trophies with Full XP!`);
    await flushSave();
  };

  const handleWipe = async () => {
    if (window.confirm('⚠️ Are you sure you want to reset all progress, points, and achievements back to 0 for testing?')) {
      await wipeAllProgress();
      playRetroSound('laser');
      showActionToast(`🧹 All stats and progress wiped back to initial state.`);
    }
  };

  const handleResetManhack = async () => {
    try {
      await fetch('/api/leaderboard/reset-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetName: 'Manhack' })
      });
      playRetroSound('laser');
      showActionToast(`🎯 Manhack account XP and game points reset to 0.`);
    } catch (e) {
      showActionToast(`❌ Failed to reset Manhack account`);
    }
  };

  const handleForceSync = async () => {
    await flushSave();
    playRetroSound('coin');
    showActionToast(`☁️ State forcefully saved to Firestore database & local cache!`);
  };

  // Party trigger & Telemetry state
  const [partyTriggerSuccess, setPartyTriggerSuccess] = useState('');
  const [pingMs, setPingMs] = useState(14);
  const [activeUsersCount, setActiveUsersCount] = useState(128);

  // Injector state
  const [injectedGames, setInjectedGames] = useState<Game[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newIframe, setNewIframe] = useState('');
  const [newCategory, setNewCategory] = useState('Arcade');
  const [newThumb, setNewThumb] = useState('');
  const [newColor, setNewColor] = useState('#7c3aed');
  const [newControls, setNewControls] = useState('WASD to move, Space to action');
  const [injectSuccess, setInjectSuccess] = useState('');

  // Announcement state
  const [announcementText, setAnnouncementText] = useState('');
  const [announceSuccess, setAnnounceSuccess] = useState('');

  // God Mode hacks
  const [godModeAura, setGodModeAura] = useState(() => {
    return localStorage.getItem('nexus_godmode_aura') === 'true';
  });
  const [matrixRain, setMatrixRain] = useState(() => {
    return localStorage.getItem('nexus_matrix_rain') === 'true';
  });

  // Sync injected games, broadcast, and visual effects from Firestore
  useEffect(() => {
    const unsubInjected = onSnapshot(collection(db, 'injected_games'), (snapshot) => {
      const list: Game[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Game);
      });
      setInjectedGames(list);
    }, (err) => console.warn('Injected games listener error:', err));

    // Fetch initial state from server API
    fetch('/api/broadcast')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && typeof data.message === 'string') {
          setAnnouncementText(data.message);
        }
      })
      .catch(() => {});

    fetch('/api/effects')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (typeof data.godModeAura === 'boolean') setGodModeAura(data.godModeAura);
          if (typeof data.matrixRain === 'boolean') setMatrixRain(data.matrixRain);
        }
      })
      .catch(() => {});

    const unsubBroadcast = onSnapshot(doc(db, 'config', 'broadcast'), (snapshot) => {
      if (snapshot.exists()) {
        setAnnouncementText(snapshot.data().message || '');
      }
    }, (err) => console.warn('Broadcast listener error:', err));

    const unsubEffects = onSnapshot(doc(db, 'config', 'effects'), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (typeof data.godModeAura === 'boolean') {
          setGodModeAura(data.godModeAura);
          localStorage.setItem('nexus_godmode_aura', data.godModeAura ? 'true' : 'false');
        }
        if (typeof data.matrixRain === 'boolean') {
          setMatrixRain(data.matrixRain);
          localStorage.setItem('nexus_matrix_rain', data.matrixRain ? 'true' : 'false');
          window.dispatchEvent(new CustomEvent('nexus_matrix_toggle', { detail: data.matrixRain }));
        }
      }
    }, (err) => console.warn('Effects listener error:', err));

    return () => {
      unsubInjected();
      unsubBroadcast();
      unsubEffects();
    };
  }, []);

  const handleInjectGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newIframe.trim()) return;

    const newGame: Game = {
      id: `custom-injected-${Date.now()}`,
      title: newTitle.trim(),
      description: 'Owner-Injected Special Custom Title.',
      thumbnail: newThumb.trim() || 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      color: newColor,
      category: newCategory,
      iframe: newIframe.trim(),
      controls: newControls.trim() || 'Standard Keyboard & Mouse',
      rating: 5.0,
      featured: true,
      trending: true,
    };

    // Save to local storage for immediate persistence
    try {
      const saved = localStorage.getItem('nexus_injected_games');
      const games = saved ? JSON.parse(saved) : [];
      games.push(newGame);
      localStorage.setItem('nexus_injected_games', JSON.stringify(games));
      window.dispatchEvent(new Event('nexus_games_updated'));
      setInjectedGames(prev => [...prev.filter(g => g.id !== newGame.id), newGame]);
    } catch (e) {}

    playRetroSound('win');
    setInjectSuccess(`"${newGame.title}" successfully injected into the global Nexus catalog!`);
    setTimeout(() => setInjectSuccess(''), 4000);

    setNewTitle('');
    setNewIframe('');
    setNewThumb('');

    try {
      await setDoc(doc(db, 'injected_games', newGame.id), newGame);
    } catch (err) {
      console.warn('Firestore game injection sync notice (persisted locally):', err);
    }
  };

  const handleRemoveInjected = async (id: string) => {
    try {
      const saved = localStorage.getItem('nexus_injected_games');
      if (saved) {
        const games = JSON.parse(saved).filter((g: any) => g.id !== id);
        localStorage.setItem('nexus_injected_games', JSON.stringify(games));
        window.dispatchEvent(new Event('nexus_games_updated'));
      }
      setInjectedGames(prev => prev.filter(g => g.id !== id));
      playRetroSound('laser');
    } catch (e) {}

    try {
      await deleteDoc(doc(db, 'injected_games', id));
    } catch (err) {
      console.warn('Firestore game remove notice:', err);
    }
  };

  const handleSaveAnnouncement = async () => {
    const text = announcementText.trim();
    if (!text) {
      handleClearAnnouncement();
      return;
    }

    // 1. Instant local and cross-tab update
    localStorage.setItem('nexus_site_announcement', text);
    window.dispatchEvent(new Event('nexus_announcement_updated'));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nexus_broadcast_channel');
        bc.postMessage({ message: text, ts: Date.now() });
        bc.close();
      }
    } catch (e) {}

    playRetroSound('coin');
    setAnnounceSuccess('Global announcement broadcast published live to all visitors!');
    setTimeout(() => setAnnounceSuccess(''), 4000);

    // 2. Publish to backend server API (triggers SSE to all connected visitors)
    try {
      await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          updatedBy: user?.email || 'alexsarsero@gmail.com'
        })
      });
    } catch (err) {
      console.warn('Server broadcast sync notice:', err);
    }

    // 3. Dual-sync to Firestore
    try {
      await setDoc(doc(db, 'config', 'broadcast'), {
        message: text,
        updatedBy: user?.email || 'alexsarsero@gmail.com',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore broadcast sync notice (handled by server):', err);
    }
  };

  const handleClearAnnouncement = async () => {
    setAnnouncementText('');
    localStorage.removeItem('nexus_site_announcement');
    window.dispatchEvent(new Event('nexus_announcement_updated'));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nexus_broadcast_channel');
        bc.postMessage({ message: '', ts: Date.now() });
        bc.close();
      }
    } catch (e) {}

    playRetroSound('laser');
    setAnnounceSuccess('Announcement broadcast removed.');
    setTimeout(() => setAnnounceSuccess(''), 3000);

    // Delete on server
    try {
      await fetch('/api/broadcast', { method: 'DELETE' });
    } catch (err) {
      console.warn('Server clear broadcast notice:', err);
    }

    // Delete in Firestore
    try {
      await setDoc(doc(db, 'config', 'broadcast'), {
        message: '',
        updatedBy: user?.email || 'alexsarsero@gmail.com',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('Firestore clear announcement notice:', err);
    }
  };

  const toggleGodModeAura = async () => {
    const next = !godModeAura;
    setGodModeAura(next);
    localStorage.setItem('nexus_godmode_aura', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('nexus_godmode_toggle', { detail: next }));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nexus_effects_channel');
        bc.postMessage({ godModeAura: next });
        bc.close();
      }
    } catch (e) {}
    playRetroSound(next ? 'powerup' : 'laser');

    // Server API update
    try {
      await fetch('/api/effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ godModeAura: next })
      });
    } catch (err) {
      console.warn('Server effects sync notice:', err);
    }

    try {
      await setDoc(doc(db, 'config', 'effects'), {
        godModeAura: next,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore godModeAura notice:', err);
    }
  };

  const toggleMatrixRain = async () => {
    const next = !matrixRain;
    setMatrixRain(next);
    localStorage.setItem('nexus_matrix_rain', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('nexus_matrix_toggle', { detail: next }));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nexus_effects_channel');
        bc.postMessage({ matrixRain: next });
        bc.close();
      }
    } catch (e) {}
    playRetroSound(next ? 'powerup' : 'laser');

    // Server API update
    try {
      await fetch('/api/effects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matrixRain: next })
      });
    } catch (err) {
      console.warn('Server matrixRain sync notice:', err);
    }

    try {
      await setDoc(doc(db, 'config', 'effects'), {
        matrixRain: next,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (err) {
      console.warn('Firestore matrixRain notice:', err);
    }
  };

  const handleTriggerGlobalParty = async (mode: 'fireworks' | 'cannon' = 'fireworks') => {
    // 1. Instant local & broadcast dispatch for immediate celebration on current screen
    window.dispatchEvent(new CustomEvent('nexus_party_fire', { detail: { mode } }));
    localStorage.setItem('nexus_party_signal', JSON.stringify({ mode, ts: Date.now() }));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('nexus_party_channel');
        bc.postMessage({ mode, ts: Date.now() });
        bc.close();
      }
    } catch (e) {}

    playRetroSound('win');
    setPartyTriggerSuccess(`🎉 Global ${mode.toUpperCase()} triggered live for all connected visitors!`);
    setTimeout(() => setPartyTriggerSuccess(''), 4500);

    // 2. Broadcast to server API so ALL visitors on the website receive it via SSE/polling
    try {
      await fetch('/api/party', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          triggeredBy: user?.email || 'alexsarsero@gmail.com'
        })
      });
    } catch (e) {
      console.warn('Server party broadcast notice:', e);
    }

    // 3. Dual-sync to Firestore
    try {
      await setDoc(doc(db, 'config', 'party'), {
        timestamp: Date.now(),
        mode,
        triggeredBy: user?.email || 'alexsarsero@gmail.com',
      });
    } catch (err) {
      console.warn('Firestore party trigger notice (handled by server):', err);
    }
  };

  if (!isOwner) {
    return (
      <div className="flex-1 min-h-[80vh] flex items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-black/80 border border-amber-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl shadow-amber-500/10 text-center space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400 shadow-inner">
            <Crown className="w-8 h-8" />
          </div>

          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
              Owner Vault Restricted
            </h1>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              This classified control deck is strictly reserved for the owner account:
              <br />
              <span className="text-amber-400 font-mono font-bold text-sm block mt-1">alexsarsero@gmail.com</span>
            </p>
            {user && (
              <p className="text-xs text-slate-500 mt-3 bg-white/5 p-2 rounded-xl border border-white/10">
                Currently signed in as: <span className="text-slate-300 font-semibold">{user.email}</span>
              </p>
            )}
          </div>

          <button
            onClick={() => signIn()}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-black font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Sign in as alexsarsero@gmail.com
          </button>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <p className="text-[11px] text-slate-400">Or use instant owner clearance bypass:</p>
            <button
              onClick={() => {
                unlockOwner();
                playRetroSound('levelup');
              }}
              className="w-full py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              ⚡ One-Click Owner Overlord Unlock
            </button>
          </div>

          <p className="text-[10px] text-slate-600 uppercase tracking-widest font-mono">
            Nexus Security Clearance Level 10 Required
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 sm:p-10 max-w-6xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header Banner */}
      <header className="relative overflow-hidden bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-black border border-amber-500/30 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl shadow-amber-500/10">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Crown className="w-64 h-64 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest">
              <Crown className="w-3.5 h-3.5" />
              Owner Overlord Status Active
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              Nexus Owner Vault & Control Deck
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Welcome back, <span className="text-amber-400 font-bold">{user?.displayName || 'Site Owner'}</span> (<span className="font-mono text-xs">{user?.email || 'alexsarsero@gmail.com'}</span>). You have full override privileges across the entire Nexus Games platform.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-black/50 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-black flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/20">
              👑
            </div>
            <div>
              <p className="text-xs font-bold text-white">Owner Privilege Level</p>
              <p className="text-[11px] text-amber-400 font-mono font-bold uppercase tracking-wider">Level 10 - Unrestricted God Mode</p>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto no-scrollbar">
        {[
          { id: 'hacks', label: '⚡ Admin Abuse & God Mode', icon: Zap },
          { id: 'injector', label: 'Custom Game Injector', icon: PlusCircle },
          { id: 'command', label: 'Live Command HUD & Fireworks', icon: Rocket },
          { id: 'broadcast', label: 'Site Broadcast Banner', icon: Radio },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                playRetroSound('coin');
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive 
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/20 font-black scale-105' 
                  : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Action Toast Notification */}
      <AnimatePresence>
        {actionToast && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black font-black px-6 py-3 rounded-2xl shadow-xl shadow-amber-500/30 flex items-center justify-between gap-3 text-xs sm:text-sm"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 shrink-0" />
              <span>{actionToast}</span>
            </div>
            <button
              onClick={() => setActionToast('')}
              className="text-black/70 hover:text-black font-mono font-bold text-xs cursor-pointer ml-4"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TAB CONTENT 1: Admin Abuse & God Mode */}
      {activeTab === 'hacks' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Live Overlord Status HUD */}
          <div className="bg-gradient-to-r from-slate-900/90 via-black/80 to-slate-900/90 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-black uppercase tracking-wider mb-1">
                  <Activity className="w-4 h-4" />
                  Live Overlord Profile Telemetry
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3">
                  <span>Level {level}</span>
                  <span className="text-amber-400 text-base font-bold px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                    {levelTitle}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  All stat injections instantly sync to Firestore cloud storage and browser local cache.
                </p>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Game Points</p>
                  <p className="text-lg font-black font-mono text-amber-400">+{gamePoints.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Trophy XP</p>
                  <p className="text-lg font-black font-mono text-emerald-400">+{totalXp.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Leaderboard Score</p>
                  <p className="text-lg font-black font-mono text-purple-400">{totalScore.toLocaleString()}</p>
                </div>
                <div className="bg-white/5 border border-white/10 p-3.5 rounded-2xl text-center flex flex-col justify-center items-center">
                  <button
                    onClick={handleForceSync}
                    className="w-full h-full py-1.5 px-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Force Cloud Sync
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* 1. Points Abuse Deck */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Points Abuse & Currency Injections</h3>
                  <p className="text-xs text-slate-400">Instantly grant game points for shop & crate unboxings</p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '+1,000 Points', amount: 1000 },
                  { label: '+10,000 Points', amount: 10000 },
                  { label: '+50,000 Points', amount: 50000 },
                  { label: 'Set 999,999 (Max)', isSet: true, amount: 999999 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => btn.isSet ? handleSetPoints(btn.amount) : handleAddPoints(btn.amount)}
                    className="py-3 px-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold font-mono text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Custom Points Injection Form */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Custom Points Injection:</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customPointsInput}
                    onChange={(e) => setCustomPointsInput(e.target.value)}
                    placeholder="Enter amount (e.g. 25000)"
                    className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(customPointsInput, 10);
                      if (val > 0) handleAddPoints(val);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-xs rounded-2xl transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Inject Points
                  </button>
                </div>
              </div>
            </div>

            {/* 2. XP Abuse Deck */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">XP Abuse & Level Acceleration</h3>
                  <p className="text-xs text-slate-400">Supercharge level rank, titles, and profile standing</p>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { label: '+1,000 XP', amount: 1000 },
                  { label: '+5,000 XP', amount: 5000 },
                  { label: '+25,000 XP', amount: 25000 },
                  { label: 'Level 100 God (250k)', isSet: true, amount: 250000 },
                ].map((btn) => (
                  <button
                    key={btn.label}
                    onClick={() => btn.isSet ? handleSetXp(btn.amount) : handleAddXp(btn.amount)}
                    className="py-3 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold font-mono text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Crown className="w-3.5 h-3.5 text-emerald-400" />
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Custom XP Injection Form */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <p className="text-xs text-slate-400 font-medium">Custom Trophy XP Injection:</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={customXpInput}
                    onChange={(e) => setCustomXpInput(e.target.value)}
                    placeholder="Enter XP (e.g. 15000)"
                    className="flex-1 bg-black/60 border border-white/15 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono"
                  />
                  <button
                    onClick={() => {
                      const val = parseInt(customXpInput, 10);
                      if (val > 0) handleAddXp(val);
                    }}
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-black font-black text-xs rounded-2xl transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    Inject XP
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Master Cosmetic & Trophy Overrides */}
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-purple-500/10 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-xl md:col-span-2 space-y-5">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-black flex items-center justify-center font-bold shrink-0 shadow-md shadow-amber-400/30">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Master Cosmetic & Achievement Overrides</h3>
                  <p className="text-xs text-slate-300">Grant full access to every badge, avatar skin, and crate item on the site</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Unlock All Avatars */}
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-purple-400" />
                      All 15+ Custom Avatars
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Unlock every single cosmetic avatar profile frame including the Sovereign Crown.
                    </p>
                  </div>
                  <button
                    onClick={handleUnlockAllAvatars}
                    className="w-full py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Unlock All Avatars
                  </button>
                </div>

                {/* Unlock All Achievements */}
                <div className="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      All 24+ Achievements
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Instantly grant 100% completed trophies, secret achievements, and catalog badges.
                    </p>
                  </div>
                  <button
                    onClick={handleUnlockAllAch}
                    className="w-full py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-black text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Unlock All Badges
                  </button>
                </div>

                {/* Wipe / Reset Progress */}
                <div className="bg-black/50 border border-red-500/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      Reset Stats to Zero
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Cleanly wipe points, XP, and achievements back to initial state for testing.
                    </p>
                  </div>
                  <button
                    onClick={handleWipe}
                    className="w-full py-2.5 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Wipe Progress
                  </button>
                </div>

                {/* Reset Manhack Account */}
                <div className="bg-black/50 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Reset Manhack Account
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Wipe all XP, game points, and standing for player "Manhack" back to 0.
                    </p>
                  </div>
                  <button
                    onClick={handleResetManhack}
                    className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-xs rounded-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Reset Manhack Stats
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Audio Soundboard */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Owner 8-Bit Retro Soundboard</h3>
                  <p className="text-xs text-slate-400">Trigger arcade audio synthesizer effects live</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { name: 'Coin Pickup', type: 'coin' as const, color: 'hover:border-yellow-400' },
                  { name: 'Laser Cannon', type: 'laser' as const, color: 'hover:border-red-400' },
                  { name: 'Level Up Fanfare', type: 'levelup' as const, color: 'hover:border-emerald-400' },
                  { name: 'Victory Tune', type: 'win' as const, color: 'hover:border-purple-400' },
                  { name: 'Power Up Surge', type: 'powerup' as const, color: 'hover:border-sky-400' },
                ].map((s) => (
                  <button
                    key={s.name}
                    onClick={() => playRetroSound(s.type)}
                    className={`p-3.5 bg-black/40 border border-white/10 rounded-2xl text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 transition-all flex flex-col items-center gap-2 ${s.color} active:scale-95 cursor-pointer`}
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Visual Hacks */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-5 backdrop-blur-xl">
              <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Visual Engine Toggles</h3>
                  <p className="text-xs text-slate-400">Custom shaders and golden owner aura</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Flame className="w-4 h-4 text-amber-400" />
                      God Mode Golden Aura
                    </p>
                    <p className="text-xs text-slate-400">Add a glowing golden aura frame to game players</p>
                  </div>
                  <button
                    onClick={toggleGodModeAura}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                      godModeAura ? 'bg-amber-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                      godModeAura ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                  <div>
                    <p className="text-sm font-bold text-white flex items-center gap-2">
                      <Tv className="w-4 h-4 text-emerald-400" />
                      Matrix Green Code Background
                    </p>
                    <p className="text-xs text-slate-400">Display matrix digital code stream on background</p>
                  </div>
                  <button
                    onClick={toggleMatrixRain}
                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                      matrixRain ? 'bg-emerald-500' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                      matrixRain ? 'right-1' : 'left-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 2: Custom Game Injector */}
      {activeTab === 'injector' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Live Custom Game Injector</h3>
                <p className="text-xs text-slate-400">Inject any HTML5 or iframe game directly into the Nexus catalog</p>
              </div>
            </div>

            {injectSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {injectSuccess}
              </div>
            )}

            <form onSubmit={handleInjectGame} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Game Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Cyber Blade 2099"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    iFrame Game Embed URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={newIframe}
                    onChange={(e) => setNewIframe(e.target.value)}
                    placeholder="https://example.com/game/index.html"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Arcade">Arcade</option>
                    <option value="Action">Action</option>
                    <option value="Racing">Racing</option>
                    <option value="Sports">Sports</option>
                    <option value="Puzzle">Puzzle</option>
                    <option value="Horror">Horror</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Thumbnail Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    value={newThumb}
                    onChange={(e) => setNewThumb(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Controls Description
                  </label>
                  <input
                    type="text"
                    value={newControls}
                    onChange={(e) => setNewControls(e.target.value)}
                    placeholder="WASD to move, Space to shoot"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Inject Game Into Catalog
              </button>
            </form>
          </div>

          {/* List of Injected Games */}
          {injectedGames.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                Owner Injected Titles ({injectedGames.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {injectedGames.map((game) => (
                  <div 
                    key={game.id}
                    className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img 
                        src={game.thumbnail} 
                        alt={game.title} 
                        className="w-12 h-12 rounded-xl object-cover shrink-0" 
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">{game.title}</p>
                        <p className="text-xs text-amber-400 font-mono">{game.category}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveInjected(game.id)}
                      className="p-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer"
                      title="Remove game"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* TAB CONTENT 3: Live Command HUD & Fireworks */}
      {activeTab === 'command' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header Card */}
          <div className="bg-gradient-to-br from-amber-950/40 via-black/80 to-purple-950/40 border border-amber-500/30 rounded-3xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 border-b border-white/10 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mb-1">
                  <Activity className="w-4 h-4 animate-pulse" /> Live Telemetry & Control Deck
                </div>
                <h3 className="text-2xl font-black text-white">Site Command & Global Celebrations</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Trigger site-wide real-time fireworks, test audio synthesis, and monitor global database telemetry.
                </p>
              </div>

              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-2 rounded-2xl text-xs font-bold font-mono">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                FIRESTORE LIVE SYNC ACTIVE
              </div>
            </div>

            {/* Global Fireworks Trigger Section */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <PartyPopper className="w-4 h-4" /> Real-Time Global Celebration Signals
              </h4>
              <p className="text-xs text-slate-300">
                Clicking a celebration button broadcasts a realtime signal to Firestore. Every visitor currently browsing the site will experience live canvas fireworks!
              </p>

              {partyTriggerSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-4 rounded-2xl text-xs font-bold flex items-center gap-2 animate-bounce">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  {partyTriggerSuccess}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleTriggerGlobalParty('fireworks')}
                  className="p-5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/20 flex items-center justify-center text-black">
                      <Rocket className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">Launch Fireworks Show</p>
                      <p className="text-[11px] opacity-80">Full multi-colored particle shower</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5" />
                </button>

                <button
                  onClick={() => handleTriggerGlobalParty('cannon')}
                  className="p-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-purple-500/20 transition-all active:scale-95 flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white">
                      <PartyPopper className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">Confetti Cannon Blast</p>
                      <p className="text-[11px] opacity-80">High-velocity central burst</p>
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Realtime Latency</span>
                <Wifi className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{pingMs} ms</p>
              <p className="text-[11px] text-emerald-400 font-mono">⚡ Low Latency Edge Socket</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Global Catalog Titles</span>
                <Database className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">{15 + injectedGames.length}</p>
              <p className="text-[11px] text-amber-400 font-mono">{injectedGames.length} Custom Injected</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>System Memory</span>
                <Cpu className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">100% OK</p>
              <p className="text-[11px] text-purple-400 font-mono">Zero Heap Leaks</p>
            </div>

            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-2 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 text-xs font-bold">
                <span>Broadcast Engine</span>
                <Radio className="w-4 h-4 text-yellow-400" />
              </div>
              <p className="text-2xl font-black text-white font-mono">
                {announcementText ? 'ONLINE' : 'STANDBY'}
              </p>
              <p className="text-[11px] text-yellow-400 font-mono truncate">
                {announcementText ? announcementText : 'No notice active'}
              </p>
            </div>
          </div>

          {/* Retro Audio Synthesizer Station */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" /> Owner WebAudio Sound Test Console
                </h4>
                <p className="text-xs text-slate-400">Synthesize 8-bit arcade audio waveforms in real time</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {[
                { name: 'Coin Sound', sound: 'coin', color: 'from-amber-500/20 to-yellow-500/20 border-amber-500/30 text-amber-300' },
                { name: 'Laser Beam', sound: 'laser', color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-cyan-300' },
                { name: 'Level Up', sound: 'levelup', color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-300' },
                { name: 'Victory Win', sound: 'win', color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-300' },
                { name: 'Powerup', sound: 'powerup', color: 'from-rose-500/20 to-orange-500/20 border-rose-500/30 text-rose-300' },
              ].map((sfx) => (
                <button
                  key={sfx.sound}
                  onClick={() => playRetroSound(sfx.sound as any)}
                  className={`p-4 bg-gradient-to-b ${sfx.color} border rounded-2xl flex flex-col items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer font-bold text-xs`}
                >
                  <Play className="w-4 h-4" />
                  {sfx.name}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB CONTENT 3: Broadcast Banner */}
      {activeTab === 'broadcast' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Global Banner Broadcast Notice</h3>
              <p className="text-xs text-slate-400">Display a real-time floating announcement bar at the top of the entire website for all visitors</p>
            </div>
          </div>

          {announceSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {announceSuccess}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Announcement Message (Leave empty to hide)
              </label>
              <input
                type="text"
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="📢 OWNER ANNOUNCEMENT: Welcome to Nexus Games! Double XP Weekend Active!"
                className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveAnnouncement}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black text-sm rounded-2xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
              >
                Publish Broadcast Live
              </button>

              {announcementText && (
                <button
                  onClick={handleClearAnnouncement}
                  className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-xs font-bold transition-all cursor-pointer"
                >
                  Clear Announcement
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
