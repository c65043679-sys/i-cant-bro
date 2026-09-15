import { RecentlyPlayedItem } from '../types';

export const RECENTLY_PLAYED_KEY = 'nexus_recently_played';
export const RECENTLY_PLAYED_EVENT = 'nexus_recently_played_updated';

// Default initial games to showcase Quick Resume if the player hasn't played any games yet
const DEFAULT_INITIAL_GAMES: string[] = ['ragdoll-hit', '1v1-lol', 'slope'];

export function getRecentlyPlayed(): RecentlyPlayedItem[] {
  try {
    const raw = localStorage.getItem(RECENTLY_PLAYED_KEY);
    if (!raw) {
      // First-time seed with realistic timestamps
      const now = Date.now();
      const initial: RecentlyPlayedItem[] = [
        { id: DEFAULT_INITIAL_GAMES[0], playedAt: now - 1000 * 60 * 12 }, // 12 mins ago
        { id: DEFAULT_INITIAL_GAMES[1], playedAt: now - 1000 * 60 * 65 }, // 1 hr ago
        { id: DEFAULT_INITIAL_GAMES[2], playedAt: now - 1000 * 60 * 60 * 4 } // 4 hrs ago
      ];
      localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(item => item && typeof item.id === 'string' && typeof item.playedAt === 'number');
    }
  } catch (err) {
    console.warn('Failed reading recently played games from storage:', err);
  }
  return [];
}

export function recordRecentlyPlayed(gameId: string): void {
  if (!gameId) return;
  try {
    const existing = getRecentlyPlayed();
    // Filter out previous entry for this game
    const filtered = existing.filter(item => item.id !== gameId);
    // Insert at front with current timestamp
    const updated: RecentlyPlayedItem[] = [
      { id: gameId, playedAt: Date.now() },
      ...filtered
    ].slice(0, 10); // Keep up to 10 in storage

    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(RECENTLY_PLAYED_EVENT));
  } catch (err) {
    console.warn('Failed recording recently played game:', err);
  }
}

export function removeRecentlyPlayed(gameId: string): void {
  try {
    const existing = getRecentlyPlayed();
    const updated = existing.filter(item => item.id !== gameId);
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(RECENTLY_PLAYED_EVENT));
  } catch (err) {
    console.warn('Failed removing recently played game:', err);
  }
}

export function clearRecentlyPlayed(): void {
  try {
    localStorage.setItem(RECENTLY_PLAYED_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(RECENTLY_PLAYED_EVENT));
  } catch (err) {
    console.warn('Failed clearing recently played games:', err);
  }
}

export function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return 'Recently';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
