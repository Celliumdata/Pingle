// PokeValley — core game types.
// A small farming-and-creatures game: Stardew-style farming on an overworld map,
// Pokemon-style wild encounters, catching, and turn-based battles.

export type ElementType = 'normal' | 'grass' | 'fire' | 'water' | 'bug';

export type Direction = 'up' | 'down' | 'left' | 'right';

export type Terrain =
  | 'grass'
  | 'tallgrass'
  | 'soil'
  | 'water'
  | 'tree'
  | 'rock'
  | 'bed'
  | 'shop';

export type Tool = 'hoe' | 'water' | 'seed';

export type Scene = 'world' | 'battle' | 'shop';

export interface MoveDef {
  id: string;
  name: string;
  type: ElementType;
  power: number;
}

export interface SpeciesDef {
  id: string;
  name: string;
  emoji: string;
  type: ElementType;
  baseHp: number;
  baseAtk: number;
  baseDef: number;
  moves: string[];
  /** 0..1 — higher is easier to catch. */
  catchRate: number;
}

export interface CropDef {
  id: string;
  name: string;
  /** Sprite shown once fully grown. */
  emoji: string;
  /** Days of watering required to mature. */
  growthDays: number;
  /** Gold earned per harvested crop. */
  sell: number;
  /** Gold cost per seed in the shop. */
  seedCost: number;
}

export interface Creature {
  uid: string;
  speciesId: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  moves: string[];
}

/** A planted crop tracked by its tile coordinate key `x,y`. */
export interface Crop {
  cropId: string;
  /** 0..growthDays. Mature when stage >= growthDays. */
  stage: number;
  watered: boolean;
}

export interface Cell {
  terrain: Terrain;
  watered: boolean;
}

export interface Inventory {
  seeds: Record<string, number>;
  crops: Record<string, number>;
  capsules: number;
}

export interface BattleState {
  enemy: Creature;
  turn: 'player' | 'enemy' | 'over';
  message: string;
  result: 'win' | 'lose' | 'caught' | 'fled' | null;
}

export interface GameState {
  day: number;
  gold: number;
  energy: number;
  maxEnergy: number;
  player: { x: number; y: number; dir: Direction };
  map: Cell[][];
  crops: Record<string, Crop>;
  inventory: Inventory;
  party: Creature[];
  activeIndex: number;
  tool: Tool;
  selectedSeed: string;
  scene: Scene;
  battle: BattleState | null;
  log: string[];
}

/** Injectable RNG so battle/encounter logic stays deterministic in tests. */
export type Rng = () => number;
