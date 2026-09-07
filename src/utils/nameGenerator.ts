/**
 * Generates Half-Life and Half-Life 2 enemy handles based on a seed or UID.
 * Owner handle is strictly designated as 'Gordon Freeman'.
 */

const HL_ENEMIES = [
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
  'Apache Gunship',
  'Hydra',
  'Crab Synth',
  'Mortar Synth'
];

export function generateGamerTag(seed?: string | null, isOwner?: boolean, email?: string | null): string {
  if (isOwner || email?.toLowerCase() === 'c65043679@gmail.com') {
    return 'Gordon Freeman';
  }

  if (!seed || seed.trim() === '') {
    return 'Combine Soldier';
  }

  const normalizedSeed = seed.trim().toLowerCase();
  if (normalizedSeed === 'c65043679@gmail.com' || normalizedSeed === 'gordon' || normalizedSeed === 'gordon freeman' || normalizedSeed === 'owner') {
    return 'Gordon Freeman';
  }

  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  const enemy = HL_ENEMIES[positiveHash % HL_ENEMIES.length];

  return enemy;
}

