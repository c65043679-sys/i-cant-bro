/**
 * Generates Half-Life 1 and Half-Life 2 ENEMY handles strictly.
 * Only enemies from Half-Life 1 and Half-Life 2 are allowed.
 * Owner handle is strictly designated as 'Gordon Freeman'.
 * User 'cooldude28' / 'c65043679@gmail.com' is designated as 'Combine Elite' (Half-Life 2 enemy).
 * User 'ilivetomakeslop@gmail.com' is designated as 'Alien Grunt' (Half-Life 1 enemy).
 */

export const HL_ENEMIES = [
  // Half-Life 1 Enemies
  'Headcrab',
  'Headcrab Zombie',
  'Barnacle',
  'Houndeye',
  'Bullsquid',
  'Vortigaunt',
  'Alien Grunt',
  'Alien Controller',
  'Gargantua',
  'Tentacle',
  'Ichthyosaur',
  'Snark',
  'HECU Grunt',
  'Black Ops Assassin',
  'Sentry Turret',
  'Nihilanth',

  // Half-Life 2 & Episodes Enemies
  'Combine Soldier',
  'Combine Elite',
  'Civil Protection Metrocop',
  'Combine Shotgunner',
  'Combine Sniper',
  'Fast Headcrab',
  'Poison Headcrab',
  'Fast Zombie',
  'Poison Zombie',
  'Zombine',
  'Antlion',
  'Antlion Guard',
  'Antlion Worker',
  'Hunter',
  'Strider',
  'Combine Gunship',
  'Combine Dropship',
  'Combine Advisor',
  'Stalker',
  'Manhack',
  'City Scanner',
  'Shield Scanner',
  'Rollermine',
  'Crab Synth',
  'Mortar Synth'
];

export const HL_CHARACTERS = HL_ENEMIES;

export function isHlEnemy(name?: string | null): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return HL_ENEMIES.some(e => e.toLowerCase() === n);
}

export function isHlName(name?: string | null): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  if (n === 'gordon freeman') return true;
  return isHlEnemy(name);
}

function hashStringToHlEnemy(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % HL_ENEMIES.length;
  return HL_ENEMIES[index];
}

export function generateGamerTag(seed?: string | null, isOwner?: boolean, email?: string | null): string {
  return getHlAccountName(seed, isOwner, email);
}

export function getHlAccountName(
  seed?: string | null, 
  isOwner?: boolean, 
  email?: string | null, 
  existingName?: string | null
): string {
  const normEmail = (email || '').toLowerCase().trim();
  const normName = (existingName || '').toLowerCase().trim();
  const normSeed = (seed || '').toLowerCase().trim();

  // 1. Owner designation (Gordon Freeman is excluded from competition leaderboard)
  if (isOwner || normEmail === 'alexsarsero@gmail.com' || normName === 'gordon freeman') {
    return 'Gordon Freeman';
  }

  // 2. User cooldude28 / c65043679@gmail.com is designated as Combine Elite (Half-Life 2 enemy)
  if (
    normName === 'cooldude28' || 
    normName.includes('cooldude') || 
    normEmail === 'c65043679@gmail.com' || 
    normSeed.includes('cooldude') ||
    normName === 'barney calhoun' ||
    normSeed.includes('barney')
  ) {
    return 'Combine Elite';
  }

  // 3. User ilivetomakeslop@gmail.com is designated as Alien Grunt (Half-Life 1 enemy)
  if (
    normEmail === 'ilivetomakeslop@gmail.com' || 
    normName === 'ilivetomakeslop' || 
    normSeed.includes('ilivetomakeslop') ||
    normName === 'adrian shephard' ||
    normSeed.includes('shephard')
  ) {
    return 'Alien Grunt';
  }

  // 4. If existing name is already an authentic Half-Life 1 or 2 enemy, keep it
  if (existingName && isHlEnemy(existingName)) {
    return existingName.trim();
  }

  // 5. Deterministically assign Half-Life 1 or 2 enemy name
  const candidate = normEmail || normName || normSeed;
  if (candidate && candidate !== 'nexus explorer' && candidate !== 'nexus member' && candidate !== 'player') {
    return hashStringToHlEnemy(candidate);
  }

  return 'Combine Soldier';
}



