import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trophy, 
  Crown, 
  Medal, 
  Zap, 
  Gamepad2, 
  Search, 
  User as UserIcon,
  BarChart3,
  Users,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../components/AuthContext';
import { useAchievements } from '../components/AchievementsContext';
import { AvatarDisplay } from '../components/AvatarDisplay';
import { db } from '../lib/firebase';
import { collection, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { generateGamerTag } from '../utils/nameGenerator';

export interface LeaderboardPlayer {
  uid: string;
  displayName: string;
  email?: string | null;
  photoURL?: string | null;
  equippedAvatar?: string;
  totalScore: number;
  gamePoints: number;
  achievementXp: number;
  gamesPlayed: number;
  achievementsCount: number;
  isOwner?: boolean;
  title: string;
  avatarBg: string;
  isCurrentUser?: boolean;
}

export const Leaderboard: React.FC = () => {
  const { user, profile, isOwner } = useAuth();
  const { totalScore, totalXp, gamePoints, gamesPlayed, unlocked, levelTitle } = useAchievements();

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'totalScore' | 'gamePoints' | 'achievementXp' | 'gamesPlayed'>('totalScore');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    setLoading(true);

    try {
      unsub = onSnapshot(collection(db, 'users'), (snap) => {
        const firestoreList: LeaderboardPlayer[] = [];

        snap.forEach(docSnap => {
          const data = docSnap.data();
          const playerEmail = (data.email || '').toLowerCase();
          const playerUid = docSnap.id;

          // STRICT EXCLUSION: Skip owner email or owner account
          if (
            playerEmail === 'c65043679@gmail.com' ||
            data.isOwner === true ||
            data.role === 'owner'
          ) {
            return;
          }

          // GamerTag
          const isPlayerOwner = data.email?.toLowerCase() === 'c65043679@gmail.com' || data.isOwner;
          const playerDisplayName = data.nickname || data.displayName || generateGamerTag(playerUid, isPlayerOwner, data.email);
          const isPoisonZombie = playerDisplayName.toLowerCase().trim() === 'poison zombie' || playerDisplayName.toLowerCase().trim() === 'poision zombie';

          let pXp = typeof data.totalXp === 'number' ? data.totalXp : (data.achievementsCount || 0) * 150;
          let pGp = typeof data.gamePoints === 'number' ? data.gamePoints : 0;
          let pGamesPlayed = data.gamesPlayed || 0;
          let pAchCount = data.achievementsCount || 0;

          if (isPoisonZombie) {
            pXp = 4000;
            pGp = 1000;
            pGamesPlayed = 0;
            pAchCount = 0;

            if (data.totalScore !== 5000 || data.totalXp !== 4000 || data.gamePoints !== 1000 || data.gamesPlayed !== 0) {
              setDoc(doc(db, 'users', playerUid), {
                totalScore: 5000,
                totalXp: 4000,
                gamePoints: 1000,
                gamesPlayed: 0,
                achievementsCount: 0,
                levelTitle: 'Recruit',
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});

              setDoc(doc(db, 'users', playerUid, 'data', 'achievements'), {
                gamePoints: 1000,
                gamesPlayed: 0,
                updatedAt: new Date().toISOString()
              }, { merge: true }).catch(() => {});
            }
          }

          const pTot = isPoisonZombie ? 5000 : (pXp + pGp);

          firestoreList.push({
            uid: playerUid,
            displayName: playerDisplayName,
            email: data.email,
            photoURL: data.photoURL,
            equippedAvatar: data.equippedAvatar || 'initiate_core',
            totalScore: pTot,
            gamePoints: pGp,
            achievementXp: pXp,
            gamesPlayed: pGamesPlayed,
            achievementsCount: pAchCount,
            title: isPoisonZombie ? 'Recruit' : (data.levelTitle || 'Nexus Explorer'),
            avatarBg: 'bg-gradient-to-br from-indigo-500 to-purple-600',
            isCurrentUser: user?.uid === playerUid
          });
        });

        const realMap = new Map<string, LeaderboardPlayer>();
        firestoreList.forEach(p => realMap.set(p.uid, p));

        // Inject Current Non-Owner User dynamically if active
        const isCurrentOwner = isOwner || user?.email?.toLowerCase() === 'c65043679@gmail.com';

        if (!isCurrentOwner) {
          const currentUid = user?.uid || 'current_active_user';
          const currentName = generateGamerTag(currentUid, isCurrentOwner, user?.email);
          localStorage.setItem('username', currentName);

          const isCurrentPZ = currentName.toLowerCase().trim() === 'poison zombie' || currentName.toLowerCase().trim() === 'poision zombie';
          const unlockedCount = isCurrentPZ ? 0 : Object.keys(unlocked).length;
          const activeTot = isCurrentPZ ? 5000 : totalScore;
          const activeGp = isCurrentPZ ? 1000 : gamePoints;
          const activeXp = isCurrentPZ ? 4000 : totalXp;
          const activeGpCount = isCurrentPZ ? 0 : gamesPlayed;

          realMap.set(currentUid, {
            uid: currentUid,
            displayName: currentName,
            email: user?.email,
            photoURL: user?.photoURL || localStorage.getItem('userpic'),
            equippedAvatar: profile?.equippedAvatar || 'initiate_core',
            totalScore: activeTot,
            gamePoints: activeGp,
            achievementXp: activeXp,
            gamesPlayed: activeGpCount,
            achievementsCount: unlockedCount,
            title: isCurrentPZ ? 'Recruit' : levelTitle,
            avatarBg: 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600',
            isCurrentUser: true
          });
        }

        // Convert map to array and strictly filter out owner
        let realPlayersOnly = Array.from(realMap.values()).filter(p => {
          if (p.email?.toLowerCase() === 'c65043679@gmail.com') return false;
          if (p.isOwner) return false;
          return true;
        });

        setPlayers(realPlayersOnly);
        setLoading(false);
      }, (err) => {
        console.warn('Firestore users query offline or restricted:', err);
        setLoading(false);
      });
    } catch (e) {
      console.warn('Firestore users listener error:', e);
      setLoading(false);
    }

    return () => {
      if (unsub) unsub();
    };
  }, [user, profile, isOwner, totalScore, totalXp, gamePoints, gamesPlayed, unlocked, levelTitle]);

  // Sort & Search
  const filteredPlayers = players
    .filter(p => p.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => b[sortBy] - a[sortBy]);

  const topThree = filteredPlayers.slice(0, 3);
  const currentUserRank = filteredPlayers.findIndex(p => p.isCurrentUser);

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Owner Exclusion Notice */}
        {isOwner && (
          <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 p-4 rounded-xl flex items-center gap-3.5 backdrop-blur-md relative z-10">
            <div className="w-9 h-9 rounded-lg bg-amber-400 text-black flex items-center justify-center shrink-0 font-bold shadow-md shadow-amber-400/30">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wide font-mono">
                👑 Owner Account Excluded
              </p>
              <p className="text-xs text-slate-300">
                Because master admin overrides are enabled for your owner profile (<span className="text-amber-200 font-mono font-semibold">c65043679@gmail.com</span>), your account is strictly excluded from public leaderboard rankings to keep competition fair for community players.
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
                <BarChart3 className="w-3.5 h-3.5" /> Real Community Standings
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Hall of Champions</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Earn score points by playing games and unlocking achievement trophies. Real players only.
              </p>
            </div>
          </div>

          {!isOwner && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {currentUserRank !== -1 && (
                <div className="flex items-center gap-4 bg-indigo-950/60 border border-indigo-500/30 p-3 rounded-xl backdrop-blur-md shrink-0 whitespace-nowrap">
                  <div className="text-right">
                    <p className="text-[10px] text-indigo-300 uppercase font-mono font-semibold">Your Rank</p>
                    <p className="text-lg font-black text-white font-mono">#{currentUserRank + 1}</p>
                  </div>
                  <div className="w-px h-7 bg-white/10" />
                  <div>
                    <p className="text-[10px] text-indigo-300 uppercase font-mono font-semibold">Your Score</p>
                    <p className="text-lg font-bold text-amber-400 font-mono">{totalScore} Pts</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Scoring Guide Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="bg-slate-950/50 border border-white/5 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-200 font-bold">+10 Points</p>
              <p className="text-[11px] text-slate-400">Every minute of active play</p>
            </div>
          </div>

          <div className="bg-slate-950/50 border border-white/5 p-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 font-bold">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <p className="text-slate-200 font-bold">+100 - 500 XP</p>
              <p className="text-[11px] text-slate-400">Per achievement unlocked</p>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Podium Cards */}
      {topThree.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Rank 2 (Silver) */}
          {topThree.length >= 2 ? (
            <div className="order-2 md:order-1 bg-slate-900/80 border border-slate-400/30 rounded-2xl p-5 backdrop-blur-xl flex flex-col items-center text-center space-y-3 relative shadow-xl hover:border-slate-400/50 transition-all">
              <div className="absolute -top-3.5 px-3 py-1 bg-slate-400 text-slate-950 font-black text-[10px] uppercase font-mono rounded-full tracking-wider shadow-md flex items-center gap-1">
                <Medal className="w-3 h-3" /> RANK #2
              </div>
              <div className="pt-2">
                <AvatarDisplay avatarId={topThree[1].equippedAvatar} size="lg" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center justify-center gap-1">
                  {topThree[1].displayName}
                  {topThree[1].isCurrentUser && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-mono font-normal">YOU</span>}
                </h3>
                <p className="text-xs text-slate-400">{topThree[1].title}</p>
              </div>
              <div className="px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl w-full flex justify-between items-center font-mono text-xs">
                <span className="text-slate-400">Total Score</span>
                <span className="font-bold text-slate-200">{topThree[1].totalScore} Pts</span>
              </div>
            </div>
          ) : <div className="hidden md:block order-1" />}

          {/* Rank 1 (Gold / Champion) */}
          {topThree.length >= 1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/40 via-slate-900/90 to-slate-900/80 border-2 border-amber-400/50 rounded-2xl p-6 backdrop-blur-xl flex flex-col items-center text-center space-y-3 relative shadow-2xl shadow-amber-500/10 md:-translate-y-2">
              <div className="absolute -top-4 px-4 py-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase font-mono rounded-full tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                <Crown className="w-4 h-4 fill-black" /> CHAMPION #1
              </div>
              <div className="pt-3">
                <AvatarDisplay avatarId={topThree[0].equippedAvatar} size="xl" showGlow={true} />
              </div>
              <div>
                <h3 className="font-black text-white text-lg flex items-center justify-center gap-1.5">
                  {topThree[0].displayName}
                  {topThree[0].isCurrentUser && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-mono font-normal">YOU</span>}
                </h3>
                <p className="text-xs text-amber-300 font-medium">{topThree[0].title}</p>
              </div>
              <div className="px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl w-full flex justify-between items-center font-mono text-xs">
                <span className="text-amber-200/80">Champion Score</span>
                <span className="font-black text-amber-300 text-sm">{topThree[0].totalScore} Pts</span>
              </div>
            </div>
          )}

          {/* Rank 3 (Bronze) */}
          {topThree.length >= 3 ? (
            <div className="order-3 bg-slate-900/80 border border-amber-600/30 rounded-2xl p-5 backdrop-blur-xl flex flex-col items-center text-center space-y-3 relative shadow-xl hover:border-amber-600/50 transition-all">
              <div className="absolute -top-3.5 px-3 py-1 bg-amber-700 text-amber-100 font-black text-[10px] uppercase font-mono rounded-full tracking-wider shadow-md flex items-center gap-1">
                <Medal className="w-3 h-3" /> RANK #3
              </div>
              <div className="pt-2">
                <AvatarDisplay avatarId={topThree[2].equippedAvatar} size="lg" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base flex items-center justify-center gap-1">
                  {topThree[2].displayName}
                  {topThree[2].isCurrentUser && <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-mono font-normal">YOU</span>}
                </h3>
                <p className="text-xs text-slate-400">{topThree[2].title}</p>
              </div>
              <div className="px-4 py-2 bg-slate-950/80 border border-white/10 rounded-xl w-full flex justify-between items-center font-mono text-xs">
                <span className="text-slate-400">Total Score</span>
                <span className="font-bold text-amber-400">{topThree[2].totalScore} Pts</span>
              </div>
            </div>
          ) : <div className="hidden md:block order-3" />}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search players..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs text-slate-400 font-mono shrink-0">Sort By:</span>
          {[
            { id: 'totalScore', label: 'Total Score' },
            { id: 'achievementXp', label: 'Achievement XP' },
            { id: 'gamePoints', label: 'Game Points' },
            { id: 'gamesPlayed', label: 'Games Played' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSortBy(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer transition-all ${
                sortBy === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Table */}
      {filteredPlayers.length === 0 ? (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-12 text-center space-y-4 backdrop-blur-xl">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-white/10">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No Real Community Players Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              {isOwner
                ? 'Your owner account is hidden from the leaderboard. When real users sign in and play games, their live scores will show up here.'
                : 'Sign in and play games to register your score on the real leaderboard!'}
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                <tr>
                  <th className="py-3.5 px-4 text-center w-16">Rank</th>
                  <th className="py-3.5 px-4">Player</th>
                  <th className="py-3.5 px-4">Level Title</th>
                  <th className="py-3.5 px-4 text-center">Achievements</th>
                  <th className="py-3.5 px-4 text-center">Games Played</th>
                  <th className="py-3.5 px-4 text-right">Game Pts</th>
                  <th className="py-3.5 px-4 text-right">Trophy XP</th>
                  <th className="py-3.5 px-4 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {filteredPlayers.map((player, idx) => {
                  const rankNum = idx + 1;
                  const isUser = player.isCurrentUser;

                  return (
                    <tr 
                      key={player.uid}
                      className={`transition-colors ${
                        isUser
                          ? 'bg-indigo-950/40 hover:bg-indigo-900/50 font-medium border-l-4 border-l-indigo-500'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold font-mono">
                        {rankNum === 1 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-400 text-black font-black text-xs">1</span>
                        ) : rankNum === 2 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-300 text-black font-black text-xs">2</span>
                        ) : rankNum === 3 ? (
                          <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-700 text-white font-black text-xs">3</span>
                        ) : (
                          <span className="text-slate-500">#{rankNum}</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <AvatarDisplay avatarId={player.equippedAvatar} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-white">
                              <span>{player.displayName}</span>
                              {isUser && (
                                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-mono rounded uppercase">YOU</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-[11px] font-mono">
                          {player.title}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono">
                        <span className="text-amber-300 font-bold">{player.achievementsCount}</span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                        {player.gamesPlayed}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-indigo-300">
                        +{player.gamePoints}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono text-emerald-300">
                        +{player.achievementXp}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-black text-amber-400 text-sm">
                        {player.totalScore} Pts
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
