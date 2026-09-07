import { Game } from '../types';
import { GAMES } from '../data/gamesData';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

let cachedInjectedGames: Game[] = (() => {
  try {
    const saved = localStorage.getItem('nexus_injected_games');
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
})();

// Subscribe to Firestore for real-time custom injected games across all visitors
try {
  onSnapshot(collection(db, 'injected_games'), (snapshot) => {
    const firestoreGames: Game[] = [];
    snapshot.forEach((doc) => {
      firestoreGames.push(doc.data() as Game);
    });
    cachedInjectedGames = firestoreGames;
    localStorage.setItem('nexus_injected_games', JSON.stringify(firestoreGames));
    window.dispatchEvent(new Event('nexus_games_updated'));
  }, (error) => {
    console.warn('Firestore injected_games subscription error:', error);
  });
} catch (e) {
  console.error('Failed to setup injected_games listener:', e);
}

export function getAllGames(): Game[] {
  return [...cachedInjectedGames, ...GAMES];
}
