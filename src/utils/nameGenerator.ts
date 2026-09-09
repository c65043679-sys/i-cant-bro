/**
 * Generates Half-Life and Half-Life 2 enemy handles based on a seed or UID.
 * Owner handle is strictly designated as 'Gordon Freeman'.
 */

export const HL_ENEMIES = [
  'Headcrab',
  'Fast Headcrab',
  'Poison Headcrab',
  'Headcrab Zombie',
  'Fast Zombie',
  'Poison Zombie',
  'Zombine',
  'Barnacle',
  'Vortigaunt',
  'Houndeye',
  'Bullsquid',
  'Gargantua',
  'Alien Grunt',
  'Snark',
  'Ichthyosaur',
  'Tentacle',
  'Nihilanth',
  'Combine Soldier',
  'Combine Elite',
  'Civil Protection Metrocop',
  'Combine Shotgunner',
  'Combine Sniper',
  'Strider',
  'Combine Gunship',
  'Combine Dropship',
  'Hunter',
  'Combine Advisor',
  'Stalker',
  'Manhack',
  'City Scanner',
  'Shield Scanner',
  'Rollermine',
  'Sentry Turret',
  'Antlion',
  'Antlion Guard',
  'Antlion Worker',
  'HECU Grunt',
  'Black Ops Assassin',
  'Alien Controller',
  'Crab Synth',
  'Mortar Synth'
];

export function isHlEnemy(name?: string | null): boolean {
  if (!name) return false;
  const n = name.trim().toLowerCase();
  return HL_ENEMIES.some(e => e.toLowerCase() === n);
}

export function generateGamerTag(seed?: string | null, isOwner?: boolean, email?: string | null): string {
  if (isOwner || email?.toLowerCase() === 'alexsarsero@gmail.com') {
    return 'Gordon Freeman';
  }

  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    if (prefix) return prefix;
  }

  if (seed && seed.trim() !== '') {
    const normalizedSeed = seed.trim();
    if (normalizedSeed.toLowerCase() === 'alexsarsero@gmail.com' || normalizedSeed.toLowerCase() === 'gordon' || normalizedSeed.toLowerCase() === 'gordon freeman' || normalizedSeed.toLowerCase() === 'owner') {
      return 'Gordon Freeman';
    }
    return normalizedSeed;
  }

  return 'Player';
}

export function getHlAccountName(seed?: string | null, isOwner?: boolean, email?: string | null, existingName?: string | null): string {
  if (isOwner || email?.toLowerCase() === 'alexsarsero@gmail.com') {
    return 'Gordon Freeman';
  }

  if (existingName && existingName.trim() && existingName !== 'Nexus Explorer' && existingName !== 'Nexus Member') {
    return existingName.trim();
  }

  if (email && email.includes('@')) {
    const prefix = email.split('@')[0];
    if (prefix) return prefix;
  }

  if (seed && seed.trim()) {
    return seed.trim();
  }

  return 'Player';
}

