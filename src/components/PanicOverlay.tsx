import React from 'react';
import { useSettings } from './SettingsContext';
import { RefreshCw, ExternalLink } from 'lucide-react';

export const PanicOverlay: React.FC = () => {
  const { isPanicTriggered, dismissPanic, settings } = useSettings();

  if (!isPanicTriggered) return null;

  const redirectTarget = settings.panicUrl || 'https://students.aloysius.vic.edu.au/#?page=/home';

  return (
    <div className="fixed inset-0 z-[99999] bg-[#f8f9fa] text-[#202124] flex flex-col font-sans select-none overflow-auto">
      {/* Fake Header */}
      <header className="h-16 border-b border-[#dadce0] bg-white flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#1a73e8] text-white flex items-center justify-center font-bold text-sm">
            S
          </div>
          <span className="font-medium text-lg text-[#3c4043]">Student Learning Portal</span>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium text-[#5f6368]">
          <a 
            href={redirectTarget}
            target="_self"
            className="px-3 py-1.5 bg-[#1a73e8] hover:bg-[#1557b0] text-white rounded-md transition-colors flex items-center gap-1.5 font-bold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open Portal
          </a>
          <button 
            onClick={dismissPanic}
            className="px-3 py-1.5 bg-[#e8f0fe] hover:bg-[#d2e3fc] text-[#1a73e8] rounded-md transition-colors flex items-center gap-1.5 font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Resume Session
          </button>
        </div>
      </header>

      {/* Fake Student Dashboard */}
      <div className="flex-1 max-w-5xl mx-auto w-full p-8 space-y-6">
        <div className="bg-[#1a73e8] text-white p-8 rounded-2xl shadow-md">
          <h1 className="text-3xl font-bold mb-2">St Aloysius Student Dashboard</h1>
          <p className="text-blue-100 text-sm">Home • Timetable • Learning Resources</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border border-[#dadce0] p-6 rounded-xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1a73e8] uppercase tracking-wider">Student Portal Link</span>
                <span className="text-xs text-[#5f6368]">Active Direct Portal</span>
              </div>
              <h2 className="text-xl font-bold text-[#202124]">St Aloysius Student Home</h2>
              <p className="text-sm text-[#5f6368] leading-relaxed">
                Click below to navigate directly to your student home page.
              </p>
              <div className="pt-2 flex justify-end">
                <a 
                  href={redirectTarget} 
                  className="px-5 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-md hover:bg-[#1557b0] transition-colors flex items-center gap-2"
                >
                  Go to Student Home
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white border border-[#dadce0] p-5 rounded-xl shadow-sm space-y-2">
              <h3 className="font-bold text-sm text-[#202124]">Notifications</h3>
              <p className="text-xs text-[#5f6368]">All coursework current.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
