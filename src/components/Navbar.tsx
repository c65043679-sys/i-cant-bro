import React, { useState } from 'react';
import { Search, Heart, User as UserIcon, PlusCircle, Crown, Trophy, Medal, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useAchievements } from './AchievementsContext';
import { AvatarDisplay } from './AvatarDisplay';

interface NavbarProps {
  onSearch: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearch }) => {
  const { user, profile, signIn, isOwner } = useAuth();
  const { unlocked, unlockAchievement } = useAchievements();
  const location = useLocation();
  const navigate = useNavigate();

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

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 sm:h-16 px-4 sm:px-8 bg-bg-dark/70 backdrop-blur-xl border-b border-white/10">
      <div onClick={handleLogoClick} className="cursor-pointer shrink-0">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[var(--accent)] text-white rounded-lg flex items-center justify-center font-black text-base shadow-md shadow-[var(--accent)]/30 group-hover:scale-105 transition-all">
            N
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight">
            NEXUS<span className="text-[var(--accent)] ml-0.5">GAMES</span>
          </span>
        </Link>
      </div>

      <div className="flex-1 max-w-xs sm:max-w-md mx-3 sm:mx-8 relative">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <Search className="w-3.5 h-3.5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder="Search games..."
          className="w-full bg-white/5 border border-white/10 rounded-full py-1.5 pl-9 pr-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent)]/50 text-xs transition-all text-white placeholder-slate-400"
          onChange={(e) => {
            onSearch(e.target.value);
            if (e.target.value.trim().length >= 2) {
              try { unlockAchievement('search_master'); } catch (err) {}
            }
            if (location.pathname !== '/') {
              navigate('/');
            }
          }}
        />
      </div>

      <nav className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        <Link
          to="/cases"
          title="Unbox Cases & Avatar Inventory"
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 text-[11px] sm:text-xs font-bold rounded-full transition-all active:scale-95 shadow-sm shadow-amber-500/10"
        >
          <Package className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Cases</span>
        </Link>

        <Link
          to="/leaderboard"
          title="View Community Leaderboard & Rankings"
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm"
        >
          <Medal className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Leaderboard</span>
        </Link>

        <Link
          to="/achievements"
          title="View Achievements & XP Level"
          className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-amber-300 text-[11px] sm:text-xs font-semibold rounded-full transition-all active:scale-95 shadow-sm"
        >
          <Trophy className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">Achievements</span>
          <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 text-[10px] font-mono rounded-full font-bold">
            {unlockedCount}
          </span>
        </Link>

        {isOwner && (
          <Link
            to="/owner-vault"
            title="Owner Overlord Vault & Control Deck"
            className="flex items-center gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold transition-all active:scale-95 shadow-md bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-black shadow-amber-500/10 hover:brightness-110"
          >
            <Crown className="w-3.5 h-3.5 text-amber-950 fill-amber-950 shrink-0" />
            <span className="whitespace-nowrap">Owner Vault</span>
          </Link>
        )}

        {user ? (
          <div className="flex items-center gap-2 ml-1">
            <div className="hidden lg:block text-right">
              <p className="text-[11px] font-bold text-white leading-none mb-0.5 flex items-center gap-1 justify-end">
                {isOwner && <Crown className="w-3 h-3 text-amber-400 inline" />}
                {profile?.nickname || user.displayName}
              </p>
              <p className="text-[9px] text-amber-400/90 font-mono font-bold leading-none">
                {isOwner ? '👑 OWNER' : 'Nexus Member'}
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

