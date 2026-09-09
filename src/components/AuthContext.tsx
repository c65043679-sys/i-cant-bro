import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, signInWithCredential } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, updateDoc, arrayUnion, arrayRemove, onSnapshot, increment } from 'firebase/firestore';
import { containsProfanity } from '../utils/profanityFilter';
import { generateGamerTag } from '../utils/nameGenerator';
import { AVATARS_CATALOG } from '../data/avatarsData';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string | null;
  photoURL: string | null;
  nickname?: string;
  themeColor?: string;
  equippedAvatar?: string;
  unlockedAvatars?: string[];
  favorites: string[];
  totalPlayTime?: number;
}

export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  loginAsAdmin: (password: string) => boolean;
  unlockOwner: (passcode: string) => boolean;
  setAdminStatus: (status: boolean) => void;
  setOwnerStatus: (status: boolean) => void;
  toggleFavorite: (gameId: string) => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  addPlayTime: (seconds: number) => Promise<void>;
  equipAvatar: (avatarId: string) => Promise<void>;
  unlockAvatar: (avatarId: string) => Promise<void>;
  lockAvatar: (avatarId: string) => Promise<void>;
  unlockAllAvatars: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(() => {
    const saved = localStorage.getItem('isAdmin') || sessionStorage.getItem('isAdmin');
    return saved === 'true';
  });
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState(() => {
    const saved = localStorage.getItem('isOwner') || sessionStorage.getItem('isOwner');
    return saved === 'true';
  });

  const isOwner = (user?.email?.toLowerCase() === 'alexsarsero@gmail.com') || isOwnerUnlocked;

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const exposeGSI = () => {
      (window as any).handleCredentialResponse = async (response: any) => {
        try {
          if (!auth) {
            console.warn("Auth not configured yet.");
            return;
          }
          if ((window as any).jwt_decode) {
            const userToken = (window as any).jwt_decode(response.credential);
            localStorage.setItem("username", userToken.name);
            localStorage.setItem("userpic", userToken.picture);
          }
          const credential = GoogleAuthProvider.credential(response.credential);
          await signInWithCredential(auth, credential);
        } catch (err) {
          console.error("GSI Login Error:", err);
        }
      };
    };

    exposeGSI();

    if (!auth) {
      setLoading(false);
      const guestName = localStorage.getItem('username') || 'Nexus Guest';
      let guestFavs: string[] = [];
      let guestUnlocked: string[] = ['initiate_core'];
      if (isOwnerUnlocked) guestUnlocked.push('sovereign_crown');
      let guestEquipped = isOwnerUnlocked ? 'sovereign_crown' : 'initiate_core';
      const guestPlayTime = parseInt(localStorage.getItem('nexus_total_play_time') || '0', 10);

      try {
        const savedFavs = localStorage.getItem('nexus_favorites');
        if (savedFavs) guestFavs = JSON.parse(savedFavs);
        const savedUnlocked = localStorage.getItem('nexus_unlocked_avatars');
        if (savedUnlocked) {
          const parsed = JSON.parse(savedUnlocked);
          guestUnlocked = Array.from(new Set([...guestUnlocked, ...parsed]));
        }
        const savedEquipped = localStorage.getItem('nexus_equipped_avatar');
        if (savedEquipped) guestEquipped = savedEquipped;
      } catch (e) {}

      setProfile({
        uid: 'guest',
        displayName: guestName,
        nickname: guestName,
        equippedAvatar: guestEquipped,
        unlockedAvatars: guestUnlocked,
        favorites: guestFavs,
        totalPlayTime: guestPlayTime
      });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const isUserOwner = (user.email?.toLowerCase() === 'alexsarsero@gmail.com') || (sessionStorage.getItem('isOwner') === 'true');
        const realAccountName = isUserOwner
          ? 'Gordon Freeman'
          : (user.displayName || (user.email ? user.email.split('@')[0] : 'Player'));
        
        const existingLocalName = localStorage.getItem('username');
        const defaultName = (existingLocalName && existingLocalName !== 'Nexus Explorer' && existingLocalName !== 'Nexus Member')
          ? existingLocalName
          : realAccountName;
        localStorage.setItem('username', defaultName);

        let localFavs: string[] = [];
        let localUnlocked: string[] = ['initiate_core'];
        let localEquipped = isUserOwner ? 'sovereign_crown' : 'initiate_core';
        const localPlayTime = parseInt(localStorage.getItem('nexus_total_play_time') || '0', 10);

        if (isUserOwner) {
          localUnlocked.push('sovereign_crown');
        }

        try {
          const savedFavs = localStorage.getItem('nexus_favorites');
          if (savedFavs) localFavs = JSON.parse(savedFavs);
          const savedUnlocked = localStorage.getItem('nexus_unlocked_avatars');
          if (savedUnlocked) {
            const parsed = JSON.parse(savedUnlocked);
            localUnlocked = Array.from(new Set([...localUnlocked, ...parsed]));
          }
          const savedEquipped = localStorage.getItem('nexus_equipped_avatar');
          if (savedEquipped) localEquipped = savedEquipped;
        } catch (e) {}

        // Immediately set initial profile in state so user account loads without blocking
        setProfile({
          uid: user.uid,
          displayName: defaultName,
          nickname: defaultName,
          email: user.email,
          photoURL: user.photoURL,
          equippedAvatar: localEquipped,
          unlockedAvatars: localUnlocked,
          favorites: localFavs,
          totalPlayTime: localPlayTime
        });

        try {
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);

          if (!userDoc.exists()) {
            const newProfile = {
              uid: user.uid,
              displayName: defaultName,
              nickname: defaultName,
              email: user.email,
              photoURL: user.photoURL,
              equippedAvatar: localEquipped,
              unlockedAvatars: localUnlocked,
              favorites: [],
              totalPlayTime: localPlayTime,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            };
            await setDoc(userRef, newProfile);
          } else {
            const data = userDoc.data();
            const updates: any = {};
            const existingName = data?.nickname || data?.displayName;
            if (!existingName) {
              updates.nickname = defaultName;
              updates.displayName = defaultName;
            } else {
              localStorage.setItem('username', existingName);
            }
            // Ensure mandatory starter / Sovereign avatars are present
            const docUnlocked: string[] = data?.unlockedAvatars || ['initiate_core'];
            const mergedUnlocked = Array.from(new Set([...docUnlocked, 'initiate_core', ...(isUserOwner ? ['sovereign_crown'] : [])]));
            if (mergedUnlocked.length !== docUnlocked.length) {
              updates.unlockedAvatars = mergedUnlocked;
            }
            if (!data?.equippedAvatar) {
              updates.equippedAvatar = isUserOwner ? 'sovereign_crown' : 'initiate_core';
            }
            if (!data?.favorites) updates.favorites = [];
            if (!data?.uid) updates.uid = user.uid;
            if (Object.keys(updates).length > 0) {
              await setDoc(userRef, updates, { merge: true });
            }
          }

          // Listen to profile changes
          unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
            if (docSnap.exists()) {
              const snapData = docSnap.data();
              const baseUnlocked = ['initiate_core', ...(isUserOwner ? ['sovereign_crown'] : [])];
              const finalUnlocked = Array.from(new Set([...baseUnlocked, ...(snapData.unlockedAvatars || [])]));
              const remotePlayTime = typeof snapData.totalPlayTime === 'number'
                ? snapData.totalPlayTime
                : parseInt(localStorage.getItem('nexus_total_play_time') || '0', 10);
              try {
                localStorage.setItem('nexus_total_play_time', remotePlayTime.toString());
              } catch (e) {}

              setProfile({
                ...snapData,
                totalPlayTime: remotePlayTime,
                unlockedAvatars: finalUnlocked,
                equippedAvatar: snapData.equippedAvatar || (isUserOwner ? 'sovereign_crown' : 'initiate_core')
              } as UserProfile);
            }
          }, (err) => {
            console.warn("User profile snapshot warning:", err);
          });
        } catch (err) {
          console.error("Firestore user profile init error:", err);
        }
      } else {
        setUser(null);
        let guestFavs: string[] = [];
        let guestUnlocked: string[] = ['initiate_core'];
        if (isOwnerUnlocked) guestUnlocked.push('sovereign_crown');
        let guestEquipped = isOwnerUnlocked ? 'sovereign_crown' : 'initiate_core';
        const guestPlayTime = parseInt(localStorage.getItem('nexus_total_play_time') || '0', 10);

        try {
          const savedFavs = localStorage.getItem('nexus_favorites');
          if (savedFavs) guestFavs = JSON.parse(savedFavs);
          const savedUnlocked = localStorage.getItem('nexus_unlocked_avatars');
          if (savedUnlocked) {
            const parsed = JSON.parse(savedUnlocked);
            guestUnlocked = Array.from(new Set([...guestUnlocked, ...parsed]));
          }
          const savedEquipped = localStorage.getItem('nexus_equipped_avatar');
          if (savedEquipped) guestEquipped = savedEquipped;
        } catch (e) {}

        const guestName = localStorage.getItem('username') || 'Nexus Guest';
        setProfile({
          uid: 'guest',
          displayName: guestName,
          nickname: guestName,
          equippedAvatar: guestEquipped,
          unlockedAvatars: guestUnlocked,
          favorites: guestFavs,
          totalPlayTime: guestPlayTime
        });
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
      setLoading(false);
    });

    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signIn = async () => {
    if (!auth) {
      alert("Firebase integration has been disabled or removed. To set up a new Firebase app, use the Firebase Setup workflow.");
      return;
    }
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error("Sign-in popup error:", err);
      if (err.code === 'auth/popup-blocked') {
        alert("Pop-up was blocked by your browser. Please allow popups for this site to sign in.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        console.warn("Sign-in popup closed before completion.");
      } else {
        alert(`Sign-in failed: ${err.message || 'Unknown authentication error'}`);
      }
    }
  };

  const logout = async () => {
    setIsAdmin(false);
    sessionStorage.removeItem('isAdmin');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('isOwner');
    sessionStorage.removeItem('isOwner');
    setIsOwnerUnlocked(false);

    try {
      // First signal listeners to flush their state to Firestore
      window.dispatchEvent(new Event('nexus_before_signout'));
      await new Promise(r => setTimeout(r, 80));

      localStorage.removeItem('username');
      localStorage.removeItem('userpic');
      localStorage.removeItem('nexus_achievements');
      localStorage.removeItem('nexus_achievements_progress');
      localStorage.removeItem('nexus_game_points');
      localStorage.removeItem('nexus_games_played');
      localStorage.removeItem('nexus_bonus_xp');
      localStorage.removeItem('nexus_spent_xp');
      localStorage.removeItem('nexus_total_play_time');
      window.dispatchEvent(new Event('nexus_achievements_cleared'));
    } catch (e) {}

    if (auth) {
      return signOut(auth);
    }
    return Promise.resolve();
  };

  const loginAsAdmin = (password: string) => {
    const normalized = password.trim().toLowerCase();
    if (['280511', 'owner', 'admin', 'nexusadmin', 'godmode'].includes(normalized)) {
      setIsAdmin(true);
      setIsOwnerUnlocked(true);
      sessionStorage.setItem('isAdmin', 'true');
      sessionStorage.setItem('isOwner', 'true');
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('isOwner', 'true');
      return true;
    }
    return false;
  };

  const unlockOwner = (passcode: string) => {
    const normalized = passcode.trim().toLowerCase();
    if (['280511', 'owner', 'nexusowner', 'admin', 'nexusadmin', 'godmode', 'bypass', 'clearance'].includes(normalized)) {
      setIsOwnerUnlocked(true);
      setIsAdmin(true);
      sessionStorage.setItem('isOwner', 'true');
      sessionStorage.setItem('isAdmin', 'true');
      localStorage.setItem('isOwner', 'true');
      localStorage.setItem('isAdmin', 'true');
      return true;
    }
    return false;
  };

  const setAdminStatus = (status: boolean) => {
    setIsAdmin(status);
    sessionStorage.setItem('isAdmin', status ? 'true' : 'false');
    localStorage.setItem('isAdmin', status ? 'true' : 'false');
  };

  const setOwnerStatus = (status: boolean) => {
    setIsOwnerUnlocked(status);
    sessionStorage.setItem('isOwner', status ? 'true' : 'false');
    localStorage.setItem('isOwner', status ? 'true' : 'false');
  };

  const toggleFavorite = async (gameId: string) => {
    const currentFavs = profile?.favorites || [];
    const isFavorited = currentFavs.includes(gameId);
    const updatedFavs = isFavorited
      ? currentFavs.filter(id => id !== gameId)
      : [...currentFavs, gameId];

    // Optimistically update React profile state immediately
    setProfile(prev => prev ? {
      ...prev,
      favorites: updatedFavs
    } : {
      uid: user?.uid || 'guest',
      favorites: updatedFavs
    });

    // Save to local storage for instant persistence
    try {
      localStorage.setItem('nexus_favorites', JSON.stringify(updatedFavs));
    } catch (e) {
      console.warn('LocalStorage favorites error:', e);
    }

    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        favorites: updatedFavs,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.error("Error toggling favorite in Firestore:", err);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    const isUserOwner = (user?.email?.toLowerCase() === 'alexsarsero@gmail.com') || isOwnerUnlocked;
    const requestedName = data.nickname?.trim() || data.displayName?.trim();
    const fallbackName = user?.displayName || (user?.email ? user.email.split('@')[0] : 'Player');
    const chosenName = isUserOwner 
      ? 'Gordon Freeman'
      : (requestedName || localStorage.getItem('username') || fallbackName);
    localStorage.setItem('username', chosenName);

    // Update local React state optimistically so UI updates immediately across all screens
    setProfile(prev => prev ? {
      ...prev,
      ...data,
      nickname: chosenName,
      displayName: chosenName
    } : {
      uid: user?.uid || 'temp',
      email: user?.email || undefined,
      nickname: chosenName,
      displayName: chosenName,
      photoURL: user?.photoURL || undefined,
      favorites: []
    });

    if (!user) return;
    const userRef = doc(db, 'users', user.uid);

    await setDoc(userRef, {
      uid: user.uid,
      ...data,
      nickname: chosenName,
      displayName: chosenName,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const addPlayTime = async (seconds: number) => {
    if (seconds <= 0) return;

    const currentTotal = profile?.totalPlayTime ?? parseInt(localStorage.getItem('nexus_total_play_time') || '0', 10);
    const newTotal = currentTotal + seconds;

    try {
      localStorage.setItem('nexus_total_play_time', newTotal.toString());
    } catch (e) {}

    setProfile(prev => prev ? {
      ...prev,
      totalPlayTime: (prev.totalPlayTime || 0) + seconds
    } : {
      uid: user?.uid || 'guest',
      displayName: localStorage.getItem('username') || 'Nexus Guest',
      email: user?.email || null,
      photoURL: user?.photoURL || null,
      favorites: [],
      totalPlayTime: newTotal
    });

    if (user && db) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          totalPlayTime: increment(seconds),
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        console.warn('Error saving play time to Firestore:', err);
      }
    }
  };

  const equipAvatar = async (avatarId: string) => {
    try {
      localStorage.setItem('nexus_equipped_avatar', avatarId);
    } catch (e) {}

    setProfile(prev => prev ? {
      ...prev,
      equippedAvatar: avatarId
    } : null);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          equippedAvatar: avatarId,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Error saving equipped avatar to firestore:', e);
      }
    }
  };

  const unlockAvatar = async (avatarId: string) => {
    const currentUnlocked = profile?.unlockedAvatars || ['initiate_core'];
    if (!currentUnlocked.includes(avatarId)) {
      const updated = [...currentUnlocked, avatarId];
      try {
        localStorage.setItem('nexus_unlocked_avatars', JSON.stringify(updated));
      } catch (e) {}

      setProfile(prev => prev ? {
        ...prev,
        unlockedAvatars: updated
      } : null);

      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, {
            unlockedAvatars: updated,
            updatedAt: serverTimestamp()
          }, { merge: true });
        } catch (e) {
          console.warn('Error saving unlocked avatars to firestore:', e);
        }
      }
    }
  };

  const unlockAllAvatars = async () => {
    const allIds = AVATARS_CATALOG.map(a => a.id);
    try {
      localStorage.setItem('nexus_unlocked_avatars', JSON.stringify(allIds));
    } catch (e) {}

    setProfile(prev => prev ? {
      ...prev,
      unlockedAvatars: allIds
    } : {
      uid: user?.uid || 'guest',
      displayName: localStorage.getItem('username') || 'Nexus Explorer',
      nickname: localStorage.getItem('username') || 'Nexus Explorer',
      email: user?.email || null,
      photoURL: user?.photoURL || null,
      favorites: [],
      equippedAvatar: 'sovereign_crown',
      unlockedAvatars: allIds
    });

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          unlockedAvatars: allIds,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Error saving all unlocked avatars to firestore:', e);
      }
    }
  };

  const lockAvatar = async (avatarId: string) => {
    const currentUnlocked = profile?.unlockedAvatars || ['initiate_core'];
    const updated = currentUnlocked.filter(id => id !== avatarId);
    try {
      localStorage.setItem('nexus_unlocked_avatars', JSON.stringify(updated));
    } catch (e) {}

    let newEquipped = profile?.equippedAvatar;
    if (profile?.equippedAvatar === avatarId) {
      newEquipped = 'initiate_core';
      try {
        localStorage.setItem('nexus_equipped_avatar', 'initiate_core');
      } catch (e) {}
    }

    setProfile(prev => prev ? {
      ...prev,
      unlockedAvatars: updated,
      equippedAvatar: newEquipped
    } : null);

    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          unlockedAvatars: updated,
          equippedAvatar: newEquipped,
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (e) {
        console.warn('Error saving locked avatar to firestore:', e);
      }
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    // Delete Firestore data first
    await setDoc(userRef, { deleted: true }); // Mark as deleted first if rules allowed it, but actually we'll just delete
    // For simplicity in rules (we added allow delete), we just delete
    try {
      await updateDoc(userRef, { active: false }); // or similar
      // Better to just delete the doc
      // await deleteDoc(userRef); // need to import deleteDoc
      // But user.delete() is most important
      await user.delete();
      await logout();
    } catch (err) {
      console.error("Account deletion failed:", err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin, 
      isOwner,
      signIn, 
      logout, 
      loginAsAdmin,
      unlockOwner,
      setAdminStatus,
      setOwnerStatus,
      toggleFavorite,
      updateProfile,
      addPlayTime,
      equipAvatar,
      unlockAvatar,
      lockAvatar,
      unlockAllAvatars,
      deleteAccount
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
