import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Game, Category } from '../types';
import { GameCard } from '../components/GameCard';
import { getAllGames } from '../utils/getAllGames';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { useSettings } from '../components/SettingsContext';
import { useAchievements } from '../components/AchievementsContext';

interface HomeProps {
  searchQuery: string;
  activeCategory: Category;
}

export const Home: React.FC<HomeProps> = ({ searchQuery, activeCategory }) => {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const { incrementProgress, unlockAchievement } = useAchievements();
  const [allGamesList, setAllGamesList] = useState<Game[]>(() => getAllGames());

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

  const featuredGames = useMemo(() => allGamesList.filter(g => g.featured), [allGamesList]);
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

  const filteredGames = allGamesList.filter((game) => {
    const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesCategory = false;
    if (activeCategory === 'all') {
      matchesCategory = true;
    } else if (activeCategory === 'Favorites') {
      matchesCategory = profile?.favorites?.includes(game.id) || false;
    } else if (activeCategory === 'Blocked') {
      matchesCategory = game.isBlocked || false;
    } else if (activeCategory === 'Unblocked') {
      matchesCategory = !game.isBlocked;
    } else {
      matchesCategory = game.category === activeCategory;
    }
    
    return matchesSearch && matchesCategory;
  });

  const blockedGames = React.useMemo(() => filteredGames.filter(g => g.isBlocked), [filteredGames]);
  const unblockedGames = React.useMemo(() => filteredGames.filter(g => !g.isBlocked), [filteredGames]);

  const featuredGame = featuredGames[featuredIndex];

  const gridClass = settings.compactGrid
    ? "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5"
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6";

  return (
    <div className="flex-1 p-8 overflow-x-hidden space-y-12">
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
            {/* Solid color background banner as requested, without thumbnail */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent z-10"></div>
            
            <div className="absolute top-1/2 right-10 -translate-y-1/2 text-[180px] leading-none font-black text-white/5 select-none hidden lg:block uppercase tracking-tighter z-10">
              {featuredGame.title.charAt(0)}
            </div>

            <div className="absolute inset-0 z-20 p-10 flex flex-col justify-end">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-4">
                  <span className="px-2 py-0.5 bg-[var(--accent)] text-[10px] font-bold rounded uppercase tracking-wider text-white">Trending</span>
                  <span className="text-slate-300 text-xs font-semibold">{featuredGame.category}</span>
                </div>
                <h1 className="text-5xl font-black mb-3 tracking-tight text-white">{featuredGame.title}</h1>
                <p className="text-slate-300 text-base mb-6 line-clamp-2 max-w-lg">
                  {featuredGame.description}
                </p>
                <Link 
                  to={`/play/${featuredGame.id}`}
                  className="inline-flex px-8 py-3 bg-white text-slate-950 font-bold rounded-lg hover:scale-105 active:scale-95 transition-transform items-center gap-2"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 12 8-12 8V4z"/></svg>
                  Play Now
                </Link>
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {activeCategory === 'all' && !searchQuery ? (
        <>
          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-red-500 rounded-full"></span>
                Blocked Sector
              </h2>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {blockedGames.length} Missions 
              </div>
            </div>
            <div className={gridClass}>
              {blockedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <span className="w-1.5 h-6 bg-green-500 rounded-full"></span>
                Unblocked Sector
              </h2>
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                {unblockedGames.length} Missions
              </div>
            </div>
            <div className={gridClass}>
              {unblockedGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        </>
      ) : (
        <section>
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-1.5 h-6 bg-[var(--accent)] rounded-full"></span>
              {activeCategory === 'all' ? 'Quick Plays' : `${activeCategory} Games`}
            </h2>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/5 border border-white/10 px-3 py-1 rounded-full">
              {filteredGames.length} Missions
            </div>
          </div>
          
          {filteredGames.length > 0 ? (
            <div className={gridClass}>
              {filteredGames.map((game) => (
                <GameCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 glass-card rounded-3xl text-slate-500"
            >
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                 <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              </div>
              <p className="text-xl font-bold text-slate-400">Signal Lost</p>
              <p className="text-sm mt-1">No matches found in the sector.</p>
            </motion.div>
          )}
        </section>
      )}
    </div>
  );
};

