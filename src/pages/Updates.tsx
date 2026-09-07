import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar, Tag, ShieldAlert, Sliders, Play, Image, Sparkles } from 'lucide-react';
import { useAchievements } from '../components/AchievementsContext';

interface UpdateItem {
  version: string;
  date: string;
  title: string;
  description: string;
  type: 'addition' | 'moderation' | 'routing' | 'asset' | 'system';
  changes: string[];
}

const UPDATES: UpdateItem[] = [
  {
    version: "v3.1.0",
    date: "June 10, 2026",
    title: "Global Custom Themes & QoL Suite",
    description: "Launched the complete web application color customization, performance mode engine, and panic mode emergency cloaking system.",
    type: "system",
    changes: [
      "Added 8 visual color theme presets (Nexus Purple, Cyber Neon Cyan, Emerald Matrix, Solar Amber, Ruby Red, Sunset Pink, Deep Ocean, Obsidian Monochrome) plus a custom hex hue picker.",
      "Synchronized all site UI components (Navbar, Sidebar, Logo badge, Game cards, Highlights, Buttons) to react dynamically to color theme changes.",
      "Integrated Quality of Life controls including Panic Mode tab cloaking (Google Classroom disguise with shortcut key trigger), real-time FPS counter overlay, sound effects engine, compact grid layout, and low-GPU performance toggles."
    ]
  },
  {
    version: "v3.0.0",
    date: "June 10, 2026",
    title: "Classic Retro & Nostalgia Mega-Drop",
    description: "Successfully added 13 legendary console retro adaptations, life simulators, and flash puzzle titles.",
    type: "addition",
    changes: [
      "Integrated Animal Crossing: Wild World, Pokémon Emerald, The Binding of Isaac, Douchebag Life, Douchebag Workout 2, Duck Life 2, Phoenix Wright: Ace Attorney, Super Mario 64, Superhot, Portal: The Flash Version, Five Nights at Freddy's 4, Pokémon Red, and Bloons TD 5.",
      "Mapped beautiful, curated game card artwork thumbnails and colorful accent styling for each masterpiece console and web title.",
      "Configured detailed custom controller instructions and secure, sandboxed emulator settings for zero-interference input handling."
    ]
  },
  {
    version: "v2.9.0",
    date: "June 10, 2026",
    title: "Massive Arcade & Puzzle Expansion",
    description: "Added 8 highly requested blockbusters to our premium gaming collection, spanning Arcade, Puzzle, Action, and more.",
    type: "addition",
    changes: [
      "Integrated Life - The Game, There Is No Game, Henry Stickmin: Breaking the Bank, Vex 7, Jetpack Joyride, Duck Life, Snake.io, and Crossy Road.",
      "Mapped the custom uploaded thumbnails for Life - The Game (/images/life-the-game-logo.png), There Is No Game (/images/there-is-no-game-logo.jpg), Henry Stickmin (/images/Henry_looking_at_a_bank.webp), Vex 7 (/images/vex7.jpg), Jetpack Joyride (/images/jetpack-joyride-review-header.webp), Duck Life (/images/duck life (2).jpg), Snake.io (/images/snake.io.png), and Crossy Road (/images/CrossyRoad_Banner.webp) to provide high-fidelity tailored graphics.",
      "Optimized sandbox parameters and iframe controls for seamless embedded browser execution without interference."
    ]
  },
  {
    version: "v2.8.0",
    date: "June 10, 2026",
    title: "Scooby-Doo Scary Run Integration",
    description: "Successfully added the nostalgic, eerie cartoon endless runner 'Scooby-Doo Scary Run' to the Horror catalog.",
    type: "addition",
    changes: [
      "Integrated Scooby-Doo Scary Run (https://scoobydoocreepyrun.com/embed/scooby-doo-creepy-run) under the Horror category.",
      "Mapped the custom uploaded cartoon illustration thumbnail (/images/scoobydooscaryrun.jpg).",
      "Explicitly alerted users inside the system description to turn the volume all the way up for the most spooky and authentic audio experience."
    ]
  },
  {
    version: "v2.7.0",
    date: "June 9, 2026",
    title: "BitLife Life Simulator Integration",
    description: "Added the widely beloved virtual text-based life simulator 'BitLife' to the platform.",
    type: "addition",
    changes: [
      "Acquired and deployed BitLife (https://theunblock3dlabs.github.io/sourced/play/bitlife/) under the Arcade category.",
      "Mapped the custom uploaded thumbnail (/images/images.png) for high-performance visual catalog delivery.",
      "Configured robust fullscreen capabilities and safe sandboxed iframe settings."
    ]
  },
  {
    version: "v2.6.0",
    date: "May 28, 2026",
    title: "Soccer Random Integration",
    description: "Added the highly anticipated physics-based chaos sports game 'Soccer Random' to the system catalog.",
    type: "addition",
    changes: [
      "Acquired and deployed Soccer Random (https://soccer-randomx.github.io/soccer-random/) under the Sports category.",
      "Configured robust fullscreen capabilities and interactive sandbox iframe permissions.",
      "Mapped and optimized the new official custom thumbnail path (/images/soccer-random.jpg)."
    ]
  },
  {
    version: "v2.5.0",
    date: "May 28, 2026",
    title: "Dynamic Update Log & System History",
    description: "Launched the immersive Cyberpunk-themed system changelog to track development cycles, database operations, and user updates.",
    type: "system",
    changes: [
      "Designed and integrated a fluid, motion-accelerated timeline interface on /updates.",
      "Added side-panel quick stats compiling the total update counts by category.",
      "Integrated a dedicated changelog access shortcut into the lower sector of the sidebar."
    ]
  },
  {
    version: "v2.4.0",
    date: "May 28, 2026",
    title: "Retro Bowl Landing & Asset Sync",
    description: "Added the legendary classic browser sports action game 'Retro Bowl' along with high-res game media synchronization.",
    type: "addition",
    changes: [
      "Acquired and deployed Retro Bowl (https://falloutscript.github.io/Retrobowl/) under the Sports category.",
      "Configured secure iframes, fullscreen parameters, and autoplay sandbox configs.",
      "Created and mapped the official retro football thumbnail (/images/RETROBOWL.jpg)."
    ]
  },
  {
    version: "v2.3.0",
    date: "May 22, 2026",
    title: "Blocked Sector Reclassifications",
    description: "Strengthened platform filter logic and moved various games to the classified 'Blocked Sector' per content policy standards.",
    type: "moderation",
    changes: [
      "Transferred Five Nights at Freddy's (FNaF 1) to the restricted Blocked Sector.",
      "Transferred Scary Teacher 3D to the restricted Blocked Sector.",
      "Transferred Scary Grandma 3D (Granny) to the restricted Blocked Sector.",
      "Transferred Escape Waves to the restricted Blocked Sector.",
      "Transferred Head Soccer 2026 to the restricted Blocked Sector."
    ]
  },
  {
    version: "v2.2.0",
    date: "May 21, 2026",
    title: "Critical Frame Hijacking & Navigation Resolvers",
    description: "Engineered robust router-level state tracking intercepts on Navbar search strings and Sidebar navigation clicks.",
    type: "routing",
    changes: [
      "Fixed infinite frame isolation loops. Sidebar section matches now instantly break out of active active play states and route safely back to Home.",
      "Integrated input state listeners on Navbar search fields ensuring seamless home redirects whenever search inputs are typed."
    ]
  },
  {
    version: "v2.1.0",
    date: "May 21, 2026",
    title: "Cupcakes Overhaul & Asset Expansion",
    description: "Optimized puzzle visual designs and resolved broken/empty image placeholders with high-fidelity asset replacements.",
    type: "asset",
    changes: [
      "Swapped the 2048 Cupcakes thumbnail to an enhanced resolution file: 2048cupcakes (1).jpg.",
      "Deployed beautiful, crisp thumbnails for Friday Night Funkin' (/images/friday night funkin.jpg).",
      "Mapped a dedicated pixel-perfect thumbnail for Tiny Fishing (/images/tinyfishing.jpg).",
      "Configured game categories and controls instructions for a superior gameplay experience."
    ]
  },
  {
    version: "v1.0.0",
    date: "April 15, 2026",
    title: "Initial Launch of Nexus Portal",
    description: "Broke ground on the clean, full-scale gaming aggregation dashboard, incorporating user custom profiles, dynamic favorites, and iframe sandboxes.",
    type: "system",
    changes: [
      "Launched responsive high-contrast slate dashboard with background mesh visualizer glows.",
      "Integrated secure Google OAuth Authentication and real-time backend state synchronization.",
      "Built game launcher engines supporting seamless custom overlays, aspect ratio toggles, and user instructions."
    ]
  }
];

export const Updates: React.FC = () => {
  const { unlockAchievement } = useAchievements();

  useEffect(() => {
    try { unlockAchievement('updates_scholar'); } catch (e) {}
  }, []);

  const getBadgeStyle = (type: UpdateItem['type']) => {
    switch (type) {
      case 'addition':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'moderation':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'routing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'asset':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/20';
      case 'system':
      default:
        return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
    }
  };

  const getBadgeIcon = (type: UpdateItem['type']) => {
    switch (type) {
      case 'addition':
        return <Play className="w-3.5 h-3.5" />;
      case 'moderation':
        return <ShieldAlert className="w-3.5 h-3.5" />;
      case 'routing':
        return <Sliders className="w-3.5 h-3.5" />;
      case 'asset':
        return <Image className="w-3.5 h-3.5" />;
      case 'system':
      default:
        return <Sparkles className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div id="updates_page_container" className="flex-1 p-8 overflow-x-hidden max-w-4xl mx-auto space-y-12">
      <section className="text-left space-y-4">
        <div className="flex items-center gap-2 text-violet-400 text-sm font-semibold uppercase tracking-wider">
          <Calendar className="w-4 h-4" />
          <span>Central System Logs</span>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          System Updates
        </h1>
        <p className="text-slate-400 text-base max-w-2xl leading-relaxed">
          Welcome to the Nexus control room. Here you can review active development cycles, major content reclassifications, media asset synchronizations, and system optimization audits.
        </p>
      </section>

      {/* Stats Summary Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="text-center p-3">
          <p className="text-2xl font-black text-violet-400">{UPDATES[0]?.version || 'v2.6.0'}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">Current Protocol</p>
        </div>
        <div className="text-center p-3 border-l border-white/10">
          <p className="text-2xl font-black text-white">{UPDATES.length}</p>
          <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">Log Entries</p>
        </div>
        <div className="text-center p-3 border-l border-white/10">
          <p className="text-2xl font-black text-emerald-400">
            {UPDATES.filter(u => u.type === 'addition').length}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">New Games</p>
        </div>
        <div className="text-center p-3 border-l border-white/10">
          <p className="text-2xl font-black text-amber-400">
            {UPDATES.filter(u => u.type === 'moderation').length}
          </p>
          <p className="text-xs text-slate-500 mt-1 uppercase font-semibold">Blocked Updates</p>
        </div>
      </div>

      {/* Vertical Timeline */}
      <div className="relative border-l border-white/10 ml-4 pl-8 space-y-12 py-4">
        {UPDATES.map((update, index) => (
          <motion.div
            key={update.version}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="relative"
          >
            {/* Pulsing state indicator dot */}
            <div className="absolute -left-[41px] top-1.5 w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border-2 border-white/10">
              <span className={`w-2.5 h-2.5 rounded-full ${
                update.type === 'addition' ? 'bg-emerald-500' :
                update.type === 'moderation' ? 'bg-amber-500' :
                update.type === 'routing' ? 'bg-blue-500' :
                update.type === 'asset' ? 'bg-pink-500' : 'bg-violet-500'
              }`} />
            </div>

            {/* Content card */}
            <div className="p-6 bg-slate-900/40 rounded-2xl border border-white/10 backdrop-blur-md space-y-4 hover:border-white/25 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white/10 text-white border border-white/10">
                    {update.version}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {update.date}
                  </span>
                </div>

                <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 w-fit ${getBadgeStyle(update.type)}`}>
                  {getBadgeIcon(update.type)}
                  <span className="uppercase tracking-wider">{update.type}</span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{update.title}</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{update.description}</p>
              </div>

              {update.changes && update.changes.length > 0 && (
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Sector Operations:</p>
                  <ul className="space-y-2">
                    {update.changes.map((change, cIdx) => (
                      <li key={cIdx} className="flex gap-2 text-slate-300 text-sm leading-relaxed">
                        <span className="text-violet-500 mt-1 select-none">▪</span>
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
