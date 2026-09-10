import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, 
  Heart, 
  User as UserIcon, 
  PlusCircle, 
  Crown, 
  Trophy, 
  Medal, 
  Package, 
  Clock, 
  X, 
  Trash2, 
  Play, 
  ArrowRight, 
  Sparkles, 
  Gamepad2,
  History
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAchievements } from './AchievementsContext';
import { AvatarDisplay } from './AvatarDisplay';
import { getHlAccountName } from '../utils/nameGenerator';
import { getAllGames } from '../utils/getAllGames';
import { Game } from '../types';

const RECENT_SEARCHES_KEY = 'nexus_recent_searches';
const MAX_RECENT_SEARCHES = 8;

const POPULAR_SEARCH_SUGGESTIONS = [
  'Slope',
  '1v1.LOL',
  'Tunnel Rush',
  'Subway Surfers',
  'Retro Bowl',
  'Cookie Clicker'
];

function getStoredRecentSearches(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
    }
  } catch (e) {
    console.warn('Failed reading recent searches from localStorage', e);
  }
  return [];
}

function saveRecentSearch(query: string): string[] {
  const trimmed = query.trim();
  if (!trimmed) return getStoredRecentSearches();
  try {
    const current = getStoredRecentSearches();
    const filtered = current.filter(item => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Failed saving recent search to localStorage', e);
    return [];
  }
}

function removeStoredSearch(queryToRemove: string): string[] {
  try {
    const current = getStoredRecentSearches();
    const updated = current.filter(item => item.toLowerCase() !== queryToRemove.toLowerCase());
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
}

function clearStoredSearches(): void {
  try {
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (e) {}
}

interface NavbarProps {
  onSearch: (query: string) => void;
  searchQuery?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch, searchQuery = '' }) => {
  const { user, profile, signIn, isOwner } = useAuth();
  const { unlocked, unlockAchievement } = useAchievements();
  const location = useLocation();
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState(searchQuery);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => getStoredRecentSearches());
  const [allGames, setAllGames] = useState<Game[]>(() => getAllGames());

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external search query
  useEffect(() => {
    if (searchQuery !== undefined && searchQuery !== inputValue) {
      setInputValue(searchQuery);
    }
  }, [searchQuery]);

  // Keep games catalog updated
  useEffect(() => {
    const handleUpdate = () => {
      setAllGames(getAllGames());
    };
    window.addEventListener('nexus_games_updated', handleUpdate);
    return () => window.removeEventListener('nexus_games_updated', handleUpdate);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [logoTapCount, setLogoTapCount] = useState(0);

  const handleLogoClick = (e: React.MouseEvent) => {
    const nextCount = logoTapCount + 1;
    setLogoTapCount(nextCount);

    if (nextCount >= 5) {
      try { unlockAchievement('easter_egg_king'); } catch (err) {}
      setLogoTapCount(0);
    }

    setTimeout(() => {
      setLogoTapCount(0);
    }, 3000);
  };

  const unlockedCount = Object.keys(unlocked).length;

  const handleSelectSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    const updated = saveRecentSearch(trimmed);
    setRecentSearches(updated);
    setInputValue(trimmed);
    onSearch(trimmed);
    if (trimmed.length >= 2) {
      try { unlockAchievement('search_master'); } catch (err) {}
    }
    setIsDropdownOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleSelectGame = (game: Game) => {
    const updated = saveRecentSearch(game.title);
    setRecentSearches(updated);
    setIsDropdownOpen(false);
    navigate(`/play/${game.id}`);
  };

  const handleRemoveSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    const updated = removeStoredSearch(term);
    setRecentSearches(updated);
  };

  const handleClearAllSearches = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearStoredSearches();
    setRecentSearches([]);
  };

  const handleClearInput = () => {
    setInputValue('');
    onSearch('');
    inputRef.current?.focus();
  };

  const trimmedInput = inputValue.trim().toLowerCase();

  const matchingRecentSearches = useMemo(() => {
    if (!trimmedInput) return recentSearches;
    return recentSearches.filter(s => s.toLowerCase().includes(trimmedInput));
  }, [trimmedInput, recentSearches]);

  const matchingGames = useMemo(() => {
    if (!trimmedInput) return [];
    return allGames.filter(g =>
      g.title.toLowerCase().includes(trimmedInput) ||
      g.category.toLowerCase().includes(trimmedInput)
    ).slice(0, 5);
  }, [trimmedInput, allGames]);

  // Helper to find direct game match for a recent search
  const findGameForSearch = (term: string): Game | undefined => {
    const t = term.toLowerCase().trim();
    return allGames.find(g => g.title.toLowerCase() === t || g.id.toLowerCase() === t);
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 sm:h-16 px-4 sm:px-8 bg-bg-dark/70 backdrop-blur-xl border-b border-white/10">
      <div onClick={handleLogoClick} className="cursor-pointer shrink-0">
        <Link 
          to="/" 
          onClick={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          onPointerDown={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 bg-[var(--accent)] text-white rounded-lg flex items-center justify-center font-black text-base shadow-md shadow-[var(--accent)]/30 group-hover:scale-105 transition-all">
            N
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">
            NEXUS<span className="text-[var(--accent)] ml-0.5">GAMES</span>
          </span>
        </Link>
      </div>

      <div ref={searchContainerRef} className="flex-1 max-w-xs sm:max-w-md mx-3 sm:mx-8 relative">
        <div className="relative flex items-center">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search games..."
            value={inputValue}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              const val = e.target.value;
              setInputValue(val);
              onSearch(val);
              if (val.trim().length >= 2) {
                try { unlockAchievement('search_master'); } catch (err) {}
              }
              if (location.pathname !== '/') {
                navigate('/');
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (inputValue.trim()) {
                  handleSelectSearch(inputValue.trim());
                }
              } else if (e.key === 'Escape') {
                setIsDropdownOpen(false);
                inputRef.current?.blur();
              }
            }}
            className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-8 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50 text-xs transition-all text-white placeholder-slate-400"
          />
          {inputValue && (
            <button
              onClick={handleClearInput}
              className="absolute inset-y-0 right-2.5 flex items-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Recent Searches Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 z-50 overflow-hidden divide-y divide-white/5">
            {/* Recent Searches Header & Items */}
            {recentSearches.length > 0 ? (
              <div>
                <div className="flex items-center justify-between px-3.5 py-2 bg-white/[0.02]">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300">
                    <History className="w-3 h-3 text-[var(--accent)]" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    onClick={handleClearAllSearches}
                    className="text-[10px] text-slate-400 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Clear all recent searches"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear all</span>
                  </button>
                </div>

                <div className="py-1 max-h-56 overflow-y-auto">
                  {matchingRecentSearches.length > 0 ? (
                    matchingRecentSearches.map((term) => {
                      const matchedGame = findGameForSearch(term);
                      return (
                        <div
                          key={term}
                          onClick={() => handleSelectSearch(term)}
                          className="group flex items-center justify-between px-3.5 py-2 hover:bg-white/10 transition-colors cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--accent)] shrink-0 transition-colors" />
                            <span className="text-white font-medium truncate">{term}</span>
                            {matchedGame && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 shrink-0 hidden sm:inline">
                                {matchedGame.category}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {matchedGame && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectGame(matchedGame);
                                }}
                                className="opacity-0 group-hover:opacity-100 px-2 py-0.5 rounded-full bg-[var(--accent)]/20 hover:bg-[var(--accent)] text-[var(--accent)] hover:text-black font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                                title={`Quick play ${matchedGame.title}`}
                              >
                                <Play className="w-2.5 h-2.5 fill-current" />
                                <span>Play</span>
                              </button>
                            )}
                            <button
                              onClick={(e) => handleRemoveSearch(e, term)}
                              className="p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                              title="Remove search"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3.5 py-2 text-xs text-slate-500 italic">
                      No recent searches matching "{inputValue}"
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-3.5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-[var(--accent)]" />
                  <span>Popular Games & Quick Jumps</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {POPULAR_SEARCH_SUGGESTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => handleSelectSearch(tag)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-[var(--accent)]/20 hover:text-[var(--accent)] text-slate-300 text-xs font-medium border border-white/5 transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Jump Matching Games */}
            {matchingGames.length > 0 && (
              <div className="p-2 bg-black/20">
                <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Gamepad2 className="w-3 h-3 text-[var(--accent)]" />
                  <span>Matching Games</span>
                </div>
                <div className="space-y-0.5 mt-1">
                  {matchingGames.map(g => (
                    <div
                      key={g.id}
                      onClick={() => handleSelectGame(g)}
                      className="flex items-center justify-between p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div 
                          className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 overflow-hidden border border-white/10"
                          style={{ backgroundColor: g.color }}
                        >
                          {g.thumbnail ? (
                            <img src={g.thumbnail} alt={g.title} className="w-full h-full object-cover" />
                          ) : (
                            g.title.charAt(0)
                          )}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-white group-hover:text-[var(--accent)] transition-colors truncate">
                            {g.title}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {g.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-[var(--accent)] opacity-0 group-hover:opacity-100 transition-opacity pr-2 shrink-0">
                        <span>Play</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search all shortcut if typing */}
            {inputValue.trim() && (
              <div 
                onClick={() => handleSelectSearch(inputValue.trim())}
                className="px-3.5 py-2 hover:bg-white/10 transition-colors cursor-pointer flex items-center justify-between text-xs text-slate-300 font-medium"
              >
                <div className="flex items-center gap-2 truncate">
                  <Search className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                  <span className="truncate">Search all for <strong className="text-white">"{inputValue.trim()}"</strong></span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-white/10 rounded text-slate-400 shrink-0">Enter ↵</span>
              </div>
            )}
          </div>
        )}
      </div>

      <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <Link
          to="/cases"
          title="Unbox Cases & Avatar Inventory"
          onClick={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          onPointerDown={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm shadow-amber-500/10 cursor-pointer"
        >
          <Package className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Cases</span>
        </Link>

        <Link
          to="/leaderboard"
          title="View Community Leaderboard & Rankings"
          onClick={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          onPointerDown={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <Medal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Leaderboard</span>
        </Link>

        <Link
          to="/achievements"
          title="View Achievements & XP Level"
          onClick={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          onPointerDown={() => {
            if (document.activeElement?.tagName?.toLowerCase() === 'iframe') {
              try { (document.activeElement as HTMLElement)?.blur(); window.focus(); } catch (e) {}
            }
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Achievements</span>
          <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] font-mono rounded-full font-bold">
            {unlockedCount}
          </span>
        </Link>

        {user ? (
          <div className="flex items-center gap-2 ml-1">
            <div className="hidden lg:block text-right">
              <p className="text-[11px] font-bold text-white leading-none mb-0.5 flex items-center gap-1 justify-end">
                {(isOwner || user.email?.toLowerCase() === 'alexsarsero@gmail.com') && <Crown className="w-3 h-3 text-amber-400 inline" />}
                {isOwner || user.email?.toLowerCase() === 'alexsarsero@gmail.com' ? 'Gordon Freeman' : getHlAccountName(user.uid, false, user.email, profile?.nickname || user.displayName)}
              </p>
              <p className="text-[9px] text-amber-400/90 font-mono font-bold leading-none">
                {isOwner || user.email?.toLowerCase() === 'alexsarsero@gmail.com' ? '👑 GORDON FREEMAN (OWNER)' : 'Half-Life Combatant'}
              </p>
            </div>
            <Link to="/cases" title="View Inventory & Change Avatar">
              <AvatarDisplay avatarId={profile?.equippedAvatar} size="sm" />
            </Link>
          </div>
        ) : (
          <button 
            onClick={signIn}
            className="px-3.5 py-1.5 bg-[var(--accent)] hover:brightness-110 text-white text-xs font-bold rounded-full transition-all shadow-md shadow-[var(--accent)]/20 active:scale-95 ml-1"
          >
            Sign In
          </button>
        )}
      </nav>
    </header>
  );
};

