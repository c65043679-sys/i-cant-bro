import React from 'react';
import { 
  User, Compass, ShieldCheck, Crown, Gamepad2, Sword, Shield, 
  Sparkles, Flame, Eye, Cpu, Sun, Rocket, Orbit, Atom,
  Crosshair, Skull, Zap, Target, Ghost, Gem, ShieldAlert,
  Activity, Trophy, Key, Star, Radio, Box, Waves, Bot,
  Radiation, Terminal, SunMedium, Infinity, Layers, Swords,
  Moon, Dna
} from 'lucide-react';
import { AVATARS_CATALOG, RARITY_CONFIG } from '../data/avatarsData';

interface AvatarDisplayProps {
  avatarId?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showGlow?: boolean;
  className?: string;
  fallbackName?: string;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  User,
  Compass,
  ShieldCheck,
  Crown,
  Gamepad2,
  Sword,
  Shield,
  Sparkles,
  Flame,
  Eye,
  Cpu,
  Sun,
  Rocket,
  Orbit,
  Atom,
  Crosshair,
  Skull,
  Zap,
  Target,
  Ghost,
  Gem,
  ShieldAlert,
  Activity,
  Trophy,
  Key,
  Star,
  Radio,
  Box,
  Waves,
  Bot,
  Radiation,
  Terminal,
  SunMedium,
  Infinity,
  Layers,
  Swords,
  Moon,
  Dna,
};

const SIZE_MAP = {
  xs: { container: 'w-6 h-6 rounded-md', icon: 'w-3.5 h-3.5', badge: 'text-[7px] px-0.5' },
  sm: { container: 'w-8 h-8 rounded-lg', icon: 'w-4 h-4', badge: 'text-[8px] px-1' },
  md: { container: 'w-10 h-10 rounded-xl', icon: 'w-5 h-5', badge: 'text-[9px] px-1' },
  lg: { container: 'w-14 h-14 rounded-2xl', icon: 'w-7 h-7', badge: 'text-[10px] px-1.5' },
  xl: { container: 'w-20 h-20 rounded-2xl', icon: 'w-10 h-10', badge: 'text-xs px-2' },
  '2xl': { container: 'w-28 h-28 rounded-3xl', icon: 'w-14 h-14', badge: 'text-sm px-2.5' },
};

export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({
  avatarId = 'initiate_core',
  size = 'md',
  showGlow = true,
  className = '',
}) => {
  const avatar = AVATARS_CATALOG.find((a) => a.id === avatarId) || AVATARS_CATALOG[0];
  const rarityConfig = RARITY_CONFIG[avatar.rarity];
  const sizeConfig = SIZE_MAP[size];

  const IconComponent = ICON_MAP[avatar.iconName] || User;

  // Custom visual background overlay based on rarity
  const renderRarityVisualEffect = () => {
    switch (avatar.rarity) {
      case 'transcendent':
        return (
          <>
            {/* Transcendent Cosmic Singularity & Hyper-Chroma Aura */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 via-fuchsia-600 to-amber-400 opacity-70 animate-holographic" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.6)_0%,transparent_75%)] animate-glow-breathe" />
            <div className="absolute -inset-2 bg-gradient-to-r from-cyan-400 via-fuchsia-500 via-amber-300 to-emerald-400 opacity-50 blur-lg animate-spin-slow" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-200/50 via-white/70 via-fuchsia-200/50 to-transparent animate-shine pointer-events-none" />
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#fff_1.5px,transparent_1.5px)] bg-[size:5px_5px]" />
          </>
        );
      case 'exotic':
        return (
          <>
            {/* Rainbow Holographic Rotating Gradient & Cosmic Plasma */}
            <div className="absolute inset-0 bg-gradient-to-tr from-rose-600 via-purple-600 to-amber-400 opacity-60 animate-holographic" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.4)_0%,transparent_75%)] animate-glow-breathe" />
            <div className="absolute -inset-2 bg-gradient-to-r from-rose-500 via-amber-300 via-emerald-400 to-purple-600 opacity-40 blur-md animate-spin-slow" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 via-white/60 via-white/40 to-transparent animate-shine pointer-events-none" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] bg-[size:6px_6px]" />
          </>
        );
      case 'mythic':
        return (
          <>
            {/* Contraband Caution Hazard Stripes + Solar Plasma Flare */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,69,0,0.5)_0%,transparent_80%)] animate-glow-breathe" />
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(45deg,#000,#000_6px,#ff4500_6px,#ff4500_12px)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/40 via-white/50 to-transparent animate-shine pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-orange-950/40 to-black/80" />
          </>
        );
      case 'legendary':
        return (
          <>
            {/* ★ Special Gold Blade Rays & Liquid Metallic Sheen */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.45)_0%,transparent_75%)] animate-glow-breathe" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-200/35 via-white/50 to-transparent animate-shine pointer-events-none" />
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_bottom,rgba(251,191,36,0.9)_0%,transparent_60%)]" />
            <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(90deg,rgba(255,215,0,0.3)_0px,transparent_2px,transparent_8px)]" />
          </>
        );
      case 'epic':
        return (
          <>
            {/* Covert Crimson Plasma Void */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(235,75,75,0.4)_0%,transparent_75%)] animate-glow-breathe" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shine pointer-events-none" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#eb4b4b_1px,transparent_1px)] bg-[size:8px_8px]" />
          </>
        );
      case 'rare':
        return (
          <>
            {/* Classified Holographic Prism Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(211,44,230,0.35)_0%,transparent_75%)]" />
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#d32ce6_1px,transparent_1px),linear-gradient(to_bottom,#d32ce6_1px,transparent_1px)] bg-[size:8px_8px]" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-shine pointer-events-none" />
          </>
        );
      case 'uncommon':
        return (
          <>
            {/* Restricted Neon Cyber Circuit Lines */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(136,71,255,0.3)_0%,transparent_75%)]" />
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#8847ff_1px,transparent_1px),linear-gradient(to_bottom,#8847ff_1px,transparent_1px)] bg-[size:10px_10px]" />
          </>
        );
      default:
        return (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(75,105,255,0.25)_0%,transparent_75%)]" />
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#4b69ff_1px,transparent_1px)] bg-[size:8px_8px]" />
          </>
        );
    }
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center bg-gradient-to-br ${avatar.bgGradient} border ${avatar.borderStyle} shrink-0 overflow-hidden shadow-xl transition-all duration-300 group ring-1 ring-inset ring-white/20 ${
        showGlow ? rarityConfig.glowClass : ''
      } ${sizeConfig.container} ${className}`}
      style={{
        boxShadow: showGlow ? `0 0 20px ${avatar.glowColor}, inset 0 0 12px rgba(255,255,255,0.15)` : undefined,
      }}
    >
      {/* Background Visual Texture Effects */}
      {renderRarityVisualEffect()}

      {/* Specular Light Sweep Animation on Hover (Narrow Skewed Beam) */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-25 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700 ease-out pointer-events-none z-20" />

      {/* Radial Ambient Aura behind Icon */}
      <div 
        className="absolute rounded-full pointer-events-none blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-300 z-0 animate-glow-breathe"
        style={{
          width: size === '2xl' ? '80px' : size === 'xl' ? '56px' : size === 'lg' ? '40px' : '26px',
          height: size === '2xl' ? '80px' : size === 'xl' ? '56px' : size === 'lg' ? '40px' : '26px',
          backgroundColor: avatar.glowColor || rarityConfig.color,
        }}
      />

      {/* Icon Backdrop Glass Shield */}
      <div className="relative z-10 flex items-center justify-center rounded-full p-1 bg-black/30 backdrop-blur-xs border border-white/15 shadow-inner transition-all duration-300 group-hover:border-white/40 group-hover:bg-black/20 group-hover:brightness-125">
        <IconComponent
          className={`${sizeConfig.icon} text-white font-black transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] ${
            avatar.rarity === 'transcendent'
              ? 'drop-shadow-[0_0_20px_rgba(0,242,254,1)] text-cyan-100'
              : avatar.rarity === 'exotic'
              ? 'drop-shadow-[0_0_18px_rgba(251,191,36,1)]'
              : avatar.rarity === 'mythic'
              ? 'drop-shadow-[0_0_16px_rgba(255,69,0,0.95)]'
              : avatar.rarity === 'legendary'
              ? 'drop-shadow-[0_0_14px_rgba(255,215,0,0.95)]'
              : avatar.rarity === 'epic'
              ? 'drop-shadow-[0_0_12px_rgba(235,75,75,0.9)]'
              : avatar.rarity === 'rare'
              ? 'drop-shadow-[0_0_10px_rgba(211,44,230,0.85)]'
              : avatar.rarity === 'uncommon'
              ? 'drop-shadow-[0_0_8px_rgba(136,71,255,0.8)]'
              : 'drop-shadow-[0_0_6px_rgba(75,105,255,0.7)]'
          }`}
        />
      </div>


    </div>
  );
};

