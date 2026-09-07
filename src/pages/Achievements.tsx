import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAchievements, ACHIEVEMENTS_CATALOG } from '../components/AchievementsContext';
import { useAuth } from '../components/AuthContext';
import { 
  Trophy, 
  Star, 
  Sparkles, 
  Zap, 
  Crown, 
  ShieldAlert, 
  Palette, 
  Eye, 
  Radio, 
  Flame, 
  Lock, 
  CheckCircle2, 
  Rocket, 
  Award,
  Filter,
  Check,
  Bookmark,
  Gamepad2,
  Search,
  Maximize,
  FileText,
  ShieldCheck
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Rocket,
  Star,
  Palette,
  ShieldAlert,
  Eye,
  Zap,
  Crown,
  Sparkles,
  Lock,
  Flame,
  Trophy,
  Radio,
  Bookmark,
  Gamepad2,
  Search,
  Maximize,
  FileText,
  ShieldCheck
};

const TIER_BADGES: Record<string, string> = {
  Bronze: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
  Silver: 'bg-slate-400/10 text-slate-300 border-slate-400/20',
  Gold: 'bg-yellow-400/10 text-yellow-300 border-yellow-400/20',
  Platinum: 'bg-purple-400/10 text-purple-300 border-purple-400/20',
};

export const Achievements: React.FC = () => {
  const { isOwner } = useAuth();
  const { unlocked, totalXp, level, levelTitle, unlockAchievement, unlockAllAchievements, getProgress } = useAchievements();
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked' | 'secret'>('all');

  useEffect(() => {
    try { unlockAchievement('vault_visitor'); } catch (e) {}
  }, [unlockAchievement]);

  const unlockedCount = Object.keys(unlocked).length;
  const totalCount = ACHIEVEMENTS_CATALOG.length;
  const progressPercent = Math.round((unlockedCount / totalCount) * 100);
  const currentLevelProgress = totalXp % 250;

  const filteredList = ACHIEVEMENTS_CATALOG.filter((ach) => {
    const isAchUnlocked = !!unlocked[ach.id];
    if (filter === 'unlocked') return isAchUnlocked;
    if (filter === 'locked') return !isAchUnlocked && !ach.secret;
    if (filter === 'secret') return ach.secret;
    return true;
  });

  return (
    <div className="flex-1 p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {isOwner && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-300 tracking-wide uppercase font-mono">
                  Owner Administrative Override
                </p>
                <p className="text-xs text-slate-300">
                  Instantly grant all achievement trophies and status XP to your account.
                </p>
              </div>
            </div>
            <button
              onClick={() => unlockAllAchievements()}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold text-xs uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" /> Unlock All
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
              <Trophy className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
                <Award className="w-3.5 h-3.5" /> Level {level} • {levelTitle}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Achievements & Status</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Earn XP and unlock badges as you explore games, customize settings, and test features.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/60 border border-white/10 p-3.5 rounded-xl backdrop-blur-md shrink-0">
            <div className="text-right">
              <p className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Total XP</p>
              <p className="text-xl font-bold text-indigo-400 font-mono">{totalXp} XP</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-semibold">Trophies</p>
              <p className="text-xl font-bold text-white font-mono">{unlockedCount} / {totalCount}</p>
            </div>
          </div>
        </div>

        {/* Level XP Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="flex justify-between text-xs font-medium font-mono text-slate-300">
            <span>Level {level} Progress ({currentLevelProgress} / 250 XP)</span>
            <span className="text-indigo-400">{progressPercent}% Mastered</span>
          </div>
          <div className="w-full bg-slate-950 border border-white/10 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-400 to-emerald-400 rounded-full transition-all duration-500 shadow-sm shadow-indigo-500/50"
              style={{ width: `${(currentLevelProgress / 250) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Filter Segmented Control */}
      <div className="flex items-center justify-between gap-4 flex-wrap border-b border-white/10 pb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Filter View:</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-white/10">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
            { id: 'locked', label: `Locked (${totalCount - unlockedCount})` },
            { id: 'secret', label: 'Secret' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === tab.id
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Achievement Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((ach) => {
          const isAchUnlocked = !!unlocked[ach.id];
          const unlockData = unlocked[ach.id];
          const IconComponent = ICON_MAP[ach.iconName] || Trophy;
          const badgeStyle = TIER_BADGES[ach.tier] || TIER_BADGES.Bronze;

          const currentProg = getProgress(ach.id);
          const maxProg = ach.maxProgress || 1;

          return (
            <motion.div
              key={ach.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between gap-4 backdrop-blur-md ${
                isAchUnlocked
                  ? 'bg-slate-900/70 border-indigo-500/30 hover:border-indigo-500/50 shadow-lg shadow-indigo-950/20'
                  : 'bg-slate-900/30 border-white/5 opacity-70 hover:opacity-100 hover:border-white/15'
              }`}
            >
              {/* Card Top Header */}
              <div className="flex items-start justify-between gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                  isAchUnlocked
                    ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300'
                    : 'bg-slate-800/80 border-white/5 text-slate-500'
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold font-mono border ${badgeStyle}`}>
                    {ach.tier}
                  </span>
                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold font-mono rounded-md">
                    +{ach.xp} XP
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="space-y-1 flex-1">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  {ach.secret && !isAchUnlocked ? 'Secret Trophy' : ach.title}
                  {isAchUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {ach.secret && !isAchUnlocked 
                    ? 'Explore the platform features to discover and trigger this secret trophy.' 
                    : ach.description}
                </p>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-white/5 text-xs">
                {isAchUnlocked ? (
                  <div className="flex items-center justify-between w-full text-emerald-400 font-medium text-[11px]">
                    <span className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Unlocked
                    </span>
                    <span className="text-slate-500 font-mono text-[10px]">
                      {unlockData ? new Date(unlockData.unlockedAt).toLocaleDateString() : 'Completed'}
                    </span>
                  </div>
                ) : ach.maxProgress ? (
                  <div className="w-full space-y-1.5">
                    <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                      <span>Progress</span>
                      <span>{currentProg} / {maxProg}</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-white/5">
                      <div 
                        className="bg-indigo-500 h-full transition-all"
                        style={{ width: `${Math.min(100, (currentProg / maxProg) * 100)}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between w-full text-slate-500 text-[11px] font-mono">
                    <span>Status: Locked</span>
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
