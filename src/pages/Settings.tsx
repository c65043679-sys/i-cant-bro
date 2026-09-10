import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAuth } from '../components/AuthContext';
import { useSettings, TAB_CLOAK_PRESETS, CANVAS_THEMES } from '../components/SettingsContext';
import { useAchievements } from '../components/AchievementsContext';
import { generateGamerTag, getHlAccountName, HL_ENEMIES } from '../utils/nameGenerator';
import { formatPlayTime, formatPlayTimeDetailed } from '../hooks/usePlayTimeTracker';
import { db } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
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
  Clock,
  Trophy,
  Gamepad2
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
  const { user, profile, updateProfile, isOwner, signIn } = useAuth();
  const { settings, updateSetting, updateSettings, resetSettings, triggerPanic: rawTriggerPanic } = useSettings();
  const { unlockAchievement, wipeAllProgress, gamesPlayed, levelTitle } = useAchievements();

  const triggerPanic = () => {
    try { unlockAchievement('panic_agent'); } catch (e) {}
    rawTriggerPanic();
  };
  const [message, setMessage] = useState('');
  const [showWipeModal, setShowWipeModal] = useState(false);
  const [isWipingProgress, setIsWipingProgress] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(() => 
    getHlAccountName(user?.uid, isOwner, user?.email, profile?.nickname || user?.displayName || localStorage.getItem('username'))
  );
  const [isSavingName, setIsSavingName] = useState(false);

  useEffect(() => {
    const hlName = getHlAccountName(user?.uid, isOwner, user?.email, profile?.nickname || user?.displayName || localStorage.getItem('username'));
    setNicknameInput(hlName);
  }, [profile?.nickname, profile?.displayName, user?.displayName, user?.uid, user?.email, isOwner]);

  const handleWipeAllProgress = async () => {
    setIsWipingProgress(true);
    try {
      await wipeAllProgress();
      await updateProfile({ totalPlayTime: 0 });
      localStorage.removeItem('nexus_total_play_time');
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
                  <label className="block text-xs font-bold text-slate-400 mb-2">
                    {isOwner ? 'Account Persona (Owner)' : 'Half-Life 1 & 2 Enemy Operative'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      list={isOwner ? undefined : "hl-enemies-list"}
                      value={nicknameInput}
                      onChange={(e) => setNicknameInput(e.target.value)}
                      placeholder={isOwner ? "Gordon Freeman" : "Select or type Half-Life enemy..."}
                      maxLength={28}
                      disabled={isOwner}
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white font-bold font-mono focus:outline-none focus:ring-2 focus:ring-[var(--accent)] disabled:opacity-60"
                    />
                    {!isOwner && (
                      <datalist id="hl-enemies-list">
                        {HL_ENEMIES.map(enemy => (
                          <option key={enemy} value={enemy} />
                        ))}
                      </datalist>
                    )}
                    {!isOwner && (
                      <button
                        onClick={async () => {
                          if (!nicknameInput.trim()) return;
                          setIsSavingName(true);
                          try {
                            const enemyName = getHlAccountName(user.uid, false, user.email, nicknameInput.trim());
                            await updateProfile({ nickname: enemyName, displayName: enemyName });
                            setNicknameInput(enemyName);
                            localStorage.setItem('username', enemyName);
                            
                            // Sync updated handle to Firestore global leaderboard and API
                            if (db) {
                              try {
                                await setDoc(doc(db, 'leaderboard', user.uid), {
                                  uid: user.uid,
                                  displayName: enemyName,
                                  email: user.email || null,
                                  updatedAt: new Date().toISOString()
                                }, { merge: true });
                              } catch (e) {}
                            }

                            fetch('/api/leaderboard', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                uid: user.uid,
                                displayName: enemyName,
                                email: user.email || null
                              })
                            }).catch(() => {});

                            setMessage(`Half-Life enemy handle set to ${enemyName}!`);
                            setTimeout(() => setMessage(''), 3000);
                          } catch (err) {
                            console.error(err);
                          } finally {
                            setIsSavingName(false);
                          }
                        }}
                        disabled={isSavingName || !nicknameInput.trim()}
                        className="px-3.5 py-2 bg-[var(--accent)] hover:brightness-110 text-black font-black text-xs rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    {isOwner 
                      ? 'Owner persona is designated as Gordon Freeman and permanently excluded from competition standings.' 
                      : 'All players must be authentic enemies from Half-Life 1 and Half-Life 2 (e.g., Combine Elite, Alien Grunt, Fast Zombie).'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Account Email</span>
                    <span className="font-mono text-white text-[11px] truncate max-w-[160px]">{user.email || 'None'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Account Status</span>
                    <span className="text-emerald-400 font-bold">Active</span>
                  </div>
                </div>

                {/* Profile Statistics: Total Play Time */}
                <div className="pt-2 border-t border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-[var(--accent)]" />
                      Profile Statistics
                    </span>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* Total Play Time Featured Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 via-black/40 to-black/60 border border-[var(--accent)]/30 relative overflow-hidden group">
                    <div className="absolute -right-3 -top-3 w-20 h-20 bg-[var(--accent)]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[var(--accent)]/20 transition-all" />
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                          Total Play Time
                        </p>
                        <p className="text-2xl font-black text-white font-mono mt-1 tracking-tight">
                          {formatPlayTime(profile?.totalPlayTime || 0)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatPlayTimeDetailed(profile?.totalPlayTime || 0)}
                        </p>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)] shadow-sm">
                        <Clock className="w-4 h-4" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-white/5 relative z-10">
                      Accumulated time spent playing games in the Play view
                    </p>
                  </div>

                  {/* Additional Profile Metrics */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Gamepad2 className="w-3 h-3 text-cyan-400" />
                        Games Played
                      </p>
                      <p className="text-sm font-black text-white font-mono">{gamesPlayed} Titles</p>
                    </div>
                    <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        Rank Title
                      </p>
                      <p className="text-xs font-bold text-amber-300 truncate">{levelTitle}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-black/40 border border-white/5 text-xs space-y-2">
                  <div className="flex justify-between text-slate-400">
                    <span>Current Session</span>
                    <span className="font-mono text-white text-[11px]">Guest Explorer</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Device Alias</span>
                    <span className="text-[var(--accent)] font-bold">{profile?.displayName || 'Nexus Guest'}</span>
                  </div>
                </div>

                {/* Guest Profile Statistics: Total Play Time */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent)]/15 via-black/40 to-black/60 border border-[var(--accent)]/30 relative overflow-hidden group">
                  <div className="absolute -right-3 -top-3 w-20 h-20 bg-[var(--accent)]/10 rounded-full blur-xl pointer-events-none group-hover:bg-[var(--accent)]/20 transition-all" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[var(--accent)]" />
                        Total Play Time
                      </p>
                      <p className="text-2xl font-black text-white font-mono mt-1 tracking-tight">
                        {formatPlayTime(profile?.totalPlayTime || 0)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatPlayTimeDetailed(profile?.totalPlayTime || 0)}
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-[var(--accent)]/20 border border-[var(--accent)]/40 flex items-center justify-center text-[var(--accent)]">
                      <Clock className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2.5 pt-2 border-t border-white/5 relative z-10">
                    Recorded locally for this guest session
                  </p>
                </div>

                <div className="text-center py-2 space-y-2.5">
                  <p className="text-xs text-slate-400">Sign in to permanently sync your Total Play Time and achievements across all your devices.</p>
                  <button
                    onClick={() => signIn()}
                    className="w-full py-2.5 px-4 rounded-xl bg-[var(--accent)] hover:brightness-110 text-black font-black text-xs transition-all cursor-pointer shadow-lg shadow-[var(--accent)]/20 flex items-center justify-center gap-2"
                  >
                    <UserIcon className="w-4 h-4" />
                    Sign In with Google
                  </button>
                </div>
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
