import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Terminal,
  KeyRound,
  Shield,
  Sparkles,
  HelpCircle,
  CheckCircle2,
  Lock,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
  RotateCcw,
  Copy,
  Check,
  Send,
  Eye,
  Crown,
  Search,
  Filter
} from 'lucide-react';
import { useEasterEgg } from '../context/EasterEggContext';
import { ENIGMA_37_PARTS, EnigmaPart, TOTAL_ENIGMA_PARTS } from '../data/easterEgg37Data';
import { soundManager } from '../utils/soundEffects';
import { useAuth } from './AuthContext';

export const EasterEggCodexModal: React.FC = () => {
  const {
    isCodexOpen,
    closeCodex,
    solvedParts,
    unlockedCount,
    isCompleted,
    activeTab,
    setActiveTab,
    checkTerminalInput,
    resetProgress,
    auraActive,
    toggleAura,
    masterKey,
    creatorDecree,
    setCreatorDecree
  } = useEasterEgg();

  const { isOwner } = useAuth();

  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unsealed' | 'locked'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Terminal state
  const [terminalHistory, setTerminalHistory] = useState<Array<{ text: string; type: 'input' | 'output' | 'error' | 'success' }>>([
    { text: '==================================================', type: 'output' },
    { text: '   PROTOCOL 10: THE TEN SEALS OF NEXUS            ', type: 'output' },
    { text: '   Ten cryptic locks bind this realm. No hints.   ', type: 'output' },
    { text: '==================================================', type: 'output' },
    { text: "Type 'help' for commands, or type incantations directly.", type: 'output' }
  ]);
  const [terminalInput, setTerminalInput] = useState('');
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const terminalBottomRef = useRef<HTMLDivElement | null>(null);

  // Creator workbench
  const [isEditingDecree, setIsEditingDecree] = useState(false);
  const [tempDecree, setTempDecree] = useState(creatorDecree);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (activeTab === 'terminal') {
      terminalBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalHistory, activeTab]);

  if (!isCodexOpen) return null;

  const handleTerminalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const command = terminalInput.trim();
    if (!command) return;

    soundManager.playEnigmaTerminalKeystroke(true);

    const newHistory = [...terminalHistory, { text: `> ${command}`, type: 'input' as const }];

    if (command.toLowerCase() === 'clear') {
      setTerminalHistory([
        { text: 'PROTOCOL 10 TERMINAL CLEARED. Type "help" for guidance.', type: 'output' }
      ]);
      setTerminalInput('');
      return;
    }

    const result = checkTerminalInput(command);

    if (result.success) {
      newHistory.push({
        text: result.message,
        type: 'success'
      });
    } else {
      newHistory.push({
        text: result.message,
        type: 'error'
      });
    }

    setCommandHistory(prev => [...prev, command]);
    setHistoryIndex(-1);
    setTerminalHistory(newHistory);
    setTerminalInput('');
  };

  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(nextIdx);
        setTerminalInput(commandHistory[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length > 0 && historyIndex !== -1) {
        const nextIdx = historyIndex + 1;
        if (nextIdx >= commandHistory.length) {
          setHistoryIndex(-1);
          setTerminalInput('');
        } else {
          setHistoryIndex(nextIdx);
          setTerminalInput(commandHistory[nextIdx]);
        }
      }
    }
  };

  const filteredParts = ENIGMA_37_PARTS.filter(p => {
    const isSolved = !!solvedParts[p.id];
    if (filterStatus === 'unsealed' && !isSolved) return false;
    if (filterStatus === 'locked' && isSolved) return false;
    if (filterDifficulty !== 'all' && p.difficulty.toLowerCase() !== filterDifficulty.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRiddle = p.riddle.toLowerCase().includes(q);
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchRune = p.rune.includes(q);
      const matchId = p.id.toString() === q;
      if (!matchRiddle && !matchTitle && !matchRune && !matchId) return false;
    }
    return true;
  });

  const handleCopyKey = () => {
    navigator.clipboard.writeText(masterKey);
    setCopiedKey(true);
    soundManager.playClick(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSaveDecree = () => {
    setCreatorDecree(tempDecree);
    setIsEditingDecree(false);
    soundManager.playClick(true);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Hard':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'Cryptic':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'Nightmare':
        return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'Master':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default:
        return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-slate-950/95 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-950/30 flex flex-col overflow-hidden font-sans">
        {/* Glow corner accents */}
        {auraActive && (
          <>
            <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          </>
        )}

        {/* Modal Header */}
        <div className="relative z-10 px-5 py-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-mono text-lg font-black shadow-inner">
              10
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                  The 10 Seals of Nexus
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-widest">
                  Cryptic ARG
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ten ancient seals buried deep in the platform. Zero hints given — pure deduction.
              </p>
            </div>
          </div>

          {/* Progress Pill, Glow Toggle & Close Button */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => toggleAura()}
              className={`px-2.5 py-1.5 text-[11px] font-mono font-bold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                auraActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-slate-800'
              }`}
              title={auraActive ? 'Turn off golden corner glow' : 'Turn on golden corner glow'}
            >
              <Sparkles className={`w-3.5 h-3.5 ${auraActive ? 'text-amber-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Corner Glow:</span>
              <span className={auraActive ? 'text-amber-300' : 'text-slate-400'}>{auraActive ? 'ON' : 'OFF'}</span>
            </button>

            <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-amber-300">
                {unlockedCount} / {TOTAL_ENIGMA_PARTS} Shattered
              </span>
              <div className="w-16 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${(unlockedCount / TOTAL_ENIGMA_PARTS) * 100}%` }}
                />
              </div>
            </div>

            <button
              onClick={closeCodex}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Close Codex (~)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="relative z-10 px-5 pt-3 border-b border-white/5 flex gap-2 bg-slate-900/30">
          <button
            onClick={() => {
              setActiveTab('seals');
              soundManager.playClick(true);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'seals'
                ? 'bg-slate-950 text-amber-300 border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            The 10 Seals ({unlockedCount}/{TOTAL_ENIGMA_PARTS})
          </button>

          <button
            onClick={() => {
              setActiveTab('terminal');
              soundManager.playClick(true);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'terminal'
                ? 'bg-slate-950 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            Enigma Terminal
          </button>

          <button
            onClick={() => {
              setActiveTab('vault');
              soundManager.playClick(true);
            }}
            className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'vault'
                ? 'bg-slate-950 text-purple-300 border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-white/5'
            } ${isCompleted ? 'relative' : ''}`}
          >
            <Crown className="w-4 h-4 text-purple-400" />
            The Grand Vault (10/10)
            {isCompleted && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping absolute top-2 right-2" />
            )}
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar relative z-10">
          {/* TAB 1: THE 37 SEALS LIST */}
          {activeTab === 'seals' && (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-white/5">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search seal riddles, numbers, or runes..."
                    className="w-full pl-9 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    {(['all', 'unsealed', 'locked'] as const).map(status => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-bold capitalize transition-colors ${
                          filterStatus === status
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  <select
                    value={filterDifficulty}
                    onChange={e => setFilterDifficulty(e.target.value)}
                    className="bg-black/40 border border-white/10 text-slate-300 text-[11px] font-bold rounded-lg px-2.5 py-1.5 focus:outline-none"
                  >
                    <option value="all">All Difficulties</option>
                    <option value="hard">Hard</option>
                    <option value="cryptic">Cryptic</option>
                    <option value="nightmare">Nightmare</option>
                    <option value="master">Master</option>
                  </select>
                </div>
              </div>

              {/* Runic Grid Summary Preview */}
              <div className="bg-slate-900/40 p-3 rounded-xl border border-white/5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>RUNE MATRIX CIPHER:</span>
                  <span>{unlockedCount} / {TOTAL_ENIGMA_PARTS} ACQUIRED</span>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {ENIGMA_37_PARTS.map(p => {
                    const isSolved = !!solvedParts[p.id];
                    return (
                      <div
                        key={p.id}
                        title={`#${p.id} ${isSolved ? p.title : 'Locked'}`}
                        className={`w-7 h-7 rounded flex items-center justify-center font-mono text-sm transition-all ${
                          isSolved
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-sm shadow-amber-500/20 font-bold scale-105'
                            : 'bg-black/40 text-slate-600 border border-white/5'
                        }`}
                      >
                        {p.rune}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Seals Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredParts.map(part => {
                  const isSolved = !!solvedParts[part.id];

                  return (
                    <div
                      key={part.id}
                      className={`relative rounded-xl border p-4 transition-all ${
                        isSolved
                          ? 'bg-slate-900/70 border-amber-500/40 shadow-lg shadow-amber-950/20'
                          : 'bg-slate-950/60 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center font-mono text-xl ${
                              isSolved
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-inner'
                                : 'bg-black/60 text-slate-600 border border-white/10'
                            }`}
                          >
                            {part.rune}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-slate-500 font-bold">
                                #{part.id.toString().padStart(2, '0')}
                              </span>
                              <h3
                                className={`text-sm font-bold ${
                                  isSolved ? 'text-amber-300' : 'text-slate-200'
                                }`}
                              >
                                {isSolved ? part.title : `Seal #${part.id}`}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold uppercase ${getDifficultyColor(
                                  part.difficulty
                                )}`}
                              >
                                {part.difficulty}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {part.category}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Status Icon */}
                        <div>
                          {isSolved ? (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" /> Shattered
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-black/40 border border-white/5 px-2 py-0.5 rounded-full">
                              <Lock className="w-3 h-3" /> Sealed
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cryptic Riddle */}
                      <p className="text-xs text-slate-300 leading-relaxed italic border-l-2 border-amber-500/30 pl-2.5 my-2.5 bg-black/20 py-1 rounded-r">
                        "{part.riddle}"
                      </p>

                      {/* Card Footer: No Hints - Enter Incantation */}
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-500 font-mono italic">
                          No hints provided • Pure deduction
                        </span>

                        <button
                          onClick={() => {
                            setActiveTab('terminal');
                            setTerminalInput(`solve `);
                            soundManager.playClick(true);
                          }}
                          className="text-[11px] text-emerald-400/80 hover:text-emerald-300 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                        >
                          <Terminal className="w-3 h-3" /> Enter Incantation
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredParts.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-xs">
                  No seals match your query. Clear filters to reveal all 10 ancient trials.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: THE ENIGMA TERMINAL */}
          {activeTab === 'terminal' && (
            <div className="h-full flex flex-col bg-black/90 rounded-xl border border-emerald-500/30 p-4 font-mono shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2 mb-3 text-xs text-emerald-400/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-bold">NEXUS-37 PROTOCOL SHELL v3.7.0</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={() => {
                      setTerminalInput('help');
                      handleTerminalSubmit();
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"
                  >
                    help
                  </button>
                  <button
                    onClick={() => {
                      setTerminalInput('status');
                      handleTerminalSubmit();
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"
                  >
                    status
                  </button>
                  <button
                    onClick={() => {
                      setTerminalInput('key');
                      handleTerminalSubmit();
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"
                  >
                    key
                  </button>
                  <button
                    onClick={() => {
                      setTerminalHistory([{ text: 'Console cleared.', type: 'output' }]);
                    }}
                    className="px-2 py-0.5 rounded bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-300 border border-emerald-500/30"
                  >
                    clear
                  </button>
                </div>
              </div>

              {/* Terminal Logs Output */}
              <div className="flex-1 overflow-y-auto space-y-1.5 text-xs custom-scrollbar pr-2 min-h-[300px]">
                {terminalHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className={`whitespace-pre-wrap leading-relaxed ${
                      item.type === 'input'
                        ? 'text-amber-400 font-bold'
                        : item.type === 'success'
                        ? 'text-emerald-300 font-bold bg-emerald-950/30 p-2 rounded border border-emerald-500/30 my-1'
                        : item.type === 'error'
                        ? 'text-red-400 bg-red-950/20 p-1.5 rounded border border-red-500/20'
                        : 'text-emerald-400/90'
                    }`}
                  >
                    {item.text}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>

              {/* Terminal Prompt Input Bar */}
              <form onSubmit={handleTerminalSubmit} className="mt-3 pt-2 border-t border-emerald-500/20 flex gap-2">
                <span className="text-emerald-400 font-bold select-none">&gt;</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={e => setTerminalInput(e.target.value)}
                  onKeyDown={handleTerminalKeyDown}
                  placeholder="Enter command, clue #, or incantation (e.g. solve genesis)..."
                  className="flex-1 bg-transparent text-emerald-200 placeholder-emerald-700/60 focus:outline-none text-xs font-mono"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1 bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 rounded border border-emerald-500/40 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Enter
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: THE GRAND VAULT (37/37) */}
          {activeTab === 'vault' && (
            <div className="space-y-6 max-w-3xl mx-auto py-2">
              {/* Grand Chamber Header */}
              <div className="text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-950/40">
                  <Crown className="w-8 h-8 animate-pulse text-amber-300" />
                </div>
                <h2 className="text-2xl font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-orange-300 to-amber-400 bg-clip-text text-transparent">
                  The Apex Vault of Protocol 37
                </h2>
                <p className="text-xs text-slate-400 max-w-lg mx-auto">
                  The eternal chamber behind thirty-seven broken locks. Sealed until the full cosmic cipher aligns.
                </p>
              </div>

              {/* Status Banner */}
              {!isCompleted ? (
                <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-6 text-center space-y-4 shadow-xl">
                  <div className="flex items-center justify-center gap-2 text-amber-400 font-mono text-sm font-bold">
                    <Lock className="w-4 h-4" />
                    CHAMBER STATUS: SEALED ({unlockedCount} / {TOTAL_ENIGMA_PARTS} SEALS SHATTERED)
                  </div>
                  <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                    The heavy obsidian gates require all ten fragments before the Creator's Seal will open.
                    There are still <strong className="text-amber-300">{TOTAL_ENIGMA_PARTS - unlockedCount}</strong> seals
                    remaining.
                  </p>

                  <div className="w-full bg-slate-950 h-3 rounded-full border border-white/10 overflow-hidden max-w-md mx-auto">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-500"
                      style={{ width: `${(unlockedCount / TOTAL_ENIGMA_PARTS) * 100}%` }}
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('seals')}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all shadow-sm"
                    >
                      Explore Remaining Seals
                    </button>
                  </div>
                </div>
              ) : (
                /* ALL 10 SOLVED! EPIC VAULT CHAMBER */
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-gradient-to-br from-amber-950/40 via-purple-950/30 to-slate-950 border-2 border-amber-500/60 rounded-2xl p-6 shadow-2xl shadow-amber-950/50 space-y-4">
                    <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs font-black tracking-widest uppercase">
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                      ALL 10 ANCIENT SEALS SHATTERED
                      <Sparkles className="w-4 h-4 animate-spin text-amber-400" />
                    </div>

                    <h3 className="text-center text-xl font-black text-amber-300 tracking-wide">
                      THE GENESIS MASTER ASCENSION
                    </h3>

                    <p className="text-xs text-slate-300 text-center max-w-xl mx-auto leading-relaxed">
                      You have solved the complete 10-part ARG of Nexus. Your cryptographic signature has been
                      minted on the platform's core registry.
                    </p>

                    {/* Master Key Box */}
                    <div className="bg-black/80 border border-amber-500/40 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono">
                      <div>
                        <div className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">
                          Cryptographic Master Key:
                        </div>
                        <div className="text-sm font-bold text-amber-300 tracking-widest">
                          #{masterKey}
                        </div>
                      </div>

                      <button
                        onClick={handleCopyKey}
                        className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedKey ? 'Copied' : 'Copy Key'}
                      </button>
                    </div>

                    {/* Granted Rewards Badges */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center space-y-1">
                        <Crown className="w-5 h-5 mx-auto text-amber-400" />
                        <div className="text-[11px] font-bold text-white">Title Unlocked</div>
                        <div className="text-xs font-mono text-amber-300 font-bold">Protocol 10 Ascendant</div>
                      </div>

                      <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center space-y-1">
                        <Zap className="w-5 h-5 mx-auto text-emerald-400" />
                        <div className="text-[11px] font-bold text-white">Treasury Bounty</div>
                        <div className="text-xs font-mono text-emerald-300 font-bold">+10,000 XP & 1,000 GP</div>
                      </div>

                      <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-center space-y-1">
                        <Sparkles className="w-5 h-5 mx-auto text-purple-400" />
                        <div className="text-[11px] font-bold text-white">Genesis Glitch Aura</div>
                        <button
                          onClick={toggleAura}
                          className={`mt-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all ${
                            auraActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-400 border-white/10'
                          }`}
                        >
                          {auraActive ? 'AURA ACTIVE' : 'AURA OFF'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* CREATOR DECREE VAULT */}
                  <div className="bg-slate-900/70 border border-purple-500/40 rounded-2xl p-5 space-y-3 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="w-4 h-4 text-purple-400" />
                        <h4 className="text-xs font-bold text-purple-300 uppercase tracking-wider font-mono">
                          THE CREATOR'S DECREE CHAMBER
                        </h4>
                      </div>

                      {(isOwner || isCompleted) && (
                        <button
                          onClick={() => {
                            setTempDecree(creatorDecree);
                            setIsEditingDecree(!isEditingDecree);
                          }}
                          className="text-[11px] text-purple-400 hover:text-purple-300 font-mono underline"
                        >
                          {isEditingDecree ? 'Cancel Edit' : 'Edit Decree'}
                        </button>
                      )}
                    </div>

                    {!isEditingDecree ? (
                      <div className="bg-black/60 border border-purple-500/20 rounded-xl p-4 space-y-2">
                        <div className="text-[11px] text-purple-300/90 font-mono font-medium leading-relaxed italic">
                          "{creatorDecree}"
                        </div>
                        <div className="text-[10px] text-slate-400 pt-1 border-t border-white/5 flex items-center justify-between">
                          <span>Status: Awaiting Final Decree from Creator</span>
                          <span className="text-emerald-400 font-bold">Key #NX10-VERIFIED Bound</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={tempDecree}
                          onChange={e => setTempDecree(e.target.value)}
                          rows={3}
                          className="w-full bg-black/60 border border-purple-500/40 rounded-xl p-3 text-xs text-purple-200 focus:outline-none font-mono"
                          placeholder="Type creator reward announcement / decree here..."
                        />
                        <button
                          onClick={handleSaveDecree}
                          className="px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 rounded-lg text-xs font-bold font-mono transition-colors"
                        >
                          Save Decree Proclamation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Reset Danger Zone */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">PROTOCOL 10 RUNTIME</span>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to reset all 10 unlocked seals?')) {
                      resetProgress();
                      soundManager.playClick(true);
                    }
                  }}
                  className="flex items-center gap-1 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset Seal Progress
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
