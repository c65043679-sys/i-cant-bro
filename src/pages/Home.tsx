import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Game, Category } from '../types';
import { GameCard } from '../components/GameCard';
import { getAllGames } from '../utils/getAllGames';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { useSettings } from '../components/SettingsContext';
import { useAchievements } from '../components/AchievementsContext';
import { SortDropdown, SortOption } from '../components/SortDropdown';
import { Lock, ArrowRight, X } from 'lucide-react';

interface HomeProps {
  searchQuery: string;
  activeCategory: Category;
}

export const Home: React.FC<HomeProps> = ({ searchQuery, activeCategory }) => {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const { incrementProgress, unlockAchievement } = useAchievements();
  const [allGamesList, setAllGamesList] = useState<Game[]>(() => getAllGames());
  const [hideBlockedNotice, setHideBlockedNotice] = useState(() => {
    try {
      return localStorage.getItem('nexus_hide_blocked_notice') === 'true';
    } catch (e) {
      return false;
    }
  });
  const [sortOption, setSortOption] = useState<SortOption>(() => {
    try {
      const saved = localStorage.getItem('nexus_home_sort');
      if (saved === 'Popularity' || saved === 'Newest' || saved === 'Alphabetical') {
        return saved as SortOption;
      }
    } catch (e) {}
    return 'Popularity';
  });

  const handleSortChange = (newSort: SortOption) => {
    setSortOption(newSort);
    try {
      localStorage.setItem('nexus_home_sort', newSort);
    } catch (e) {}
  };

  useEffect(() => {
    if (profile?.favorites) {
      if (profile.favorites.length >= 3) {
        try { unlockAchievement('favorite_collector'); } catch (e) {}
      }
      if (profile.favorites.length >= 5) {
        try { unlockAchievement('hoarder_supreme'); } catch (e) {}
      }
    }
  }, [profile?.favorites]);

  useEffect(() => {
    if (activeCategory !== 'all' && activeCategory !== 'Favorites' && activeCategory !== 'Blocked' && activeCategory !== 'Unblocked') {
      try { incrementProgress('genre_explorer', 1); } catch (e) {}
    }
  }, [activeCategory]);

  useEffect(() => {
    const handleGamesUpdate = () => {
      setAllGamesList(getAllGames());
    };
    window.addEventListener('nexus_games_updated', handleGamesUpdate);
    return () => window.removeEventListener('nexus_games_updated', handleGamesUpdate);
  }, []);

  // Blocked games are moved to their own dedicated section (/blocked) and excluded from the Home catalog
  const unblockedGames = useMemo(() => {
    return allGamesList.filter((g) => !g.isBlocked);
  }, [allGamesList]);

  const blockedCount = useMemo(() => {
    return allGamesList.filter((g) => g.isBlocked).length;
  }, [allGamesList]);

  const featuredGames = useMemo(() => unblockedGames.filter(g => g.featured), [unblockedGames]);
  const [featuredIndex, setFeaturedIndex] = useState(() => 
    Math.floor(Math.random() * (featuredGames.length || 1))
  );

  useEffect(() => {
    if (featuredGames.length <= 1) return;
    
    // Rotate every 10 minutes (600,000ms)
    const interval = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredGames.length);
    }, 600000);

    return () => clearInterval(interval);
  }, [featuredGames.length]);

  const filteredGames = useMemo(() => {
    return unblockedGames.filter((game) => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = false;
      if (activeCategory === 'all' || activeCategory === 'Unblocked') {
        matchesCategory = true;
      } else if (activeCategory === 'Favorites') {
        matchesCategory = profile?.favorites?.includes(game.id) || false;
      } else if (activeCategory === 'Blocked') {
        // Handled via redirect or empty on Home
        matchesCategory = false;
      } else {
        matchesCategory = game.category === activeCategory;
      }
      
      return matchesSearch && matchesCategory;
    });
  }, [unblockedGames, searchQuery, activeCategory, profile?.favorites]);

  const sortedGames = useMemo(() => {
    const list = [...filteredGames];

    if (sortOption === 'Popularity') {
      return list.sort((a, b) => {
        if (b.trending !== a.trending) {
          return (b.trending ? 1 : 0) - (a.trending ? 1 : 0);
        }
        if (b.featured !== a.featured) {
          return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        }
        if ((b.rating || 0) !== (a.rating || 0)) {
          return (b.rating || 0) - (a.rating || 0);
        }
        return a.title.localeCompare(b.title);
      });
    }

    if (sortOption === 'Newest') {
      return list.sort((a, b) => {
        const getRank = (item: Game) => {
          const idx = allGamesList.findIndex((g) => g.id === item.id);
          return idx !== -1 ? idx : 0;
        };
        return getRank(b) - getRank(a);
      });
    }

    if (sortOption === 'Alphabetical') {
      return list.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' })
      );
    }

    return list;
  }, [filteredGames, sortOption, allGamesList]);

  const featuredGame = featuredGames[featuredIndex];

  const gridClass = settings.compactGrid
    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5"
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6";

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-x-hidden space-y-10">
      {featuredGame && activeCategory === 'all' && !searchQuery && (
        <section>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full"></span>
            Featured Masterpiece
          </h2>
          <motion.div 
            key={featuredGame.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="relative w-full h-[320px] rounded-2xl overflow-hidden group border border-white/10 shadow-2xl"
            style={{ backgroundColor: featuredGame.color }}
          >
            {/* Solid color background banner */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
            
            <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[180px] leading-none font-black text-white/5 select-none hidden lg:block uppercase tracking-tighter z-10">
              {featuredGame.title.charAt(0)}
            </div>

            <div className="absolute inset-0 z-20 p-8 sm:p-10 flex flex-col justify-end">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-0.5 bg-[var(--accent)] text-[10px] font-bold rounded uppercase tracking-wider text-white">Trending</span>
                  <span className="text-slate-300 text-xs font-semibold">{featuredGame.category}</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black mb-3 tracking-tight text-white">{featuredGame.title}</h1>
                <p className="text-slate-300 text-sm sm:text-base mb-6 line-clamp-2 max-w-lg">
                  {featuredGame.description}
                </p>
                <Link 
                  to={`/play/${featuredGame.id}`}
                  className="inline-flex px-7 py-3 bg-white text-slate-950 font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform items-center gap-2 shadow-lg"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                  Play Now
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* Main Game Listings with Sorting Controls */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full"></span>
              {activeCategory === 'all' ? 'All Games' : `${activeCategory} Games`}
            </h2>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full font-mono">
              {sortedGames.length} Missions
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <SortDropdown value={sortOption} onChange={handleSortChange} />
          </div>
        </div>
        
        {sortedGames.length > 0 ? (
          <div className={gridClass}>
            {sortedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-28 glass-card rounded-3xl text-slate-500"
          >
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </div>
            <p className="text-xl font-bold text-slate-400">Signal Lost</p>
            <p className="text-sm mt-1">No matches found in this sector.</p>
          </motion.div>
        )}

        {/* Minimalist Blocked Sector Capsule */}
        {blockedCount > 0 && !hideBlockedNotice && (
          <div className="pt-10 pb-2 flex items-center justify-center">
            <div className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-white/20 backdrop-blur-xl text-xs text-slate-400 transition-all shadow-lg">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="text-slate-300 font-medium">Looking for restricted titles?</span>
              </div>

              <div className="h-3 w-px bg-white/10 mx-0.5"></div>

              <Link
                to="/blocked"
                className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[var(--accent)] transition-colors"
              >
                <span>Blocked Sector</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/20">
                  {blockedCount}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setHideBlockedNotice(true);
                  try {
                    localStorage.setItem('nexus_hide_blocked_notice', 'true');
                  } catch (e) {}
                }}
                className="ml-1.5 p-0.5 rounded-full text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};


