import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { useSettings, TAB_CLOAK_PRESETS, CANVAS_THEMES } from '../components/SettingsContext';
import { useAchievements } from '../components/AchievementsContext';
import { generateGamerTag } from '../utils/nameGenerator';
import { 
  User as UserIcon, 
  Save, 
  Palette, 
  ShieldAlert, 
  Zap, 
  CheckCircle2, 
  ExternalLink, 
  Globe, 
  Sliders, 
  Maximize2,
  Volume2,
  Activity,
  RotateCcw,
  Type,
  Sparkles,
  Layers,
  Circle,
  Eye,
  Trash2,
  AlertTriangle,
  Crown,
  ShieldCheck
} from 'lucide-react';

const ACCENT_HUES = [
  { name: 'Nexus Violet', value: '#7c3aed' },
  { name: 'Neon Cyber', value: '#06b6d4' },
  { name: 'Emerald Matrix', value: '#10b981' },
  { name: 'Solar Gold', value: '#f59e0b' },
  { name: 'Ruby Blaze', value: '#ef4444' },
  { name: 'Orchid Pink', value: '#ec4899' },
  { name: 'Deep Ocean', value: '#3b82f6' },
  { name: 'Cyber Lime', value: '#84cc16' },
  { name: 'Hyper Fuchsia', value: '#d946ef' },
];

export const Settings: React.FC = () => {
  const { user, profile, updateProfile, isOwner, isAdmin, setAdminStatus, setOwnerStatus } = useAuth();
  const { settings, updateSetting, updateSettings, resetSettings, triggerPanic: rawTriggerPanic } = useSettings();
  const { unlockAchievement, wipeAllProgress } = useAchievements();

  const triggerPanic = () => {
    try { unlockAchievement('panic_agent'); } catch (e) {}
    rawTriggerPanic();
  };
  const [message, setMessage] = useState('');
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWipingProgress, setIsWipingProgress] = useState(false);

  const handleWipeAllProgress = async () => {
    setIsWipingProgress(true);
    try {
      await wipeAllProgress();
      setMessage('All account progress, achievements, game points, and leaderboard standings have been wiped.');
      setShowWipeModal(false);
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      console.error(err);
      setMessage('Error wiping progress.');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setIsWipingProgress(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-10 max-w-5xl mx-auto space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Sliders className="w-8 h-8 text-[var(--accent)]" />
            Command Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Personalize visual themes, emergency panic key redirects, performance options, and profile identity.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={resetSettings}
            className="px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            title="Reset to factory default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Defaults
          </button>
        </div>
      </header>

      {message && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 border ${
            message.includes('Error') 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}
        >
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-bold text-sm">{message}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Panel */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Developer Role Simulation Console */}
          <section className="bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-amber-500/10 border border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Dev Testing & Role Override</h2>
                  <p className="text-xs text-slate-400">Instantly toggle Owner/Admin roles to test administrative features</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400" />
                    Simulate Owner Mode
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Grants access to the **Owner Vault 👑** and full platform privileges.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !isOwner;
                    setOwnerStatus(next);
                    setMessage(`Owner Mode successfully simulated: ${next ? 'ENABLED' : 'DISABLED'}`);
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    isOwner ? 'bg-amber-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                    isOwner ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5">
                <div className="space-y-0.5">
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Simulate Admin Mode
                  </p>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Grants moderator/admin access levels across the platform.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const next = !isAdmin;
                    setAdminStatus(next);
                    setMessage(`Admin Mode successfully simulated: ${next ? 'ENABLED' : 'DISABLED'}`);
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer shrink-0 ${
                    isAdmin ? 'bg-purple-500' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                    isAdmin ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>

            <div className="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="text-slate-400 text-center sm:text-left leading-relaxed">
                <span>Current Status: </span>
                <span className={`font-mono font-bold ${isOwner ? 'text-amber-400' : 'text-slate-500'}`}>
                  {isOwner ? '👑 OWNER ACTIVE' : '👤 USER'}
                </span>
                <span className="text-slate-600 font-bold"> | </span>
                <span className={`font-mono font-bold ${isAdmin ? 'text-purple-400' : 'text-slate-500'}`}>
                  {isAdmin ? '🛡️ ADMIN ACTIVE' : '👤 USER'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setOwnerStatus(false);
                    setAdminStatus(false);
                    setMessage('All simulated roles cleared. You are now a standard guest/user.');
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className="px-3 py-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                >
                  Clear Simulated Roles
                </button>
                <button
                  onClick={() => {
                    setOwnerStatus(true);
                    setAdminStatus(true);
                    setMessage('Simulated roles activated. Full Owner/Admin privileges granted!');
                    setTimeout(() => setMessage(''), 3000);
                  }}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-black font-black rounded-xl text-[11px] transition-all cursor-pointer"
                >
                  Activate All Roles
                </button>
              </div>
            </div>
          </section>

          {/* SECTION 1: Cloaking & Emergency Panic Mode */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Emergency Panic & Redirect</h2>
                  <p className="text-xs text-slate-400">Instant stealth redirect and browser tab cloaking</p>
                </div>
              </div>

              <button
                onClick={triggerPanic}
                className="px-3.5 py-1.5 bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-300 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Test Panic Key
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                  Panic Redirect URL
                </label>
                <div className="relative">
                  <input
                    type="url"
                    value={settings.panicUrl}
                    onChange={(e) => updateSetting('panicUrl', e.target.value)}
                    placeholder="https://students.aloysius.vic.edu.au/#?page=/home"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 pl-10 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                  />
                  <Globe className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Pressing the panic hotkey will immediately redirect your browser tab to this destination.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Panic Hotkey
                  </label>
                  <select
                    value={settings.panicKey}
                    onChange={(e) => updateSetting('panicKey', e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
                  >
                    <option value="Backquote">Tilde / Backtick (` or ~)</option>
                    <option value="Escape">Escape Key (Esc)</option>
                    <option value="AltP">Alt + P</option>
                    <option value="AltZ">Alt + Z</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                    Browser Tab Cloak Preset
                  </label>
                  <select
                    value={settings.tabCloak}
                    onChange={(e) => {
                      updateSetting('tabCloak', e.target.value);
                      if (e.target.value !== 'none') {
                        try { 
                          unlockAchievement('cloaking_expert');
                          if (settings.panicKey) {
                            unlockAchievement('secret_agent');
                          }
                        } catch (err) {}
                      }
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all cursor-pointer"
                  >
                    {TAB_CLOAK_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {settings.tabCloak === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Custom Tab Title</label>
                    <input
                      type="text"
                      value={settings.customTabTitle}
                      onChange={(e) => updateSetting('customTabTitle', e.target.value)}
                      placeholder="Student Portal"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">Custom Favicon URL</label>
                    <input
                      type="url"
                      value={settings.customTabFavicon}
                      onChange={(e) => updateSetting('customTabFavicon', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                      className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: Visual Themes & Background Atmosphere */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-[var(--accent)]/15 border border-[var(--accent)]/30 flex items-center justify-center text-[var(--accent)]">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Visual Themes & Atmosphere</h2>
                <p className="text-xs text-slate-400">Personalize global accent colors and background canvas styles</p>
              </div>
            </div>

            {/* Accent Color Selection */}
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Accent Color Preset
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {ACCENT_HUES.map((hue) => {
                  const isSelected = settings.themeColor === hue.value;
                  return (
                    <button
                      key={hue.value}
                      onClick={() => {
                        updateSetting('themeColor', hue.value);
                        try { unlockAchievement('aesthetic_master'); } catch (e) {}
                      }}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                        isSelected 
                          ? 'bg-white/10 border-white text-white shadow-lg shadow-black/40 scale-[1.02]' 
                          : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div 
                        className="w-5 h-5 rounded-full border border-white/20 shrink-0" 
                        style={{ backgroundColor: hue.value }}
                      />
                      <span className="text-xs font-bold truncate">{hue.name}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Custom Hex Color:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.themeColor}
                    onChange={(e) => {
                      updateSetting('themeColor', e.target.value);
                      try { unlockAchievement('aesthetic_master'); } catch (e) {}
                    }}
                    className="w-9 h-9 rounded-xl border border-white/20 bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.themeColor}
                    onChange={(e) => {
                      updateSetting('themeColor', e.target.value);
                      try { unlockAchievement('aesthetic_master'); } catch (e) {}
                    }}
                    className="w-28 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            {/* Canvas Atmosphere Theme */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                Background Atmosphere Canvas
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {CANVAS_THEMES.map((theme) => {
                  const isSelected = settings.canvasTheme === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        updateSetting('canvasTheme', theme.id);
                        try { 
                          unlockAchievement('aesthetic_master');
                          if (theme.id === 'matrix') {
                            unlockAchievement('matrix_surfer');
                          }
                        } catch (e) {}
                      }}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer space-y-2 ${
                        isSelected
                          ? 'bg-white/10 border-white text-white shadow-xl shadow-black/40'
                          : 'bg-black/30 border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{theme.name}</span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight">{theme.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          {/* SECTION 3: Performance & Gameplay Controls */}
          <section className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Performance & Gameplay</h2>
                <p className="text-xs text-slate-400">Frame rate tools, scaling, and animation optimization</p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-white/5">
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    Live FPS Counter Overlay
                  </p>
                  <p className="text-xs text-slate-400">Display real-time FPS and system memory stats in top-right corner</p>
                </div>
                <button
                  onClick={() => {
                    const nextVal = !settings.showFpsCounter;
                    updateSetting('showFpsCounter', nextVal);
                    if (nextVal) {
                      try { unlockAchievement('fps_enthusiast'); } catch (e) {}
                    }
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${
                    settings.showFpsCounter ? 'bg-[var(--accent)]' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                    settings.showFpsCounter ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-sky-400" />
                    Default Game Scaling
                  </p>
                  <p className="text-xs text-slate-400">Adjust canvas zoom level inside the player</p>
                </div>
                <div className="flex items-center gap-1 bg-black/40 border border-white/10 p-1 rounded-xl">
                  {[90, 100, 110, 125].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => updateSetting('gameScale', scale)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        settings.gameScale === scale ? 'bg-[var(--accent)] text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {scale}%
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-bold text-white">Compact Grid View</p>
                  <p className="text-xs text-slate-400">Display more games per row on the homepage</p>
                </div>
                <button
                  onClick={() => updateSetting('compactGrid', !settings.compactGrid)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.compactGrid ? 'bg-[var(--accent)]' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                    settings.compactGrid ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-bold text-white">Ambient Mesh Gradients</p>
                  <p className="text-xs text-slate-400">Enable glowing radial background graphics</p>
                </div>
                <button
                  onClick={() => updateSetting('enableMeshGradient', !settings.enableMeshGradient)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.enableMeshGradient ? 'bg-[var(--accent)]' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                    settings.enableMeshGradient ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <p className="text-sm font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-violet-400" />
                    UI Sound Feedback
                  </p>
                  <p className="text-xs text-slate-400">Play subtle audio clicks on buttons and triggers</p>
                </div>
                <button
                  onClick={() => {
                    updateSetting('uiSoundEffects', !settings.uiSoundEffects);
                    try { unlockAchievement('sound_maestro'); } catch (e) {}
                  }}
                  className={`w-12 h-6 rounded-full relative transition-colors ${
                    settings.uiSoundEffects ? 'bg-[var(--accent)]' : 'bg-slate-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-all absolute top-1 ${
                    settings.uiSoundEffects ? 'right-1' : 'left-1'
                  }`} />
                </button>
              </div>
            </div>
          </section>

        </div>

        {/* Sidebar Panel: Account & Profile Sync */}
        <aside className="space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 backdrop-blur-xl">
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="w-10 h-10 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <UserIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Profile Identity</h2>
                <p className="text-[11px] text-slate-400">Manage member alias</p>
              </div>
            </div>

            {user ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2">Assigned Gamer Tag</label>
                  <div className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-bold text-amber-400 font-mono flex items-center justify-between shadow-inner">
                    <span>{generateGamerTag(user.uid, isOwner, user.email)}</span>
                    <span className="text-[10px] text-slate-500 font-sans font-normal">Auto-Assigned</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    Community handle is deterministically assigned to keep rankings clean and fair.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Account ID</span>
                    <span className="font-mono text-white text-[10px] truncate max-w-[120px]">{user.uid}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Status</span>
                    <span className="text-emerald-400 font-bold">Active Member</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3">
                <p className="text-xs text-slate-400">Sign in to sync your saved games and custom settings across devices.</p>
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-gradient-to-br from-[var(--accent)]/20 to-transparent border border-[var(--accent)]/30 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Panic Key Active
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Pressing <kbd className="px-1.5 py-0.5 rounded bg-black/60 text-white font-mono font-bold">{settings.panicKey}</kbd> anywhere on the site will instantly switch your browser tab to <span className="font-mono text-amber-300 underline">{settings.panicUrl}</span>.
            </p>
          </div>

          {/* Danger Zone: Wipe Account Progress */}
          <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 space-y-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Wipe Account Progress</h3>
                <p className="text-[11px] text-slate-400 font-medium">Reset achievements, points & ranks</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Permanently clear all unlocked achievements, XP, game points, level rank, and leaderboard standings.
            </p>

            <button
              onClick={() => setShowWipeModal(true)}
              className="w-full py-3 bg-red-600/80 hover:bg-red-600 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/20 active:scale-95 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              Wipe Account Progress
            </button>
          </div>
        </aside>
      </div>

      {/* Wipe Confirmation Modal */}
      {showWipeModal && (
        <div className="fixed inset-0 z-[100000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl text-white"
          >
            <div className="flex items-center gap-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black">Wipe All Progress?</h3>
                <p className="text-xs text-slate-400">This action cannot be undone</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-4 rounded-2xl border border-white/5">
              Are you sure you want to completely wipe your account progress? All unlocked achievements, XP, accumulated game points, level rank, and leaderboard entries will be deleted.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowWipeModal(false)}
                disabled={isWipingProgress}
                className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-white font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWipeAllProgress}
                disabled={isWipingProgress}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                {isWipingProgress ? 'Wiping...' : 'Yes, Wipe Progress'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
