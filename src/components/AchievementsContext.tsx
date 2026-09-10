import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { useSettings } from './SettingsContext';
import { soundManager } from '../utils/soundEffects';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { containsProfanity } from '../utils/profanityFilter';
import { getHlAccountName } from '../utils/nameGenerator';
import { Trophy, Star, Sparkles, Zap, Crown, ShieldAlert, Palette, Eye, Radio, Flame, Lock, Unlock, CheckCircle2, Rocket } from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xp: number;
  iconName: string;
  category: 'Explorer' | 'Customizer' | 'Gamer' | 'Secret' | 'Community';
  tier: 'Bronze' | 'Silver' | 'Gold' | 'Platinum';
  secret?: boolean;
  maxProgress?: number;
}

export const ACHIEVEMENTS_CATALOG: Achievement[] = [
  {
    id: 'first_blood',
    title: 'First Blood',
    description: 'Launch and play your first game on Nexus Games.',
    xp: 100,
    iconName: 'Rocket',
    category: 'Gamer',
    tier: 'Bronze',
  },
  {
    id: 'favorite_collector',
    title: 'Game Curator',
    description: 'Save at least 3 games to your Favorites list.',
    xp: 150,
    iconName: 'Star',
    category: 'Gamer',
    tier: 'Silver',
    maxProgress: 3,
  },
  {
    id: 'hoarder_supreme',
    title: 'Vault Collector',
    description: 'Add 5 or more titles to your Favorites collection.',
    xp: 200,
    iconName: 'Bookmark',
    category: 'Gamer',
    tier: 'Gold',
    maxProgress: 5,
  },
  {
    id: 'veteran_gamer',
    title: 'Game Marathoner',
    description: 'Launch and play at least 5 different games in Nexus.',
    xp: 250,
    iconName: 'Gamepad2',
    category: 'Gamer',
    tier: 'Gold',
    maxProgress: 5,
  },
  {
    id: 'genre_explorer',
    title: 'Genre Explorer',
    description: 'Explore games across 4 different categories.',
    xp: 200,
    iconName: 'Flame',
    category: 'Gamer',
    tier: 'Gold',
    maxProgress: 4,
  },
  {
    id: 'night_owl',
    title: 'Midnight Gamer',
    description: 'Play games late at night (after 10 PM or before 5 AM).',
    xp: 200,
    iconName: 'Eye',
    category: 'Gamer',
    tier: 'Gold',
  },
  {
    id: 'aesthetic_master',
    title: 'Aesthetic Overhaul',
    description: 'Customize your theme accent color or background atmosphere canvas.',
    xp: 150,
    iconName: 'Palette',
    category: 'Customizer',
    tier: 'Silver',
  },
  {
    id: 'sound_maestro',
    title: 'Sound Maestro',
    description: 'Toggle UI audio sound effects on or off in settings.',
    xp: 100,
    iconName: 'Zap',
    category: 'Customizer',
    tier: 'Bronze',
  },
  {
    id: 'panic_agent',
    title: 'Tactical Retreat',
    description: 'Trigger Panic Mode for a stealth emergency redirect.',
    xp: 100,
    iconName: 'ShieldAlert',
    category: 'Explorer',
    tier: 'Bronze',
  },
  {
    id: 'cloaking_expert',
    title: 'Incognito Agent',
    description: 'Enable custom tab cloaking to disguise your browser tab.',
    xp: 150,
    iconName: 'Lock',
    category: 'Customizer',
    tier: 'Silver',
  },
  {
    id: 'fps_enthusiast',
    title: 'Telemetry Specialist',
    description: 'Enable the Live FPS & Performance overlay in settings.',
    xp: 100,
    iconName: 'Zap',
    category: 'Customizer',
    tier: 'Bronze',
  },
  {
    id: 'search_master',
    title: 'Search Recon',
    description: 'Use the search bar to find games in the catalog.',
    xp: 100,
    iconName: 'Search',
    category: 'Explorer',
    tier: 'Bronze',
  },
  {
    id: 'fullscreen_pro',
    title: 'Max Immersion',
    description: 'Enter Fullscreen Mode while playing any game.',
    xp: 150,
    iconName: 'Maximize',
    category: 'Gamer',
    tier: 'Silver',
  },
  {
    id: 'updates_scholar',
    title: 'Patch Notes Scholar',
    description: 'Read the official Updates & Release Notes page.',
    xp: 100,
    iconName: 'FileText',
    category: 'Explorer',
    tier: 'Bronze',
  },
  {
    id: 'party_starter',
    title: 'Party Animal',
    description: 'Trigger or experience a site-wide live fireworks celebration.',
    xp: 200,
    iconName: 'Sparkles',
    category: 'Explorer',
    tier: 'Gold',
  },
  {
    id: 'custom_game_tester',
    title: 'Community Game Tester',
    description: 'Play any custom injected game or launch 3 games in the catalog.',
    xp: 200,
    iconName: 'Radio',
    category: 'Community',
    tier: 'Silver',
    maxProgress: 3,
  },
  {
    id: 'vault_visitor',
    title: 'Platform Insider',
    description: 'Visit the Nexus Achievements dashboard to view your profile statistics.',
    xp: 250,
    iconName: 'Crown',
    category: 'Explorer',
    tier: 'Platinum',
  },
  {
    id: 'easter_egg_king',
    title: 'Secret Overlord',
    description: 'Tap the Nexus header logo 5 times in rapid succession!',
    xp: 300,
    iconName: 'Trophy',
    category: 'Secret',
    tier: 'Platinum',
    secret: true,
  },
  {
    id: 'secret_agent',
    title: 'Shadow Stealth',
    description: 'Enable both Panic Mode and Tab Cloaking for ultimate stealth.',
    xp: 250,
    iconName: 'ShieldCheck',
    category: 'Secret',
    tier: 'Platinum',
    secret: true,
  },
  {
    id: 'matrix_surfer',
    title: 'Matrix Resident',
    description: 'Switch background atmosphere canvas to Matrix Emerald.',
    xp: 200,
    iconName: 'Sparkles',
    category: 'Secret',
    tier: 'Gold',
    secret: true,
  }
];

export interface UnlockedAchievementData {
  unlockedAt: number;
  progress?: number;
}

interface ToastNotification {
  id: string;
  achievement: Achievement;
}

interface AchievementsContextType {
  unlocked: Record<string, UnlockedAchievementData>;
  progressData: Record<string, number>;
  totalXp: number;
  bonusXp: number;
  gamePoints: number;
  gamesPlayed: number;
  totalScore: number;
  level: number;
  levelTitle: string;
  unlockAchievement: (id: string, silent?: boolean) => void;
  unlockAllAchievements: () => void;
  wipeAllProgress: () => Promise<void>;
  clearAchievements: () => void;
  incrementProgress: (id: string, amount?: number) => void;
  isUnlocked: (id: string) => boolean;
  getProgress: (id: string) => number;
  recordGamePlay: (gameId: string) => void;
  addGameTimePoints: (amount: number) => void;
  spendGamePoints: (amount: number) => boolean;
  addGamePoints: (amount: number) => void;
  setCustomPoints: (amount: number) => void;
  addBonusXp: (amount: number) => void;
  setCustomXp: (amount: number) => void;
  flushSave: () => Promise<void>;
  availableXp: number;
  spentXp: number;
  spendXp: (amount: number) => boolean;
  refundXp: (amount: number) => void;
}

const LEVEL_TITLES = [
  'Novice Gamer',
  'Nexus Initiate',
  'Cyber Explorer',
  'Arcade Specialist',
  'Matrix Operative',
  'Overlord Vanguard',
  'Nexus Legend',
];

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export const AchievementsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const { settings } = useSettings();

  const [unlocked, setUnlocked] = useState<Record<string, UnlockedAchievementData>>(() => {
    try {
      const saved = localStorage.getItem('nexus_achievements');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [progressData, setProgressData] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('nexus_achievements_progress');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [gamePoints, setGamePoints] = useState<number>(() => {
    try {
      const uname = (localStorage.getItem('username') || '').toLowerCase().trim();
      if (uname === 'manhack') {
        localStorage.setItem('nexus_game_points', '0');
        return 0;
      }
      const saved = localStorage.getItem('nexus_game_points');
      const val = saved ? parseInt(saved, 10) || 0 : 0;
      if (uname === 'poison zombie' || uname === 'poision zombie') {
        return Math.max(val, 1000);
      }
      return val;
    } catch (e) {
      return 0;
    }
  });

  const [gamesPlayed, setGamesPlayed] = useState<number>(() => {
    try {
      const uname = (localStorage.getItem('username') || '').toLowerCase().trim();
      if (uname === 'manhack') {
        localStorage.setItem('nexus_games_played', '0');
        return 0;
      }
      const saved = localStorage.getItem('nexus_games_played');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });

  const [spentXp, setSpentXp] = useState<number>(() => {
    try {
      const uname = (localStorage.getItem('username') || '').toLowerCase().trim();
      if (uname === 'manhack') {
        localStorage.setItem('nexus_spent_xp', '0');
        return 0;
      }
      const saved = localStorage.getItem('nexus_spent_xp');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });

  const [bonusXp, setBonusXp] = useState<number>(() => {
    try {
      const uname = (localStorage.getItem('username') || '').toLowerCase().trim();
      if (uname === 'manhack') {
        localStorage.setItem('nexus_bonus_xp', '0');
        return 0;
      }
      const saved = localStorage.getItem('nexus_bonus_xp');
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  });

  const [activeToast, setActiveToast] = useState<ToastNotification | null>(null);
  const [isRemoteLoaded, setIsRemoteLoaded] = useState<boolean>(false);
  const lastConfettiTime = useRef<number>(0);

  const unlockedRef = useRef(unlocked);
  useEffect(() => {
    unlockedRef.current = unlocked;
  }, [unlocked]);

  const progressDataRef = useRef(progressData);
  useEffect(() => {
    progressDataRef.current = progressData;
  }, [progressData]);

  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; }, [user]);

  const profileRef = useRef(profile);
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const gamePointsRef = useRef(gamePoints);
  useEffect(() => { gamePointsRef.current = gamePoints; }, [gamePoints]);

  const gamesPlayedRef = useRef(gamesPlayed);
  useEffect(() => { gamesPlayedRef.current = gamesPlayed; }, [gamesPlayed]);

  const bonusXpRef = useRef(bonusXp);
  useEffect(() => { bonusXpRef.current = bonusXp; }, [bonusXp]);

  const spentXpRef = useRef(spentXp);
  useEffect(() => { spentXpRef.current = spentXp; }, [spentXp]);

  const isSigningOutRef = useRef<boolean>(false);
  const isExplicitWipingRef = useRef<boolean>(false);

  const activeName = profile?.nickname || profile?.displayName || localStorage.getItem('username') || '';
  const isPoisonZombie = activeName.toLowerCase().trim() === 'poison zombie' || activeName.toLowerCase().trim() === 'poision zombie';
  const isManhack = activeName.toLowerCase().trim() === 'manhack';

  // Calculate XP and Level
  const baseTotalXp = Object.keys(unlocked).reduce((acc, id) => {
    const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === id);
    return acc + (ach ? ach.xp : 0);
  }, 0);

  const totalXp = isManhack ? 0 : (isPoisonZombie ? 4000 : (baseTotalXp + bonusXp));
  const availableXp = isManhack ? 0 : Math.max(0, totalXp - spentXp);
  const effectiveGamePoints = isManhack ? 0 : gamePoints;
  const totalScore = isManhack ? 0 : (isPoisonZombie ? 5000 : (totalXp + effectiveGamePoints));
  const effectiveGamesPlayed = isManhack ? 0 : (isPoisonZombie ? 0 : gamesPlayed);
  const level = Math.floor(totalScore / 250) + 1;
  const levelTitle = isManhack ? 'Recruit' : (isPoisonZombie ? 'Recruit' : LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)]);

  // Immediate save helper to sync state to Firestore and localStorage
  const flushSave = useCallback(async () => {
    if (isSigningOutRef.current) return;
    const curUser = userRef.current;
    const curProfile = profileRef.current;
    const curGamePoints = gamePointsRef.current;
    const curGamesPlayed = gamesPlayedRef.current;
    const curBonusXp = bonusXpRef.current;
    const curSpentXp = spentXpRef.current;

    // Safety guard: Never overwrite cloud achievements with empty data unless explicit wipe is active
    if (curUser && curUser.uid && Object.keys(unlockedRef.current).length === 0 && !isExplicitWipingRef.current) {
      return;
    }

    try {
      localStorage.setItem('nexus_achievements', JSON.stringify(unlockedRef.current));
      localStorage.setItem('nexus_achievements_progress', JSON.stringify(progressDataRef.current));
      localStorage.setItem('nexus_game_points', curGamePoints.toString());
      localStorage.setItem('nexus_games_played', curGamesPlayed.toString());
      localStorage.setItem('nexus_bonus_xp', curBonusXp.toString());
      localStorage.setItem('nexus_spent_xp', curSpentXp.toString());
    } catch (e) {}

    // Determine effective persistent player ID
    const effectiveUid = curUser?.uid || localStorage.getItem('nexus_player_id') || (() => {
      const gen = 'player_' + Math.random().toString(36).substring(2, 11);
      try { localStorage.setItem('nexus_player_id', gen); } catch (e) {}
      return gen;
    })();

    let rawUName = curProfile?.nickname || curProfile?.displayName || localStorage.getItem('username') || 'Nexus Explorer';
    if (containsProfanity(rawUName) || rawUName.toLowerCase().includes('sarsero')) {
      rawUName = 'Nexus Explorer';
    }
    const isOwnerUser = (curUser?.email?.toLowerCase().trim() === 'alexsarsero@gmail.com') || (sessionStorage.getItem('isOwner') === 'true');
    let activeUName = getHlAccountName(effectiveUid, isOwnerUser, curUser?.email, rawUName);
    const isPZ = activeUName.toLowerCase().trim() === 'poison zombie' || activeUName.toLowerCase().trim() === 'poision zombie';
    const isManhackUser = activeUName.toLowerCase().trim() === 'manhack';

    const baseCurrentXp = Object.keys(unlockedRef.current).reduce((acc, id) => {
      const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === id);
      return acc + (ach ? ach.xp : 0);
    }, 0);

    const currentXp = isManhackUser ? 0 : (isPZ ? 4000 : (baseCurrentXp + curBonusXp));
    const effectiveGp = isManhackUser ? 0 : (isPZ ? Math.min(curGamePoints, 1000) : curGamePoints);
    const totalScoreVal = isManhackUser ? 0 : (isPZ ? 5000 : (currentXp + effectiveGp));
    const effectiveGamesPlayedCount = isManhackUser ? 0 : (isPZ ? 0 : curGamesPlayed);
    const currentLevel = Math.floor(totalScoreVal / 250) + 1;
    const currentLevelTitle = isManhackUser ? 'Recruit' : (isPZ ? 'Recruit' : LEVEL_TITLES[Math.min(currentLevel - 1, LEVEL_TITLES.length - 1)]);

    // If signed into Firebase Auth, persist to Firestore
    if (curUser && curUser.uid) {
      try {
        await setDoc(doc(db, 'users', curUser.uid, 'data', 'achievements'), {
          unlocked: isManhackUser ? {} : unlockedRef.current,
          progress: isManhackUser ? {} : progressDataRef.current,
          gamePoints: effectiveGp,
          gamesPlayed: effectiveGamesPlayedCount,
          bonusXp: isManhackUser ? 0 : curBonusXp,
          spentXp: isManhackUser ? 0 : curSpentXp,
          updatedAt: new Date().toISOString()
        }, { merge: true });

        const userDocData: any = {
          uid: curUser.uid,
          email: curUser.email,
          photoURL: curUser.photoURL || localStorage.getItem('userpic') || null,
          nickname: activeUName,
          displayName: activeUName,
          totalScore: totalScoreVal,
          totalXp: currentXp,
          bonusXp: isManhackUser ? 0 : curBonusXp,
          gamePoints: effectiveGp,
          gamesPlayed: effectiveGamesPlayedCount,
          achievementsCount: isManhackUser ? 0 : (isPZ ? 0 : Object.keys(unlockedRef.current).length),
          unlockedAchievements: isManhackUser ? {} : unlockedRef.current,
          levelTitle: currentLevelTitle,
          updatedAt: new Date().toISOString()
        };

        await setDoc(doc(db, 'users', curUser.uid), userDocData, { merge: true });
      } catch (err) {
        console.warn('Error in Firestore save:', err);
      }
    }

    // Sync to shared server leaderboard API so all visitors and community members immediately see real player scores
    const userEmail = (curUser?.email || '').toLowerCase().trim();
    const isExcludedOwner = userEmail === 'alexsarsero@gmail.com' || activeUName === 'Gordon Freeman';
    if (!isExcludedOwner) {
      try {
        fetch('/api/leaderboard', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid: effectiveUid,
            email: curUser?.email || null,
            photoURL: curUser?.photoURL || localStorage.getItem('userpic') || null,
            displayName: activeUName,
            equippedAvatar: curProfile?.equippedAvatar || localStorage.getItem('nexus_equipped_avatar') || 'initiate_core',
            totalScore: totalScoreVal,
            achievementXp: currentXp,
            gamePoints: effectiveGp,
            gamesPlayed: effectiveGamesPlayedCount,
            achievementsCount: isManhackUser ? 0 : (isPZ ? 0 : Object.keys(unlockedRef.current).length),
            title: currentLevelTitle,
            isOwner: false
          })
        }).catch(() => {});
      } catch (e) {}
    }
  }, []);

  const clearSessionAchievements = useCallback(async () => {
    // If currently signed in, do a final flush to Firestore so cloud account is 100% saved
    if (userRef.current && userRef.current.uid && Object.keys(unlockedRef.current).length > 0) {
      try {
        await flushSave();
      } catch (e) {
        console.warn('Error saving before signout:', e);
      }
    }

    isSigningOutRef.current = true;
    setUnlocked({});
    setProgressData({});
    setGamePoints(0);
    setGamesPlayed(0);
    setBonusXp(0);
    setSpentXp(0);
    unlockedRef.current = {};
    progressDataRef.current = {};
    gamePointsRef.current = 0;
    gamesPlayedRef.current = 0;
    bonusXpRef.current = 0;
    spentXpRef.current = 0;

    try {
      localStorage.removeItem('nexus_achievements');
      localStorage.removeItem('nexus_achievements_progress');
      localStorage.removeItem('nexus_game_points');
      localStorage.removeItem('nexus_games_played');
      localStorage.removeItem('nexus_bonus_xp');
      localStorage.removeItem('nexus_spent_xp');
    } catch (e) {}

    setTimeout(() => {
      isSigningOutRef.current = false;
    }, 500);
  }, [flushSave]);

  // Listen for explicit sign-out event from AuthContext or anywhere in the app
  useEffect(() => {
    const handleClear = () => {
      clearSessionAchievements();
    };
    window.addEventListener('nexus_achievements_cleared', handleClear);
    return () => window.removeEventListener('nexus_achievements_cleared', handleClear);
  }, [clearSessionAchievements]);

  // Listen for before sign-out to flush data to Firestore
  useEffect(() => {
    const handleBeforeSignout = () => {
      if (userRef.current && userRef.current.uid && Object.keys(unlockedRef.current).length > 0) {
        flushSave();
      }
    };
    window.addEventListener('nexus_before_signout', handleBeforeSignout);
    return () => window.removeEventListener('nexus_before_signout', handleBeforeSignout);
  }, [flushSave]);

  // Sync with Firestore if logged in; NEVER clear achievements on tab refresh or for guests!
  useEffect(() => {
    if (!user) {
      // User is either a guest or waiting for auth to resolve: keep achievements in localStorage/state intact!
      setIsRemoteLoaded(true);
      return;
    }

    isSigningOutRef.current = false;
    setIsRemoteLoaded(false);

    try {
      const unsub = onSnapshot(doc(db, 'users', user.uid, 'data', 'achievements'), async (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data();
          let remoteUnlocked = remoteData.unlocked || {};
          let remoteProgress = remoteData.progress || {};

          // Fallback: Check parent user doc if remoteUnlocked is empty
          if (Object.keys(remoteUnlocked).length === 0) {
            try {
              const userSnap = await getDoc(doc(db, 'users', user.uid));
              if (userSnap.exists() && userSnap.data()?.unlockedAchievements) {
                remoteUnlocked = userSnap.data().unlockedAchievements || {};
              }
            } catch (e) {}
          }

          // Merge local and remote unlocked achievements so nothing gets wiped
          const mergedUnlocked = { ...remoteUnlocked, ...unlockedRef.current };
          const mergedProgress = { ...remoteProgress, ...progressDataRef.current };
          const activeUname = (profile?.nickname || profile?.displayName || localStorage.getItem('username') || '').toLowerCase().trim();
          const isPZ = activeUname === 'poison zombie' || activeUname === 'poision zombie';
          const isManhackUser = activeUname === 'manhack';
          let maxGamePoints = isManhackUser ? 0 : Math.max(
            typeof remoteData.gamePoints === 'number' ? remoteData.gamePoints : 0, 
            parseInt(localStorage.getItem('nexus_game_points') || '0', 10),
            gamePointsRef.current
          );
          if (isPZ) maxGamePoints = Math.max(maxGamePoints, 1000);
          const maxGamesPlayed = isManhackUser ? 0 : Math.max(
            typeof remoteData.gamesPlayed === 'number' ? remoteData.gamesPlayed : 0, 
            parseInt(localStorage.getItem('nexus_games_played') || '0', 10),
            gamesPlayedRef.current
          );
          const maxBonusXp = isManhackUser ? 0 : Math.max(
            typeof remoteData.bonusXp === 'number' ? remoteData.bonusXp : 0,
            parseInt(localStorage.getItem('nexus_bonus_xp') || '0', 10),
            bonusXpRef.current
          );
          const remoteSpentXp = isManhackUser ? 0 : (typeof remoteData.spentXp === 'number' 
            ? remoteData.spentXp 
            : parseInt(localStorage.getItem('nexus_spent_xp') || '0', 10));

          const finalUnlocked = isManhackUser ? {} : mergedUnlocked;
          const finalProgress = isManhackUser ? {} : mergedProgress;

          unlockedRef.current = finalUnlocked;
          progressDataRef.current = finalProgress;
          setUnlocked(finalUnlocked);
          setProgressData(finalProgress);
          setGamePoints(maxGamePoints);
          setGamesPlayed(maxGamesPlayed);
          setBonusXp(maxBonusXp);
          setSpentXp(remoteSpentXp);

          try {
            localStorage.setItem('nexus_achievements', JSON.stringify(finalUnlocked));
            localStorage.setItem('nexus_achievements_progress', JSON.stringify(finalProgress));
            localStorage.setItem('nexus_game_points', maxGamePoints.toString());
            localStorage.setItem('nexus_games_played', maxGamesPlayed.toString());
            localStorage.setItem('nexus_bonus_xp', maxBonusXp.toString());
            localStorage.setItem('nexus_spent_xp', remoteSpentXp.toString());
          } catch (e) {}

          // If local state had more achievements than remote doc, write the merged set back
          if (Object.keys(finalUnlocked).length > Object.keys(remoteUnlocked).length) {
            flushSave();
          }
        } else {
          // Document does not exist yet in Firestore
          // If we have local achievements, write them to Firestore!
          if (Object.keys(unlockedRef.current).length > 0) {
            flushSave();
          }
        }
        setIsRemoteLoaded(true);
      }, (err) => {
        console.warn('Achievements sync offline', err);
        setIsRemoteLoaded(true);
      });

      return () => {
        unsub();
      };
    } catch (e) {
      console.error(e);
      setIsRemoteLoaded(true);
    }
  }, [user, flushSave, profile?.nickname, profile?.displayName]);

  // Automatic reset if active account is Manhack
  useEffect(() => {
    if (isManhack) {
      try {
        localStorage.setItem('nexus_game_points', '0');
        localStorage.setItem('nexus_bonus_xp', '0');
        localStorage.setItem('nexus_spent_xp', '0');
        localStorage.setItem('nexus_achievements', '{}');
        localStorage.setItem('nexus_achievements_progress', '{}');
      } catch (e) {}
      setGamePoints(0);
      setBonusXp(0);
      setSpentXp(0);
      setUnlocked({});
      setProgressData({});
      flushSave();
    }
  }, [isManhack, flushSave]);

  // Sync to localStorage on every change and debounce Firestore save (800ms)
  useEffect(() => {
    if (isSigningOutRef.current) return;

    try {
      localStorage.setItem('nexus_achievements', JSON.stringify(unlocked));
      localStorage.setItem('nexus_achievements_progress', JSON.stringify(progressData));
      localStorage.setItem('nexus_game_points', gamePoints.toString());
      localStorage.setItem('nexus_games_played', gamesPlayed.toString());
      localStorage.setItem('nexus_bonus_xp', bonusXp.toString());
      localStorage.setItem('nexus_spent_xp', spentXp.toString());
    } catch (e) {
      console.error(e);
    }

    if (!user || !isRemoteLoaded) return;

    const saveTimer = setTimeout(() => {
      flushSave();
    }, 800);

    return () => clearTimeout(saveTimer);
  }, [unlocked, progressData, gamePoints, gamesPlayed, bonusXp, spentXp, user, isRemoteLoaded, flushSave]);

  // Flush saves on page close or tab hidden
  useEffect(() => {
    const handleBeforeUnload = () => {
      flushSave();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushSave();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [flushSave]);

  const recordGamePlay = useCallback((_gameId: string) => {
    setGamesPlayed(prev => prev + 1);
  }, []);

  const addGameTimePoints = useCallback((amount: number = 10) => {
    setGamePoints(prev => prev + amount); // +10 Points per minute active
  }, []);

  const triggerToast = useCallback((ach: Achievement) => {
    setActiveToast({ id: Date.now().toString(), achievement: ach });
    soundManager.playLevelUp(settings.uiSoundEffects);

    // Throttle confetti bursts to prevent lag from multiple unlocks
    const now = Date.now();
    if (now - lastConfettiTime.current > 2500) {
      lastConfettiTime.current = now;
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.1, x: 0.9 },
          zIndex: 99999
        });
      } catch (e) {
        console.error(e);
      }
    }

    setTimeout(() => {
      setActiveToast(null);
    }, 4000);
  }, [settings.uiSoundEffects]);

  const unlockAchievement = useCallback((id: string, silent: boolean = false) => {
    if (unlockedRef.current[id]) return; // already unlocked

    const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === id);
    if (!ach) return;

    const updated = {
      ...unlockedRef.current,
      [id]: { unlockedAt: Date.now() }
    };
    unlockedRef.current = updated;
    setUnlocked(updated);
    try {
      localStorage.setItem('nexus_achievements', JSON.stringify(updated));
    } catch (e) {}

    // Flush immediately so it persists right away
    setTimeout(() => {
      flushSave();
    }, 50);

    if (!silent) {
      triggerToast(ach);
    }
  }, [triggerToast, flushSave]);

  const unlockAllAchievements = useCallback(() => {
    const allUnlocked: Record<string, UnlockedAchievementData> = {};
    ACHIEVEMENTS_CATALOG.forEach(ach => {
      allUnlocked[ach.id] = { unlockedAt: Date.now() };
    });
    unlockedRef.current = allUnlocked;
    setUnlocked(allUnlocked);
    try {
      localStorage.setItem('nexus_achievements', JSON.stringify(allUnlocked));
    } catch (e) {}

    // Flush immediately to firestore and localStorage
    setTimeout(() => {
      flushSave();
    }, 50);

    soundManager.playLevelUp(settings.uiSoundEffects);
    try {
      confetti({
        particleCount: 180,
        spread: 100,
        origin: { y: 0.3 },
        zIndex: 99999
      });
    } catch (e) {
      console.error(e);
    }
  }, [settings.uiSoundEffects, flushSave]);

  const wipeAllProgress = useCallback(async () => {
    isExplicitWipingRef.current = true;
    setUnlocked({});
    setProgressData({});
    setGamePoints(0);
    setGamesPlayed(0);
    setBonusXp(0);
    setSpentXp(0);
    unlockedRef.current = {};
    progressDataRef.current = {};

    try {
      localStorage.removeItem('nexus_achievements');
      localStorage.removeItem('nexus_achievements_progress');
      localStorage.removeItem('nexus_game_points');
      localStorage.removeItem('nexus_games_played');
      localStorage.removeItem('nexus_bonus_xp');
      localStorage.removeItem('nexus_spent_xp');
    } catch (e) {
      console.error(e);
    }

    if (user) {
      try {
        await setDoc(doc(db, 'users', user.uid, 'data', 'achievements'), {
          unlocked: {},
          progress: {},
          gamePoints: 0,
          gamesPlayed: 0,
          bonusXp: 0,
          spentXp: 0,
          updatedAt: new Date().toISOString()
        });

        const activeName = localStorage.getItem('username') || user.displayName || 'Nexus Explorer';
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          displayName: activeName,
          nickname: activeName,
          email: user.email,
          photoURL: user.photoURL || null,
          totalScore: 0,
          totalXp: 0,
          bonusXp: 0,
          gamePoints: 0,
          gamesPlayed: 0,
          achievementsCount: 0,
          unlockedAchievements: {},
          levelTitle: LEVEL_TITLES[0],
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (fErr) {
        console.warn('Error wiping remote achievements:', fErr);
      }
    }

    setTimeout(() => {
      isExplicitWipingRef.current = false;
    }, 1000);
  }, [user]);

  const incrementProgress = useCallback((id: string, amount: number = 1) => {
    if (unlockedRef.current[id]) return;

    const ach = ACHIEVEMENTS_CATALOG.find(a => a.id === id);
    if (!ach || !ach.maxProgress) {
      unlockAchievement(id);
      return;
    }

    const current = (progressDataRef.current[id] || 0) + amount;
    const updatedProgress = { ...progressDataRef.current, [id]: current };
    progressDataRef.current = updatedProgress;
    setProgressData(updatedProgress);

    if (current >= ach.maxProgress) {
      unlockAchievement(id);
    }
  }, [unlockAchievement]);

  const isUnlocked = useCallback((id: string) => !!unlocked[id], [unlocked]);
  const getProgress = useCallback((id: string) => progressData[id] || 0, [progressData]);

  const spendGamePoints = useCallback((amount: number): boolean => {
    if (gamePoints >= amount) {
      setGamePoints(prev => {
        const next = Math.max(0, prev - amount);
        localStorage.setItem('nexus_game_points', next.toString());
        return next;
      });
      return true;
    }
    return false;
  }, [gamePoints]);

  const addGamePoints = useCallback((amount: number) => {
    setGamePoints(prev => {
      const next = prev + amount;
      localStorage.setItem('nexus_game_points', next.toString());
      return next;
    });
  }, []);

  const setCustomPoints = useCallback((amount: number) => {
    const val = Math.max(0, amount);
    setGamePoints(val);
    localStorage.setItem('nexus_game_points', val.toString());
    setTimeout(() => {
      flushSave();
    }, 50);
  }, [flushSave]);

  const addBonusXp = useCallback((amount: number) => {
    setBonusXp(prev => {
      const next = Math.max(0, prev + amount);
      localStorage.setItem('nexus_bonus_xp', next.toString());
      return next;
    });
    setTimeout(() => {
      flushSave();
    }, 50);
  }, [flushSave]);

  const setCustomXp = useCallback((amount: number) => {
    const val = Math.max(0, amount);
    setBonusXp(val);
    localStorage.setItem('nexus_bonus_xp', val.toString());
    setTimeout(() => {
      flushSave();
    }, 50);
  }, [flushSave]);

  const spendXp = useCallback((amount: number): boolean => {
    if (availableXp >= amount) {
      setSpentXp(prev => {
        const next = prev + amount;
        localStorage.setItem('nexus_spent_xp', next.toString());
        return next;
      });
      return true;
    }
    return false;
  }, [availableXp]);

  const refundXp = useCallback((amount: number) => {
    setSpentXp(prev => {
      const next = Math.max(0, prev - amount);
      localStorage.setItem('nexus_spent_xp', next.toString());
      return next;
    });
  }, []);

  return (
    <AchievementsContext.Provider value={{
      unlocked,
      progressData,
      totalXp,
      bonusXp,
      gamePoints,
      gamesPlayed: effectiveGamesPlayed,
      totalScore,
      level,
      levelTitle,
      unlockAchievement,
      unlockAllAchievements,
      wipeAllProgress,
      clearAchievements: clearSessionAchievements,
      incrementProgress,
      isUnlocked,
      getProgress,
      recordGamePlay,
      addGameTimePoints,
      spendGamePoints,
      addGamePoints,
      setCustomPoints,
      addBonusXp,
      setCustomXp,
      flushSave,
      availableXp,
      spentXp,
      spendXp,
      refundXp
    }}>
      {children}

      {/* Floating Achievement Unlock Banner Toast */}
      {activeToast && (
        <div className="fixed top-20 right-6 z-[100000] animate-bounce max-w-sm">
          <div className="bg-slate-900/95 border-2 border-amber-400 p-4 rounded-2xl shadow-2xl shadow-amber-500/30 backdrop-blur-2xl flex items-center gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center text-black font-black shrink-0 shadow-lg shadow-amber-500/40">
              <Trophy className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] font-mono font-bold uppercase tracking-widest">
                <Sparkles className="w-3 h-3" /> Achievement Unlocked!
              </div>
              <h4 className="text-sm font-black text-white truncate">{activeToast.achievement.title}</h4>
              <p className="text-xs text-slate-300 truncate">{activeToast.achievement.description}</p>
              <span className="inline-block mt-1 text-[10px] font-bold text-amber-300 font-mono">
                +{activeToast.achievement.xp} XP Earned
              </span>
            </div>
          </div>
        </div>
      )}
    </AchievementsContext.Provider>
  );
};

export const useAchievements = () => {
  const context = useContext(AchievementsContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementsProvider');
  }
  return context;
};
