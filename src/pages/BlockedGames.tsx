import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Lock, ShieldAlert, ArrowLeft, Search, AlertTriangle } from 'lucide-react';
import { Game } from '../types';
import { GameCard } from '../components/GameCard';
import { getAllGames } from '../utils/getAllGames';
import { useSettings } from '../components/SettingsContext';
import { motion } from 'motion/react';

interface BlockedGamesProps {
  searchQuery?: string;
}

export const BlockedGames: React.FC<BlockedGamesProps> = ({ searchQuery: globalSearch = '' }) => {
  const { settings } = useSettings();
  const [allGamesList, setAllGamesList] = useState<Game[]>(() => getAllGames());
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    const handleGamesUpdate = () => {
      setAllGamesList(getAllGames());
    };
    window.addEventListener('nexus_games_updated', handleGamesUpdate);
    return () => window.removeEventListener('nexus_games_updated', handleGamesUpdate);
  }, []);

  const blockedGames = useMemo(() => {
    return allGamesList.filter((g) => g.isBlocked);
  }, [allGamesList]);

  const activeSearch = localSearch.trim() || globalSearch.trim();

  const filteredBlocked = useMemo(() => {
    if (!activeSearch) return blockedGames;
    const q = activeSearch.toLowerCase();
    return blockedGames.filter(
      (game) =>
        game.title.toLowerCase().includes(q) ||
        game.category.toLowerCase().includes(q) ||
        game.description.toLowerCase().includes(q)
    );
  }, [blockedGames, activeSearch]);

  const gridClass = settings.compactGrid
    ? 'grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3.5'
    : 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6';

  return (
    <div className="flex-1 p-6 sm:p-8 overflow-x-hidden space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/70 via-slate-900/90 to-slate-950 border border-rose-500/20 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl space-y-3">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs text-rose-300 hover:text-white transition-colors bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full font-bold"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Return to Main Arcade</span>
              </Link>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                Restricted Sector
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <Lock className="w-8 h-8 text-rose-500 shrink-0" />
              <span>Blocked Sector</span>
            </h1>

            <p className="text-slate-300 text-sm leading-relaxed">
              These games are isolated from the main catalog due to network restrictions, external provider blocks, or maintenance quarantine. You can still view details and attempt launch protocols.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 shrink-0">
            <div className="px-4 py-2 rounded-2xl bg-black/40 border border-rose-500/30 text-right">
              <div className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">
                Quarantined Titles
              </div>
              <div className="text-2xl font-black text-white">
                {blockedGames.length} <span className="text-xs text-slate-400 font-normal">missions</span>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter blocked missions..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Blocked Games Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <span className="w-1.5 h-5 bg-rose-500 rounded-full"></span>
            <span>Restricted Game Vault</span>
          </h2>
          <span className="text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
            Showing {filteredBlocked.length} of {blockedGames.length}
          </span>
        </div>

        {filteredBlocked.length > 0 ? (
          <div className={gridClass}>
            {filteredBlocked.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 glass-card rounded-3xl text-slate-400 text-center"
          >
            <ShieldAlert className="w-12 h-12 text-rose-400/60 mb-3" />
            <p className="text-lg font-bold text-white">No Blocked Games Found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {activeSearch
                ? `No quarantined missions match "${activeSearch}".`
                : 'No games are currently designated in the blocked sector.'}
            </p>
          </motion.div>
        )}
      </section>
    </div>
  );
};
