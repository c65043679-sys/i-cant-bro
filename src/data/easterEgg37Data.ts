export interface EnigmaPart {
  id: number;
  slug: string;
  title: string;
  rune: string;
  difficulty: 'Hard' | 'Cryptic' | 'Nightmare' | 'Master';
  category: 'Keystroke' | 'Cipher' | 'Navigation' | 'Interaction' | 'Temporal' | 'Audio/Visual' | 'Apex';
  riddle: string;
  hint?: string;
  solutionKeywords: string[];
  triggerDescription: string;
}

export const ENIGMA_10_PARTS: EnigmaPart[] = [
  {
    id: 1,
    slug: 'genesis_murmur',
    title: 'The Genesis Murmur',
    rune: 'ᚠ',
    difficulty: 'Hard',
    category: 'Keystroke',
    riddle: 'Before all creations and worlds took shape, the first word echoed across the empty firmament. Whisper the beginning upon your keyboard.',
    solutionKeywords: ['genesis', 'GENESIS'],
    triggerDescription: 'Type "genesis" anywhere on the keyboard or terminal.'
  },
  {
    id: 2,
    slug: 'binary_gaze',
    title: 'The Dual Monks',
    rune: 'ᚢ',
    difficulty: 'Cryptic',
    category: 'Cipher',
    riddle: 'Two octets in the tongue of silicon conceal the sacred numeral: 00110001 00110000. Cast this query into the search archive or the terminal.',
    solutionKeywords: ['00110001 00110000', '0011000100110000', '10', '00110011 00110111', '37'],
    triggerDescription: 'Search "00110001 00110000" in the Navbar search or terminal.'
  },
  {
    id: 3,
    slug: 'septenary_sigil',
    title: 'The Septenary Sigil',
    rune: 'ᚦ',
    difficulty: 'Hard',
    category: 'Interaction',
    riddle: 'The crest at the apex remembers the traveler\'s touch. Five taps awakes the lesser title, but seven in rapid succession unseals the ancient lock.',
    solutionKeywords: ['septenary', 'SEVEN_TAPS', 'LOGO_7', 'nexus'],
    triggerDescription: 'Click the top Nexus logo 7 times rapidly.'
  },
  {
    id: 4,
    slug: 'shade_of_ten',
    title: 'The Shade of Ten',
    rune: 'ᚨ',
    difficulty: 'Cryptic',
    category: 'Audio/Visual',
    riddle: 'A monochromatic shade cloaked in twilight where darkness reigns at the tenth degree of luminescence. Infuse the sanctum\'s custom palette with this hex.',
    solutionKeywords: ['#101010', '101010', '#373737', '373737', '#0a0a0a'],
    triggerDescription: 'Set custom theme color to #101010 in Settings.'
  },
  {
    id: 5,
    slug: 'pilgrimage_tenebris',
    title: 'The Pilgrimage of Tenebris',
    rune: 'ᚱ',
    difficulty: 'Nightmare',
    category: 'Navigation',
    riddle: 'Search for the ancient progression in strict succession: first the emptiness, then the bottomless chasm, and finally the crossroads of worlds.',
    solutionKeywords: ['void abyss nexus', 'VOID_ABYSS_NEXUS', 'void', 'abyss', 'nexus'],
    triggerDescription: 'Search "void", then "abyss", then "nexus" in the search bar.'
  },
  {
    id: 6,
    slug: 'architects_sequence',
    title: 'The 1986 Architect',
    rune: 'ᚲ',
    difficulty: 'Hard',
    category: 'Keystroke',
    riddle: 'Two ascends into high heavens, two descends to underworld depths, opposing winds twice repeated, then the second and first glyphs of the Latin order.',
    solutionKeywords: ['konami', 'UUDDLRLRBA', 'KONAMI_CODE', 'up up down down left right left right b a'],
    triggerDescription: 'Press the Konami Code on keyboard: Up Up Down Down Left Right Left Right B A.'
  },
  {
    id: 7,
    slug: 'tenth_second',
    title: 'The Tenth Second',
    rune: 'ᚷ',
    difficulty: 'Nightmare',
    category: 'Temporal',
    riddle: 'Chronos circles sixty times in every turn. Seize the fleeting moment when the second hand strikes upon the tenth second, or awaken the chronometer at the foot of the realm.',
    solutionKeywords: ['second 10', 'CHRONOS_10', '10_SECONDS', 'tenth second', 'second 37'],
    triggerDescription: 'Press "T" or click the clock badge at exact second 10.'
  },
  {
    id: 8,
    slug: 'bedrock_micro_glyph',
    title: 'The Bedrock Micro-Glyph',
    rune: 'ᚹ',
    difficulty: 'Nightmare',
    category: 'Interaction',
    riddle: 'Deep in the lowest bedrock of the domain, alongside the copyright shields of 2026, a ghostly section mark § lies dormant.',
    solutionKeywords: ['section mark', 'FOOTER_GLYPH', 'SECTION_10', '§', 'section'],
    triggerDescription: 'Click the hidden micro § glyph in the footer.'
  },
  {
    id: 9,
    slug: 'fibonacci_heartbeat',
    title: 'The Fibonacci Cadence',
    rune: 'ᚺ',
    difficulty: 'Cryptic',
    category: 'Interaction',
    riddle: 'The golden spiral begins with five steps: 1, 1, 2, 3, 5. Tap the performance gauge at the screen\'s edge to awaken its dormant counter.',
    solutionKeywords: ['fibonacci', 'FPS_CADENCE', '11235', 'fps'],
    triggerDescription: 'Click the FPS Counter 5 times in rapid succession.'
  },
  {
    id: 10,
    slug: 'apex_convergence',
    title: 'The Apex Key of Nexus',
    rune: 'ᛟ',
    difficulty: 'Master',
    category: 'Apex',
    riddle: 'When the nine outer seals have been shattered, the tenth seal converges. Speak the eternal incantation of the Nexus: "NEXUS-10-ETERNAL-GENESIS".',
    solutionKeywords: [
      'NEXUS-10-ETERNAL-GENESIS',
      'nexus-10-eternal-genesis',
      'NEXUS10',
      'nexus 10',
      'NEXUS-37-ETERNAL-GENESIS-KEY-OMEGA'
    ],
    triggerDescription: 'Unlock seals 1 through 9, or enter the Master Incantation in the Enigma Terminal.'
  }
];

// Alias for backwards compatibility
export const ENIGMA_37_PARTS = ENIGMA_10_PARTS;
export const TOTAL_ENIGMA_PARTS = 10;
