// PokeValley — static game data: moves, species, crops, the type chart, and the map.

import type {
  Cell,
  CropDef,
  ElementType,
  GameState,
  MoveDef,
  SpeciesDef,
  Terrain,
} from './types';

export const MAP_W = 24;
export const MAP_H = 16;
export const TILE = 36;

export const MOVES: Record<string, MoveDef> = {
  tackle: { id: 'tackle', name: 'Tackle', type: 'normal', power: 40 },
  scratch: { id: 'scratch', name: 'Scratch', type: 'normal', power: 40 },
  vine_whip: { id: 'vine_whip', name: 'Vine Whip', type: 'grass', power: 45 },
  ember: { id: 'ember', name: 'Ember', type: 'fire', power: 45 },
  water_gun: { id: 'water_gun', name: 'Water Gun', type: 'water', power: 45 },
  bug_bite: { id: 'bug_bite', name: 'Bug Bite', type: 'bug', power: 45 },
};

export const SPECIES: Record<string, SpeciesDef> = {
  leafkit: {
    id: 'leafkit',
    name: 'Leafkit',
    emoji: '🌿',
    type: 'grass',
    baseHp: 22,
    baseAtk: 10,
    baseDef: 9,
    moves: ['tackle', 'vine_whip'],
    catchRate: 0.45,
  },
  emberpup: {
    id: 'emberpup',
    name: 'Emberpup',
    emoji: '🔥',
    type: 'fire',
    baseHp: 20,
    baseAtk: 12,
    baseDef: 8,
    moves: ['scratch', 'ember'],
    catchRate: 0.4,
  },
  aquafin: {
    id: 'aquafin',
    name: 'Aquafin',
    emoji: '🐟',
    type: 'water',
    baseHp: 24,
    baseAtk: 10,
    baseDef: 10,
    moves: ['tackle', 'water_gun'],
    catchRate: 0.4,
  },
  buzzbee: {
    id: 'buzzbee',
    name: 'Buzzbee',
    emoji: '🐝',
    type: 'bug',
    baseHp: 18,
    baseAtk: 11,
    baseDef: 7,
    moves: ['tackle', 'bug_bite'],
    catchRate: 0.55,
  },
  pebblepup: {
    id: 'pebblepup',
    name: 'Pebblepup',
    emoji: '🪨',
    type: 'normal',
    baseHp: 26,
    baseAtk: 9,
    baseDef: 13,
    moves: ['tackle'],
    catchRate: 0.5,
  },
  sproutcat: {
    id: 'sproutcat',
    name: 'Sproutcat',
    emoji: '🐱',
    type: 'grass',
    baseHp: 21,
    baseAtk: 11,
    baseDef: 8,
    moves: ['scratch', 'vine_whip'],
    catchRate: 0.45,
  },
};

/** Species that can appear in tall grass. */
export const WILD_SPECIES = ['emberpup', 'aquafin', 'buzzbee', 'pebblepup', 'sproutcat'];

export const CROPS: Record<string, CropDef> = {
  parsnip: { id: 'parsnip', name: 'Parsnip', emoji: '🥕', growthDays: 3, sell: 35, seedCost: 20 },
  potato: { id: 'potato', name: 'Potato', emoji: '🥔', growthDays: 4, sell: 55, seedCost: 30 },
  cauliflower: {
    id: 'cauliflower',
    name: 'Cauliflower',
    emoji: '🥦',
    growthDays: 5,
    sell: 90,
    seedCost: 45,
  },
  strawberry: {
    id: 'strawberry',
    name: 'Strawberry',
    emoji: '🍓',
    growthDays: 4,
    sell: 75,
    seedCost: 40,
  },
  pumpkin: { id: 'pumpkin', name: 'Pumpkin', emoji: '🎃', growthDays: 6, sell: 140, seedCost: 60 },
};

export const CROP_IDS = Object.keys(CROPS);

/** Effectiveness multiplier of an attacking type against a defending type. */
const TYPE_CHART: Record<ElementType, Partial<Record<ElementType, number>>> = {
  fire: { grass: 2, bug: 2, water: 0.5, fire: 0.5 },
  water: { fire: 2, grass: 0.5, water: 0.5 },
  grass: { water: 2, fire: 0.5, grass: 0.5, bug: 0.5 },
  bug: { grass: 2, fire: 0.5, bug: 0.5 },
  normal: {},
};

export function effectiveness(attack: ElementType, defend: ElementType): number {
  return TYPE_CHART[attack]?.[defend] ?? 1;
}

/** Tiles the player cannot walk onto. Bed and shop are interacted with by facing them. */
export function isBlocking(terrain: Terrain): boolean {
  return (
    terrain === 'water' ||
    terrain === 'tree' ||
    terrain === 'rock' ||
    terrain === 'bed' ||
    terrain === 'shop'
  );
}

function inRect(x: number, y: number, x0: number, y0: number, x1: number, y1: number): boolean {
  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

export function buildMap(): Cell[][] {
  const rows: Cell[][] = [];
  for (let y = 0; y < MAP_H; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < MAP_W; x++) {
      let terrain: Terrain = 'grass';
      const border = x === 0 || y === 0 || x === MAP_W - 1 || y === MAP_H - 1;
      if (border) terrain = 'tree';
      else if (inRect(x, y, 17, 1, 21, 7)) terrain = 'tallgrass';
      else if (inRect(x, y, 9, 9, 12, 12)) terrain = 'water';
      else if (inRect(x, y, 19, 12, 20, 13)) terrain = 'rock';

      row.push({ terrain, watered: false });
    }
    rows.push(row);
  }
  // Home and shop (single interactive tiles).
  rows[3][4].terrain = 'bed';
  rows[6][4].terrain = 'shop';
  // A couple of decorative trees inside the field.
  rows[2][14].terrain = 'tree';
  rows[10][16].terrain = 'tree';
  return rows;
}

export function createInitialState(): GameState {
  return {
    day: 1,
    gold: 80,
    energy: 100,
    maxEnergy: 100,
    player: { x: 3, y: 8, dir: 'down' },
    map: buildMap(),
    crops: {},
    inventory: {
      seeds: { parsnip: 5 },
      crops: {},
      capsules: 5,
    },
    party: [createCreature('leafkit', 5)],
    activeIndex: 0,
    tool: 'hoe',
    selectedSeed: 'parsnip',
    scene: 'world',
    battle: null,
    log: ['Welcome to PokeValley! Farm by day, catch creatures in the tall grass.'],
  };
}

let uidCounter = 0;
export function nextUid(): string {
  uidCounter += 1;
  return `c${uidCounter}_${Math.random().toString(36).slice(2, 7)}`;
}

export function statsFor(speciesId: string, level: number) {
  const s = SPECIES[speciesId];
  const maxHp = s.baseHp + level * 4;
  const atk = s.baseAtk + Math.floor(level * 1.5);
  const def = s.baseDef + level;
  return { maxHp, atk, def };
}

export function createCreature(speciesId: string, level: number) {
  const { maxHp, atk, def } = statsFor(speciesId, level);
  return {
    uid: nextUid(),
    speciesId,
    level,
    xp: 0,
    hp: maxHp,
    maxHp,
    atk,
    def,
    moves: [...SPECIES[speciesId].moves],
  };
}

export function xpToNext(level: number): number {
  return level * 20;
}
