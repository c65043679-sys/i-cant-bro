import React, { useState, useRef, useEffect } from 'react';
import { Flame, Sparkles, ArrowDownAZ, ChevronDown, Check } from 'lucide-react';

export type SortOption = 'Popularity' | 'Newest' | 'Alphabetical';

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { 
  id: SortOption; 
  label: string; 
  description: string; 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
}[] = [
  {
    id: 'Popularity',
    label: 'Popularity',
    description: 'Trending and top-rated games first',
    icon: Flame,
    color: 'text-amber-400',
  },
  {
    id: 'Newest',
    label: 'Newest',
    description: 'Fresh arrivals and latest additions',
    icon: Sparkles,
    color: 'text-cyan-400',
  },
  {
    id: 'Alphabetical',
    label: 'Alphabetical',
    description: 'Titles organized from A to Z',
    icon: ArrowDownAZ,
    color: 'text-emerald-400',
  },
];

export const SortDropdown: React.FC<SortDropdownProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.id === value) || SORT_OPTIONS[0];
  const IconComponent = selectedOption.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-all shadow-sm active:scale-95 cursor-pointer"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <IconComponent className={`w-3.5 h-3.5 ${selectedOption.color}`} />
        <span>Sort: <strong className="text-white font-bold">{selectedOption.label}</strong></span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-60 z-40 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden py-1.5 divide-y divide-white/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sort Missions By
          </div>
          <div className="py-1">
            {SORT_OPTIONS.map((opt) => {
              const isSelected = opt.id === value;
              const OptIcon = opt.icon;

              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left text-xs transition-colors cursor-pointer group ${
                    isSelected ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                    <OptIcon className={`w-4 h-4 mt-0.5 shrink-0 ${opt.color}`} />
                    <div className="min-w-0">
                      <p className={`font-bold ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                        {opt.label}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
