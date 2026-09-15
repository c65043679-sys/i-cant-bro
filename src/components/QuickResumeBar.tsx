import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { RotateCcw, Play, Clock, X, Trash2, ChevronRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Game } from '../types';
import { 
  getRecentlyPlayed, 
  removeRecentlyPlayed, 
  clearRecentlyPlayed, 
  formatTimeAgo,
  RECENTLY_PLAYED_EVENT 
} from '../utils/recentlyPlayed';
import { soundManager } from '../utils/soundEffects';
import { useSettings } from './SettingsContext';

interface QuickResumeBarProps {
  allGames: Game[];
  className?: string;
}

interface RecentGameDisplay {
  game: Game;
  playedAt: number;
}

export const QuickResumeBar: React.FC<QuickResumeBarProps> = ({ allGames, className = '' }) => {
  const { settings } = useSettings();
  const [recentList, setRecentList] = useState<RecentGameDisplay[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshRecent = useCallback(() => {
    const rawItems = getRecentlyPlayed();
    const resolved: RecentGameDisplay[] = [];

    for (const item of rawItems) {
      // Find game metadata and ensure it's not a blocked title
      const g = allGames.find(game => game.id === item.id);
      if (g && !g.isBlocked) {
        resolved.push({ game: g, playedAt: item.playedAt });
      }
      if (resolved.length >= 5) break; // Display last 3 to 5 games
    }

    setRecentList(resolved);
    setIsLoaded(true);
  }, [allGames]);

  useEffect(() => {
    refreshRecent();

    const handleUpdate = () => refreshRecent();
    window.addEventListener(RECENTLY_PLAYED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(RECENTLY_PLAYED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshRecent]);

  if (!isLoaded || recentList.length === 0) {
    return null;
  }

  const handleDismiss = (e: React.MouseEvent, gameId: string) => {
    e.preventDefault();
    e.stopPropagation();
    soundManager.playClick(settings.uiSoundEffects);
    removeRecentlyPlayed(gameId);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    soundManager.playClick(settings.uiSoundEffects);
    clearRecentlyPlayed();
  };

  const handleCardClick = () => {
    soundManager.playClick(settings.uiSoundEffects);
  };

  return (
    <section className={`relative ${className}`} aria-label="Recently Played & Quick Resume">
      {/* Container with sleek futuristic glass effect */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 border border-white/10 p-4 sm:p-5 backdrop-blur-xl shadow-2xl overflow-hidden">
        {/* Subtle decorative glow line at top */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)]/40 to-transparent" />

        {/* Header with Title and Clear Action */}
        <div className="flex items-center justify-between mb-3.5 sm:mb-4 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)] shadow-inner">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                  Recently Played
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
                  <Zap className="w-2.5 h-2.5 fill-current" /> Quick Resume
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Jump straight back into your recent missions with one click
              </p>
            </div>
          </div>

          <button
            onClick={handleClearAll}
            title="Clear recently played history"
            className="group flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors border border-transparent hover:border-rose-500/20"
          >
            <Trash2 className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
            <span className="hidden sm:inline">Clear History</span>
          </button>
        </div>

        {/* Cards Grid: 1 to 5 items adaptive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          <AnimatePresence mode="popLayout">
            {recentList.map(({ game, playedAt }, index) => {
              const timeString = formatTimeAgo(playedAt);

              return (
                <motion.div
                  key={game.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                  className="group relative"
                >
                  <Link
                    to={`/play/${game.id}`}
                    onClick={handleCardClick}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 hover:bg-slate-800/80 border border-white/5 hover:border-[var(--accent)]/50 transition-all duration-200 shadow-md hover:shadow-lg hover:shadow-[var(--accent)]/5 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {/* Game Thumbnail / Icon with Play overlay */}
                    <div 
                      className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-white/10 group-hover:border-[var(--accent)]/40 transition-colors shadow-inner"
                      style={{ backgroundColor: game.color || '#1e293b' }}
                    >
                      {game.thumbnail ? (
                        <img
                          src={game.thumbnail}
                          alt={game.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-xl font-black text-white/40 group-hover:text-white transition-colors">
                          {game.title.charAt(0)}
                        </span>
                      )}

                      {/* Play Hover Overlay */}
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                        <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-slate-950 flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </div>
                      </div>
                    </div>

                    {/* Game Info & Quick Resume CTA */}
                    <div className="flex-1 min-w-0 pr-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--accent)] truncate max-w-[80px]">
                          {game.category}
                        </span>
                        <span className="text-slate-600 text-[10px]">•</span>
                        <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1 shrink-0">
                          <Clock className="w-2.5 h-2.5 text-slate-500" />
                          {timeString}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-white truncate transition-colors">
                        {game.title}
                      </h3>

                      <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] group-hover:translate-x-0.5 transition-transform">
                        <span>Resume</span>
                        <ChevronRight className="w-3 h-3" />
                      </div>
                    </div>
                  </Link>

                  {/* Dismiss Single Item Button */}
                  <button
                    onClick={(e) => handleDismiss(e, game.id)}
                    title={`Remove ${game.title} from recently played`}
                    className="absolute -top-1.5 -right-1.5 z-10 w-5 h-5 rounded-full bg-slate-900/90 hover:bg-rose-600 border border-white/20 text-slate-400 hover:text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-md scale-90 hover:scale-105"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
