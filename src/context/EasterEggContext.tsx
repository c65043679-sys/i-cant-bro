import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { ENIGMA_37_PARTS, EnigmaPart, TOTAL_ENIGMA_PARTS } from '../data/easterEgg37Data';
import { soundManager } from '../utils/soundEffects';
import { useAchievements } from '../components/AchievementsContext';
import { useAuth } from '../components/AuthContext';

export interface SolvedPartRecord {
  timestamp: number;
  method: 'live_action' | 'terminal_solve';
}

export interface EnigmaNotification {
  id: number;
  title: string;
  rune: string;
  difficulty: string;
  timestamp: number;
}

export interface EasterEggContextType {
  solvedParts: Record<number, SolvedPartRecord>;
  unlockedCount: number;
  isCompleted: boolean;
  isCodexOpen: boolean;
  activeTab: 'seals' | 'terminal' | 'vault';
  setActiveTab: (tab: 'seals' | 'terminal' | 'vault') => void;
  openCodex: (tab?: 'seals' | 'terminal' | 'vault') => void;
  closeCodex: () => void;
  toggleCodex: () => void;
  solvePart: (partId: number, method?: 'live_action' | 'terminal_solve') => boolean;
  checkTerminalInput: (input: string) => { success: boolean; message: string; partId?: number };
  resetProgress: () => void;
  auraActive: boolean;
  toggleAura: () => void;
  masterKey: string;
  creatorDecree: string;
  setCreatorDecree: (decree: string) => void;
  latestNotification: EnigmaNotification | null;
  clearNotification: () => void;
}

const EasterEggContext = createContext<EasterEggContextType | undefined>(undefined);

const STORAGE_KEY = 'nexus_enigma37_solved';
const AURA_STORAGE_KEY = 'nexus_enigma37_aura';
const DECREE_STORAGE_KEY = 'nexus_enigma37_decree';
const DEFAULT_DECREE = "The Master Creator is preparing the grand final reward decree ('i think of a reward soon'). Your 10/10 Master Key is recorded on the Nexus ledger.";

export const EasterEggProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { unlockAchievement, addGamePoints } = useAchievements();
  const { isOwner } = useAuth();

  const [solvedParts, setSolvedParts] = useState<Record<number, SolvedPartRecord>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const solvedPartsRef = useRef<Record<number, SolvedPartRecord>>(solvedParts);
  useEffect(() => {
    solvedPartsRef.current = solvedParts;
  }, [solvedParts]);

  const [auraActive, setAuraActive] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AURA_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [creatorDecree, setCreatorDecreeState] = useState<string>(() => {
    try {
      return localStorage.getItem(DECREE_STORAGE_KEY) || DEFAULT_DECREE;
    } catch {
      return DEFAULT_DECREE;
    }
  });

  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'seals' | 'terminal' | 'vault'>('seals');
  const [latestNotification, setLatestNotification] = useState<EnigmaNotification | null>(null);

  const unlockedCount = Object.keys(solvedParts).length;
  const isCompleted = unlockedCount >= TOTAL_ENIGMA_PARTS;

  const masterKey = 'NX10-ETERNAL-GENESIS-VERIFIED';

  const saveSolved = useCallback((nextState: Record<number, SolvedPartRecord>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
    } catch (err) {
      console.warn('Failed to save enigma progress:', err);
    }
  }, []);

  const openCodex = useCallback((tab?: 'seals' | 'terminal' | 'vault') => {
    if (tab) setActiveTab(tab);
    setIsCodexOpen(true);
    soundManager.playClick(true);
  }, []);

  const closeCodex = useCallback(() => {
    setIsCodexOpen(false);
    soundManager.playClick(true);
  }, []);

  const toggleCodex = useCallback(() => {
    setIsCodexOpen(prev => !prev);
    soundManager.playClick(true);
  }, []);

  const clearNotification = useCallback(() => {
    setLatestNotification(null);
  }, []);

  const setCreatorDecree = useCallback((decree: string) => {
    setCreatorDecreeState(decree);
    try {
      localStorage.setItem(DECREE_STORAGE_KEY, decree);
    } catch {}
  }, []);

  const toggleAura = useCallback(() => {
    setAuraActive(prev => {
      const next = !prev;
      try {
        localStorage.setItem(AURA_STORAGE_KEY, next ? 'true' : 'false');
      } catch {}
      return next;
    });
  }, []);

  const solvePart = useCallback((partId: number, method: 'live_action' | 'terminal_solve' = 'live_action'): boolean => {
    const part = ENIGMA_37_PARTS.find(p => p.id === partId);
    if (!part) return false;

    if (solvedPartsRef.current[partId]) {
      return false; // already solved
    }

    const nextState: Record<number, SolvedPartRecord> = {
      ...solvedPartsRef.current,
      [partId]: {
        timestamp: Date.now(),
        method
      }
    };

    // Check convergence part 10: if parts 1 through 9 are solved, auto-unlock 10
    const count1To9 = Array.from({ length: 9 }, (_, i) => i + 1).filter(id => nextState[id]).length;
    if (count1To9 >= 9 && !nextState[10]) {
      nextState[10] = {
        timestamp: Date.now(),
        method: 'live_action'
      };
    }

    solvedPartsRef.current = nextState;
    saveSolved(nextState);
    setSolvedParts(nextState);

    // Show toast notification
    setLatestNotification({
      id: part.id,
      title: part.title,
      rune: part.rune,
      difficulty: part.difficulty,
      timestamp: Date.now()
    });

    const totalUnlocked = Object.keys(nextState).length;

    // Defer side-effects (sound, confetti, achievement unlocks, points) outside render/reconciler
    setTimeout(() => {
      if (totalUnlocked >= TOTAL_ENIGMA_PARTS) {
        soundManager.playApexAscension(true);
        try {
          confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff']
          });
          setTimeout(() => {
            confetti({
              particleCount: 200,
              spread: 120,
              origin: { y: 0.4 },
              colors: ['#ffd700', '#ffaa00', '#ffffff', '#00ffcc']
            });
          }, 350);
        } catch {}

        try {
          unlockAchievement('enigma_37_master');
          addGamePoints(3700);
        } catch {}

        setAuraActive(true);
        try {
          localStorage.setItem(AURA_STORAGE_KEY, 'true');
        } catch {}
      } else {
        soundManager.playEnigmaRuneUnlock(true);
        try {
          addGamePoints(100);
        } catch {}
      }
    }, 0);

    return true;
  }, [saveSolved, unlockAchievement, addGamePoints]);

  const resetProgress = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AURA_STORAGE_KEY);
    solvedPartsRef.current = {};
    setSolvedParts({});
    setAuraActive(false);
  }, []);

  // Terminal command processor
  const checkTerminalInput = useCallback((rawInput: string): { success: boolean; message: string; partId?: number } => {
    const input = rawInput.trim();
    if (!input) {
      return { success: false, message: 'No input provided.' };
    }

    const lower = input.toLowerCase();

    // System commands
    if (lower === 'help') {
      return {
        success: true,
        message: `AVAILABLE PROTOCOL 10 COMMANDS:
- status         : Displays count of shattered seals and progress
- list / seals   : Lists all 10 seal codenames and runes
- clue <1-10>    : Displays the cryptic riddle for a specific seal
- solve <text>   : Submits an incantation or cipher answer
- key            : Displays assembled fragments of the Apex Master Key
- vault          : Inspects the Grand 10/10 Chamber
- clear          : Wipes the terminal stream
- reset          : Clears current seal progress
(Tip: Enter answers or incantations directly into the prompt. NO HINTS are provided!)`
      };
    }

    if (lower === 'status') {
      return {
        success: true,
        message: `SEAL STATUS: ${unlockedCount} / ${TOTAL_ENIGMA_PARTS} Shattered (${Math.round((unlockedCount / TOTAL_ENIGMA_PARTS) * 100)}%).
${isCompleted ? 'THE APEX SEAL IS COMPLETE. PROCEED TO THE GRAND VAULT.' : 'Cryptic seals remain across the Nexus.'}`
      };
    }

    if (lower === 'list' || lower === 'seals') {
      const lines = ENIGMA_37_PARTS.map(p => {
        const solved = !!solvedParts[p.id];
        return `[${p.id.toString().padStart(2, '0')}] ${p.rune} ${solved ? p.title.padEnd(28, ' ') + '✓ UNSEALED' : '??? [LOCKED - ' + p.difficulty + ']'}`;
      });
      return {
        success: true,
        message: `=== THE 10 SEALS OF NEXUS ===\n${lines.join('\n')}`
      };
    }

    if (lower === 'key') {
      const runesCollected = ENIGMA_37_PARTS.map(p => solvedParts[p.id] ? p.rune : '·').join(' ');
      return {
        success: true,
        message: `RUNIC KEY FRAGMENTS:\n[ ${runesCollected} ]\nMaster Key: ${isCompleted ? masterKey : 'LOCKED - ' + (TOTAL_ENIGMA_PARTS - unlockedCount) + ' fragments missing'}`
      };
    }

    if (lower === 'vault') {
      setActiveTab('vault');
      return {
        success: true,
        message: isCompleted
          ? 'VAULT ACCESS GRANTED. Welcome to the Apex Sanctum.'
          : `VAULT ACCESS DENIED. ${TOTAL_ENIGMA_PARTS - unlockedCount} seals still bind the gateway.`
      };
    }

    if (lower === 'reset') {
      resetProgress();
      return {
        success: true,
        message: 'SEAL MEMORY WIPED. All 10 seals have returned to their locked states.'
      };
    }

    if (lower.startsWith('decree ') && isOwner) {
      const newDecree = input.slice(7).trim();
      setCreatorDecree(newDecree);
      return {
        success: true,
        message: `CREATOR DECREE UPDATED: "${newDecree}"`
      };
    }

    if (lower.startsWith('clue ')) {
      const num = parseInt(lower.replace('clue ', '').trim(), 10);
      const part = ENIGMA_37_PARTS.find(p => p.id === num);
      if (!part) return { success: false, message: 'Invalid seal number (1 - 10).' };
      return {
        success: true,
        message: `SEAL #${part.id} [${part.rune}]: ${part.riddle}`
      };
    }

    if (lower.startsWith('hint')) {
      return {
        success: false,
        message: 'ACCESS DENIED: Hints are forbidden. The 10 Seals yield only to intellect and perseverance.'
      };
    }

    // Direct answer check or 'solve <text>'
    let targetAttempt = input;
    if (lower.startsWith('solve ')) {
      targetAttempt = input.slice(6).trim();
    }

    const cleanedAttempt = targetAttempt.toLowerCase().replace(/['"_-]/g, ' ').replace(/\s+/g, ' ').trim();

    // Check each part
    for (const part of ENIGMA_37_PARTS) {
      if (solvedParts[part.id]) continue; // already solved

      const match = part.solutionKeywords.some(kw => {
        const cleanedKw = kw.toLowerCase().replace(/['"_-]/g, ' ').replace(/\s+/g, ' ').trim();
        return cleanedAttempt === cleanedKw || targetAttempt === kw || lower === kw.toLowerCase();
      });

      if (match) {
        solvePart(part.id, 'terminal_solve');
        return {
          success: true,
          message: `INCANTATION ACCEPTED! Seal #${part.id} (${part.title} [${part.rune}]) has been SHATTERED!`,
          partId: part.id
        };
      }
    }

    return {
      success: false,
      message: `Unknown command or incorrect incantation for "${input}". Type 'help' or 'clue <1-37>' for guidance.`
    };
  }, [unlockedCount, isCompleted, solvedParts, masterKey, resetProgress, isOwner, setCreatorDecree, solvePart]);

  // Global action dispatcher listener
  useEffect(() => {
    const handleGlobalTrigger = (e: Event) => {
      const custom = e as CustomEvent<{ partId: number; method?: 'live_action' | 'terminal_solve' }>;
      if (custom.detail && typeof custom.detail.partId === 'number') {
        solvePart(custom.detail.partId, custom.detail.method || 'live_action');
      }
    };

    window.addEventListener('nexus_easter_egg_trigger', handleGlobalTrigger);
    return () => window.removeEventListener('nexus_easter_egg_trigger', handleGlobalTrigger);
  }, [solvePart]);

  // Window global method: window.nexus37()
  useEffect(() => {
    (window as any).nexus37 = () => {
      solvePart(14, 'terminal_solve');
      openCodex('terminal');
      console.log(
        '%c[PROJECT 37] PROTOCOL INITIALIZED. Seal #14 Shattered. Terminal open.%c',
        'background: #111; color: #10b981; font-weight: bold; font-size: 14px; padding: 4px 8px;',
        ''
      );
      return 'PROTOCOL_37_INIT: Seal #14 Unlocked. Codex invoked.';
    };

    // Console Easter Egg Banner
    try {
      console.log(
        '%c§ 10 SEALS OF NEXUS §%c\nTen ancient enigmas bind this domain. No hints are given.\nPress `~` to invoke the Enigma Terminal.',
        'color: #f59e0b; font-size: 16px; font-weight: bold;',
        'color: #94a3b8; font-size: 12px;'
      );
    } catch {}

    return () => {
      try {
        delete (window as any).nexus37;
      } catch {}
    };
  }, [solvePart, openCodex]);

  // Keystroke Sequence Listeners (genesis, Konami, etc.)
  useEffect(() => {
    let keyBuffer = '';
    const konamiSequence = [
      'arrowup', 'arrowup', 'arrowdown', 'arrowdown',
      'arrowleft', 'arrowright', 'arrowleft', 'arrowright',
      'b', 'a'
    ];
    let konamiIndex = 0;

    const compassSequence = [
      'arrowup', 'arrowright', 'arrowdown', 'arrowleft', 'enter'
    ];
    let compassIndex = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

      // Quick toggle Codex on backtick (~)
      if (e.key === '`' && !isInput) {
        e.preventDefault();
        toggleCodex();
        return;
      }

      // Part 7: 'T' key when current seconds == 10 or 37
      if ((e.key === 't' || e.key === 'T') && !isInput) {
        const secs = new Date().getSeconds();
        if (secs === 10 || secs === 37) {
          solvePart(7, 'live_action');
        }
      }

      // Konami code check
      const lowerKey = e.key.toLowerCase();
      if (lowerKey === konamiSequence[konamiIndex]) {
        konamiIndex++;
        if (konamiIndex === konamiSequence.length) {
          solvePart(6, 'live_action');
          konamiIndex = 0;
        }
      } else {
        konamiIndex = lowerKey === konamiSequence[0] ? 1 : 0;
      }

      // Compass check (Up -> Right -> Down -> Left -> Enter)
      if (lowerKey === compassSequence[compassIndex]) {
        compassIndex++;
        if (compassIndex === compassSequence.length) {
          solvePart(20, 'live_action');
          compassIndex = 0;
        }
      } else {
        compassIndex = lowerKey === compassSequence[0] ? 1 : 0;
      }

      // Keystroke string buffer for genesis, 133737, matrix37, 37
      if (!isInput && e.key.length === 1) {
        keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-20);

        if (keyBuffer.endsWith('genesis')) {
          solvePart(1, 'live_action');
        }
        if (keyBuffer.endsWith('133737')) {
          solvePart(21, 'live_action');
        }
        if (keyBuffer.endsWith('matrix37')) {
          solvePart(27, 'live_action');
        }
        if (keyBuffer.endsWith('37') && !isCodexOpen) {
          // Subtle hint: typing 37 opens the Codex!
          openCodex();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [solvePart, toggleCodex, openCodex, isCodexOpen]);

  // Coordinate check for Part 25: (37, 37) hover for 2 seconds
  useEffect(() => {
    let hoverTimeout: any = null;

    const handleMouseMove = (e: MouseEvent) => {
      const nearX = Math.abs(e.clientX - 37) <= 15;
      const nearY = Math.abs(e.clientY - 37) <= 15;

      if (nearX && nearY) {
        if (!hoverTimeout) {
          hoverTimeout = setTimeout(() => {
            solvePart(25, 'live_action');
          }, 2000);
        }
      } else {
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hoverTimeout) clearTimeout(hoverTimeout);
    };
  }, [solvePart]);

  // Auto-dismiss notification after 6 seconds
  useEffect(() => {
    if (latestNotification) {
      const t = setTimeout(() => {
        setLatestNotification(null);
      }, 6000);
      return () => clearTimeout(t);
    }
  }, [latestNotification]);

  return (
    <EasterEggContext.Provider
      value={{
        solvedParts,
        unlockedCount,
        isCompleted,
        isCodexOpen,
        activeTab,
        setActiveTab,
        openCodex,
        closeCodex,
        toggleCodex,
        solvePart,
        checkTerminalInput,
        resetProgress,
        auraActive,
        toggleAura,
        masterKey,
        creatorDecree,
        setCreatorDecree,
        latestNotification,
        clearNotification
      }}
    >
      {children}
    </EasterEggContext.Provider>
  );
};

export const useEasterEgg = () => {
  const context = useContext(EasterEggContext);
  if (!context) {
    throw new Error('useEasterEgg must be used within an EasterEggProvider');
  }
  return context;
};
