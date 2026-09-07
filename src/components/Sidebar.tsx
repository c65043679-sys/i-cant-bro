import React from 'react';
import { LayoutGrid, Flame, Car, Gamepad, Puzzle, User as UserIcon, LogIn, LogOut, Skull, Trophy, Star, Settings, Lock, Unlock, History, PlusCircle, Crown, BarChart3, Medal, Package } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Category } from '../types';
import { useAuth } from './AuthContext';
import { AvatarDisplay } from './AvatarDisplay';

interface SidebarProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const CATEGORIES: { id: Category; name: string; icon: React.ReactNode }[] = [
  { id: 'all', name: 'All Games', icon: <LayoutGrid className="w-5 h-5" /> },
  { id: 'Favorites', name: 'My Favorites', icon: <Star className="w-5 h-5" /> },
  { id: 'Unblocked', name: 'Unblocked', icon: <Unlock className="w-5 h-5" /> },
  { id: 'Blocked', name: 'Blocked', icon: <Lock className="w-5 h-5" /> },
  { id: 'Action', name: 'Action', icon: <Flame className="w-5 h-5" /> },
  { id: 'Racing', name: 'Racing', icon: <Car className="w-5 h-5" /> },
  { id: 'Arcade', name: 'Arcade', icon: <Gamepad className="w-5 h-5" /> },
  { id: 'Puzzle', name: 'Puzzle', icon: <Puzzle className="w-5 h-5" /> },
  { id: 'Horror', name: 'Horror', icon: <Skull className="w-5 h-5" /> },
  { id: 'Sports', name: 'Sports', icon: <Trophy className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeCategory, onCategoryChange }) => {
  const { user, profile, signIn, logout, isAdmin, isOwner } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside className="w-[240px] shrink-0 hidden md:flex flex-col p-6 border-r border-white/10 bg-slate-900/40 backdrop-blur-md min-h-screen gap-8">
      <div>
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Discover</p>
        <ul className="space-y-1">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <li
                key={cat.id}
                onClick={() => {
                  onCategoryChange(cat.id);
                  if (location.pathname !== '/') {
                    navigate('/');
                  }
                }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent)]/15 text-white border-[var(--accent)]/30 font-semibold'
                    : 'text-slate-400 border-transparent hover:text-white hover:bg-white/5'
                }`}
              >
                <div className={isActive ? 'text-[var(--accent)]' : ''}>
                  {cat.icon}
                </div>
                <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>
                  {cat.name}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-auto pt-6 border-t border-white/5">
        <Link 
          to="/updates"
          className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 block text-center hover:text-[var(--accent)] transition-colors cursor-pointer"
        >
          Nexus v2.6.0
        </Link>
        
        <div className="space-y-2 mt-4">
          <Link 
            to="/cases"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              location.pathname === '/cases'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold shadow-lg shadow-amber-500/10'
                : 'text-slate-400 border border-transparent hover:text-amber-300 hover:bg-white/5'
            }`}
          >
            <Package className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-bold">Cases & Inventory</span>
          </Link>

          <Link 
            to="/leaderboard"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              location.pathname === '/leaderboard'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Medal className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">Leaderboard</span>
          </Link>

          <Link 
            to="/achievements"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              location.pathname === '/achievements'
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">Achievements</span>
          </Link>

          <Link 
            to="/updates"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              location.pathname === '/updates'
                ? 'bg-[var(--accent)]/15 text-white border border-[var(--accent)]/30 font-semibold'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-5 h-5" />
            <span className="text-sm font-medium">System Updates</span>
          </Link>

          <a
            href="https://forms.gle/vbbxSHpEHsYwJyH96"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-transparent text-slate-400 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 text-[var(--accent)]" />
            <span className="text-sm font-medium">Request a Game</span>
          </a>

          {isOwner && (
            <Link 
              to="/owner-vault"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                location.pathname === '/owner-vault'
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-amber-400/80 border border-transparent hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-bold">Owner Vault ⚡</span>
            </Link>
          )}

          <Link 
            to="/settings"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
              location.pathname === '/settings'
                ? 'bg-[var(--accent)]/15 text-white border border-[var(--accent)]/30 font-semibold'
                : 'text-slate-400 border border-transparent hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-sm font-medium">Settings</span>
          </Link>

          {!user ? (
            <div className="flex flex-col items-center gap-4">
              <div id="g_id_onload"
                data-client_id="488989342765-d7aappssk2hpvspgm4hcajrqefjp1oaf.apps.googleusercontent.com"
                data-context="signin"
                data-ux_mode="popup"
                data-callback="handleCredentialResponse"
                data-auto_prompt="false">
              </div>

              <div className="g_id_signin"
                data-type="standard"
                data-shape="rectangular"
                data-theme="dark"
                data-size="large"
                data-text="sign_in_with"
                data-logo_alignment="left">
              </div>
              
              <p className="text-[10px] text-slate-500 font-medium text-center italic">Nexus Secure Login</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1 py-1">
                <AvatarDisplay avatarId={profile?.equippedAvatar} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{profile?.nickname || user.displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate">{isOwner ? 'Nexus Owner' : 'Explorer'}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Log Out</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </aside>
  );
};
