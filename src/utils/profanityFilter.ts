// Comprehensive profanity and inappropriate words filter for nicknames

const PROFANITY_LIST = [
  // Common obscenities & slurs
  'fuck', 'fuk', 'fck', 'fuker', 'fucker', 'fucking', 'fuckin',
  'shit', 'sh1t', 'sht', 'bullshit', 'shitting', 'shitter',
  'bitch', 'b1tch', 'btch', 'bitches', 'bitchy',
  'ass', 'asshole', 'a55', 'a55hole', 'assette', 'jackass', 'dumbass',
  'bastard', 'b4stard', 'cunt', 'c1nt', 'cnt',
  'dick', 'd1ck', 'penis', 'p3nis', 'cock', 'c0ck', 'phallus', 'dildo',
  'poop', 'poopy', 'scat', 'crap', 'turd',
  'vagina', 'pussy', 'pu55y', 'clit', 'boob', 'boobs', 'tits', 'titties', 'nipple',
  'nigger', 'nigga', 'n1gger', 'n1gga', 'nigg3r', 'nigg4',
  'fag', 'faggot', 'f4g', 'f4ggot', 'retard', 'r3tard', 'spastic',
  'whore', 'wh0re', 'slut', 'sl1t', 'prostitute',
  'motherfucker', 'motherfuker', 'mf', 'mofo',
  'piss', 'pissed', 'pissing', 'cum', 'ejaculate', 'orgasm', 'masturbate', 'jerkoff',
  'horny', 'porn', 'porno', 'pornography', 'xxx', 'hentai',
  'bitchass', 'douche', 'douchebag', 'twat', 'wanker', 'prick',
  'nazi', 'hitler', 'swastika', 'terrorist', 'jihad', 'kill'
];

/**
 * Normalizes string by mapping leetspeak characters to standard letters
 */
function normalizeLeetspeak(str: string): string {
  return str
    .toLowerCase()
    .replace(/@/g, 'a')
    .replace(/4/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't')
    .replace(/8/g, 'b')
    .replace(/v/g, 'u');
}

/**
 * Checks if a nickname contains any inappropriate or profane words.
 */
export function containsProfanity(text: string): boolean {
  if (!text) return false;

  const rawLower = text.toLowerCase();
  const normalized = normalizeLeetspeak(text);
  
  // Stripped version without punctuation/spaces to catch hidden words like "f.u.c.k" or "f_u_c_k"
  const strippedRaw = rawLower.replace(/[^a-z0-9]/g, '');
  const strippedNormalized = normalized.replace(/[^a-z0-9]/g, '');

  // Word token matching
  const words = rawLower.split(/[\s_\-\.\:\;]+/);
  const normalizedWords = normalized.split(/[\s_\-\.\:\;]+/);

  for (const badWord of PROFANITY_LIST) {
    const normBadWord = normalizeLeetspeak(badWord);

    // 1. Direct word match
    if (words.includes(badWord) || normalizedWords.includes(normBadWord)) {
      return true;
    }

    // 2. Substring match on stripped string for severe bad words
    if (strippedRaw.includes(badWord) || strippedNormalized.includes(normBadWord)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates a proposed nickname.
 */
export function validateNickname(nickname: string): { isValid: boolean; error?: string } {
  const trimmed = nickname.trim();

  if (!trimmed) {
    return { isValid: false, error: 'Nickname cannot be empty.' };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: 'Nickname must be at least 2 characters long.' };
  }

  if (trimmed.length > 20) {
    return { isValid: false, error: 'Nickname cannot exceed 20 characters.' };
  }

  // Check character set: letters, numbers, spaces, underscores, dashes, dots
  const validCharsRegex = /^[a-zA-Z0-9 _\.-]+$/;
  if (!validCharsRegex.test(trimmed)) {
    return { isValid: false, error: 'Nickname can only contain letters, numbers, spaces, and _ - .' };
  }

  if (containsProfanity(trimmed)) {
    return { isValid: false, error: 'Inappropriate language detected. Please choose a clean nickname.' };
  }

  return { isValid: true };
}

/**
 * Checks if a nickname is already taken by another user in Firestore.
 */
export async function checkNicknameUniqueness(
  nickname: string, 
  currentUid?: string
): Promise<{ isUnique: boolean; error?: string }> {
  const clean = nickname.trim().toLowerCase();

  try {
    const { db } = await import('../lib/firebase');
    const { collection, getDocs } = await import('firebase/firestore');

    const snap = await getDocs(collection(db, 'users'));
    let taken = false;

    snap.forEach((docSnap) => {
      if (currentUid && docSnap.id === currentUid) return;

      const data = docSnap.data();
      const existingNick = (data.nickname || '').trim().toLowerCase();
      const existingDisplay = (data.displayName || '').trim().toLowerCase();

      if (existingNick === clean || existingDisplay === clean) {
        taken = true;
      }
    });

    if (taken) {
      return { 
        isUnique: false, 
        error: 'That nickname is already taken by another player. Please pick a unique name.' 
      };
    }
  } catch (err) {
    console.warn('Unable to query Firestore for nickname uniqueness:', err);
  }

  return { isUnique: true };
}
