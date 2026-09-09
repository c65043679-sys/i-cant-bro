import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Home } from './pages/Home';
import { Play } from './pages/Play';
import { Settings } from './pages/Settings';
import { Updates } from './pages/Updates';
import { Category } from './types';
import { AuthProvider, useAuth } from './components/AuthContext';
import { SettingsProvider, useSettings } from './components/SettingsContext';
import { AchievementsProvider } from './components/AchievementsContext';
import { Achievements } from './pages/Achievements';
import { Leaderboard } from './pages/Leaderboard';
import { CasesAndInventory } from './pages/CasesAndInventory';
import { FpsCounter } from './components/FpsCounter';
import { PanicOverlay } from './components/PanicOverlay';
import { BroadcastBanner } from './components/BroadcastBanner';
import { MatrixRainCanvas } from './components/MatrixRainCanvas';
import { GlobalPartyListener } from './components/GlobalPartyListener';
import { GlobalEffectsListener } from './components/GlobalEffectsListener';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const { profile } = useAuth();
  const { settings, updateSetting } = useSettings();
  const location = useLocation();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const lastSyncedThemeRef = useRef<string | null>(null);
  React.useEffect(() => {
    if (profile?.themeColor && profile.themeColor !== settings.themeColor && lastSyncedThemeRef.current !== profile.themeColor) {
      lastSyncedThemeRef.current = profile.themeColor;
      updateSetting('themeColor', profile.themeColor);
    }
  }, [profile?.themeColor, settings.themeColor, updateSetting]);

  // Scroll to top on every route change
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.pathname]);

  // Global Focus & Pointer-Lock Shield:
  // When a user plays an iframe game, the iframe captures browser focus and sometimes pointer-lock.
  // When the cursor moves outside the iframe or clicks on the Navbar, Sidebar, or other controls,
  // this immediately restores parent window focus and releases pointer-lock so the first click always works.
  useEffect(() => {
    const handlePointerOutside = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      const isIframe = target && (target.tagName.toLowerCase() === 'iframe' || target.closest('iframe'));

      // If pointer-lock is active and mouse is outside iframe or interacting with parent UI
      if (document.pointerLockElement && !isIframe) {
        try {
          document.exitPointerLock();
        } catch (err) {}
      }

      // If iframe currently holds focus and cursor is over the parent UI
      if (!isIframe && document.activeElement?.tagName?.toLowerCase() === 'iframe') {
        try {
          (document.activeElement as HTMLElement)?.blur();
          window.focus();
        } catch (err) {}
      }
    };

    window.addEventListener('mousemove', handlePointerOutside, { passive: true });
    window.addEventListener('mouseenter', handlePointerOutside, { passive: true });
    window.addEventListener('pointermove', handlePointerOutside, { passive: true });
    window.addEventListener('mousedown', handlePointerOutside, { capture: true });
    window.addEventListener('pointerdown', handlePointerOutside, { capture: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerOutside);
      window.removeEventListener('mouseenter', handlePointerOutside);
      window.removeEventListener('pointermove', handlePointerOutside);
      window.removeEventListener('mousedown', handlePointerOutside, { capture: true });
      window.removeEventListener('pointerdown', handlePointerOutside, { capture: true });
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-bg-dark text-slate-50 font-sans selection:bg-accent selection:text-white overflow-x-hidden">
      {/* Matrix Rain Canvas, Global Effects & Global Party Effect Listener */}
      <MatrixRainCanvas />
      <GlobalPartyListener />
      <GlobalEffectsListener />

      {/* Mesh Gradients */}
      {settings.enableMeshGradient && (
        <>
          <div className="mesh-gradient-1" />
          <div className="mesh-gradient-2" />
        </>
      )}

      <div className="relative z-10 flex flex-col min-h-screen">
        <BroadcastBanner />
        <Navbar onSearch={setSearchQuery} />
        
        <main className="flex flex-1 overflow-hidden">
          <Sidebar 
            activeCategory={activeCategory} 
            onCategoryChange={setActiveCategory} 
          />
          
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto">
            <Routes>
              <Route 
                path="/" 
                element={
                  <Home 
                    searchQuery={searchQuery} 
                    activeCategory={activeCategory} 
                  />
                } 
              />
              <Route path="/play/:id" element={<Play />} />
              <Route path="/cases" element={<CasesAndInventory />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/updates" element={<Updates />} />
            </Routes>
          </div>
        </main>
        
        <footer className="relative py-8 px-6 border-t border-white/10 text-center text-slate-500 text-sm bg-bg-dark/40 backdrop-blur-md">
          <p>© 2026 NEXUS GAMES. All rights reserved.</p>
          <p className="mt-2 text-slate-600">Built with passion for the browser gaming community.</p>
        </footer>
      </div>

      {/* Global Performance HUD & Emergency Panic Overlay */}
      <FpsCounter />
      <PanicOverlay />
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <AchievementsProvider>
            <AppContent />
          </AchievementsProvider>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

