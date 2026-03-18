export const MARVEL_STATS = [
  { key: 'might', label: 'Might', short: 'M' },
  { key: 'agility', label: 'Agility', short: 'A' },
  { key: 'resilience', label: 'Resilience', short: 'R' },
  { key: 'vigilance', label: 'Vigilance', short: 'V' },
  { key: 'ego', label: 'Ego', short: 'E' },
  { key: 'logic', label: 'Logic', short: 'L' },
];

export const COMMON_POWER_SETS = [
  'Battle Suit',
  'Blades',
  'Cosmic Power',
  'Elemental Control',
  'Energy Control',
  'Genius',
  'Magic',
  'Martial Arts',
  'Plasticity',
  'Ranged Weapons',
  'Shield Bearer',
  'Spider-Powers',
  'Super-Speed',
  'Super-Strength',
  'Telekinesis',
  'Telepathy',
  'Weather Control',
];

export const DEFAULT_MARVEL_STATS = MARVEL_STATS.reduce((acc, stat) => {
  acc[stat.key] = 1;
  return acc;
}, {});

export const DEFAULT_RESOURCES = {
  health: 30,
  focus: 10,
  karma: 1,
};

export function parseMaybeJson(value, fallback) {
  if (value == null || value === '') return fallback;
  if (typeof value === 'object') return value;

  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export function normalizeStats(input) {
  const parsed = parseMaybeJson(input, {});
  const output = { ...DEFAULT_MARVEL_STATS };

  MARVEL_STATS.forEach((stat) => {
    const current = parsed[stat.key] ?? parsed[stat.label] ?? parsed[stat.short] ?? parsed[stat.short.toLowerCase()];
    const numeric = Number(current);
    if (!Number.isNaN(numeric)) {
      output[stat.key] = Math.max(0, Math.min(10, Math.floor(numeric)));
    }
  });

  return output;
}

export function normalizeStringArray(input) {
  const parsed = parseMaybeJson(input, input);

  if (Array.isArray(parsed)) {
    return parsed
      .map((entry) => String(entry || '').trim())
      .filter(Boolean)
      .filter((entry, index, array) => array.indexOf(entry) === index);
  }

  if (typeof parsed === 'string') {
    return parsed
      .split(/[\n,]/)
      .map((entry) => entry.trim())
      .filter(Boolean)
      .filter((entry, index, array) => array.indexOf(entry) === index);
  }

  return [];
}

export function normalizeCharacterRecord(row) {
  return {
    id: row?.id ?? null,
    name: row?.name || 'Unnamed Hero',
    heroName: row?.hero_name || '',
    rank: Math.max(1, Number(row?.rank) || 1),
    origin: row?.origin || '',
    archetype: row?.archetype || '',
    occupation: row?.occupation || '',
    team: row?.team || '',
    stats: normalizeStats(row?.marvel_stats),
    health: Math.max(0, Number(row?.health) || DEFAULT_RESOURCES.health),
    focus: Math.max(0, Number(row?.focus) || DEFAULT_RESOURCES.focus),
    karma: Math.max(0, Number(row?.karma) || DEFAULT_RESOURCES.karma),
    powerSets: normalizeStringArray(row?.power_sets),
    powers: normalizeStringArray(row?.powers),
    traits: normalizeStringArray(row?.traits),
    backstory: row?.backstory || '',
    notes: row?.notes || '',
  };
}