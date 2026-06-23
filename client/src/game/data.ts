import type { Crop, ElementType, ItemDef, Move, Species, ToolId } from './types';

/** World map. Each char is a tile. See TILE_INFO for meanings. */
export const MAP: string[] = [
  'TTTTTTTTTTTTTTTTTTTT',
  'T..B.......,,,,,,..T',
  'T.........,,,,,,,,.T',
  'T..dddd...,,,,,,,,.T',
  'T..dddd...,,,,,,,,.T',
  'T..dddd....,,,,,,..T',
  'T..dddd............T',
  'T..........p...www.T',
  'T..........p...www.T',
  'T...S......p...www.T',
  'T..........p.......T',
  'T..........p.....,,T',
  'T..........p.....,,T',
  'TTTTTTTTTTTTTTTTTTTT',
];

export const MAP_W = MAP[0].length;
export const MAP_H = MAP.length;
export const TILE = 38; // px

export type TileChar = '.' | ',' | 'd' | 'w' | 'p' | 'T' | 'B' | 'S';

export interface TileInfo {
  color: string;
  /** Player can stand on it. */
  walkable: boolean;
  /** Triggers wild encounters. */
  tall?: boolean;
  /** Soil can be tilled here. */
  farm?: boolean;
  decor?: string;
}

export const TILE_INFO: Record<string, TileInfo> = {
  '.': { color: '#74c365', walkable: true },
  ',': { color: '#3f8f48', walkable: true, tall: true, decor: '🌿' },
  d: { color: '#a9824f', walkable: true, farm: true },
  w: { color: '#3d8be0', walkable: false, decor: '🌊' },
  p: { color: '#d8c79b', walkable: true },
  T: { color: '#2f6d34', walkable: false, decor: '🌲' },
  B: { color: '#74c365', walkable: false, decor: '🛏️' },
  S: { color: '#74c365', walkable: false, decor: '🏪' },
};

export const PLAYER_START = { x: 7, y: 6 };

/* ----------------------------- Type chart ----------------------------- */
// multiplier[attacker][defender]; default 1 when unspecified.
const CHART: Partial<Record<ElementType, Partial<Record<ElementType, number>>>> = {
  fire: { grass: 2, water: 0.5, rock: 0.5, fire: 0.5 },
  water: { fire: 2, rock: 2, grass: 0.5, water: 0.5 },
  grass: { water: 2, rock: 2, fire: 0.5, grass: 0.5 },
  electric: { water: 2, rock: 0.5, grass: 0.5, electric: 0.5 },
  rock: { fire: 2, electric: 2, water: 0.5, grass: 0.5 },
};

export function typeMultiplier(attack: ElementType, defend: ElementType): number {
  return CHART[attack]?.[defend] ?? 1;
}

/* ------------------------------ Moves ------------------------------ */
const TACKLE: Move = { name: 'Tackle', type: 'normal', power: 7 };

/* ------------------------------ Species ------------------------------ */
export const SPECIES: Record<string, Species> = {
  sproutle: {
    id: 'sproutle',
    name: 'Sproutle',
    emoji: '🌱',
    type: 'grass',
    baseHp: 22,
    moves: [TACKLE, { name: 'Vine Whip', type: 'grass', power: 11 }],
  },
  embern: {
    id: 'embern',
    name: 'Embern',
    emoji: '🦎',
    type: 'fire',
    baseHp: 20,
    moves: [TACKLE, { name: 'Ember', type: 'fire', power: 11 }],
  },
  aquabit: {
    id: 'aquabit',
    name: 'Aquabit',
    emoji: '🐟',
    type: 'water',
    baseHp: 21,
    moves: [TACKLE, { name: 'Bubble', type: 'water', power: 11 }],
  },
  pebblin: {
    id: 'pebblin',
    name: 'Pebblin',
    emoji: '🪨',
    type: 'rock',
    baseHp: 26,
    moves: [TACKLE, { name: 'Rock Toss', type: 'rock', power: 10 }],
  },
  zapling: {
    id: 'zapling',
    name: 'Zapling',
    emoji: '⚡',
    type: 'electric',
    baseHp: 18,
    moves: [TACKLE, { name: 'Spark', type: 'electric', power: 12 }],
  },
  mossling: {
    id: 'mossling',
    name: 'Mossling',
    emoji: '🍃',
    type: 'grass',
    baseHp: 23,
    moves: [TACKLE, { name: 'Leafage', type: 'grass', power: 10 }],
  },
};

/** Species that appear in tall grass. */
export const WILD_POOL = ['sproutle', 'embern', 'aquabit', 'pebblin', 'zapling', 'mossling'];

/* ------------------------------ Crops ------------------------------ */
export const CROPS: Record<string, Crop> = {
  parsnip: { id: 'parsnip', name: 'Parsnip', emoji: '🥕', growDays: 2, sell: 35, seedItem: 'seed_parsnip' },
  potato: { id: 'potato', name: 'Potato', emoji: '🥔', growDays: 3, sell: 60, seedItem: 'seed_potato' },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    growDays: 4,
    sell: 120,
    seedItem: 'seed_strawberry',
  },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', growDays: 5, sell: 170, seedItem: 'seed_pumpkin' },
};

/* ------------------------------ Items ------------------------------ */
export const ITEMS: Record<string, ItemDef> = {
  seed_parsnip: { id: 'seed_parsnip', name: 'Parsnip Seeds', emoji: '🥕', kind: 'seed', buy: 20, cropId: 'parsnip' },
  seed_potato: { id: 'seed_potato', name: 'Potato Seeds', emoji: '🥔', kind: 'seed', buy: 30, cropId: 'potato' },
  seed_strawberry: {
    id: 'seed_strawberry',
    name: 'Strawberry Seeds',
    emoji: '🍓',
    kind: 'seed',
    buy: 50,
    cropId: 'strawberry',
  },
  seed_pumpkin: { id: 'seed_pumpkin', name: 'Pumpkin Seeds', emoji: '🎃', kind: 'seed', buy: 70, cropId: 'pumpkin' },
  valleyball: { id: 'valleyball', name: 'Valley Ball', emoji: '🟣', kind: 'ball', buy: 50 },
  berry: { id: 'berry', name: 'Heal Berry', emoji: '🫐', kind: 'potion', buy: 40, heal: 20 },
  // produce (sell only)
  parsnip: { id: 'parsnip', name: 'Parsnip', emoji: '🥕', kind: 'produce', sell: 35 },
  potato: { id: 'potato', name: 'Potato', emoji: '🥔', kind: 'produce', sell: 60 },
  strawberry: { id: 'strawberry', name: 'Strawberry', emoji: '🍓', kind: 'produce', sell: 120 },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', kind: 'produce', sell: 170 },
};

export const SHOP_BUY: string[] = [
  'seed_parsnip',
  'seed_potato',
  'seed_strawberry',
  'seed_pumpkin',
  'valleyball',
  'berry',
];

/** Tools shown on the action bar, in cycle order. */
export const TOOL_BAR: { id: ToolId; label: string; emoji: string }[] = [
  { id: 'hoe', label: 'Hoe', emoji: '⛏️' },
  { id: 'water', label: 'Watering Can', emoji: '💧' },
  { id: 'seed_parsnip', label: 'Parsnip Seeds', emoji: '🥕' },
  { id: 'seed_potato', label: 'Potato Seeds', emoji: '🥔' },
  { id: 'seed_strawberry', label: 'Strawberry Seeds', emoji: '🍓' },
  { id: 'seed_pumpkin', label: 'Pumpkin Seeds', emoji: '🎃' },
];

export const ENERGY_COST = { till: 3, water: 2, plant: 2 };
export const ENCOUNTER_RATE = 0.22;
