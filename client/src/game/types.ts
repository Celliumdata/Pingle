export type ElementType = 'normal' | 'grass' | 'fire' | 'water' | 'electric' | 'rock';

export type Dir = 'up' | 'down' | 'left' | 'right';

export type Mode = 'overworld' | 'battle' | 'shop' | 'party';

/** A learnable/usable attack. */
export interface Move {
  name: string;
  type: ElementType;
  power: number;
}

/** A species template (the "Pokédex" entry). */
export interface Species {
  id: string;
  name: string;
  emoji: string;
  type: ElementType;
  baseHp: number;
  moves: Move[];
}

/** A concrete creature instance owned by the player or encountered in the wild. */
export interface Creature {
  uid: string;
  speciesId: string;
  name: string;
  emoji: string;
  type: ElementType;
  level: number;
  xp: number;
  maxHp: number;
  hp: number;
  moves: Move[];
}

/** A crop definition (seed -> harvest). */
export interface Crop {
  id: string;
  name: string;
  emoji: string;
  growDays: number;
  sell: number;
  seedItem: string;
}

export type ItemKind = 'seed' | 'ball' | 'produce' | 'potion';

export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  kind: ItemKind;
  /** Shop buy price; undefined means not purchasable. */
  buy?: number;
  /** Sell price (per unit). */
  sell?: number;
  /** For seeds: the crop they grow into. */
  cropId?: string;
  /** For potions: HP healed. */
  heal?: number;
}

/** Per-tile farm soil state, keyed by `${x},${y}`. */
export interface SoilPlot {
  tilled: boolean;
  watered: boolean;
  crop?: {
    cropId: string;
    /** Number of watered days the crop has matured. */
    growth: number;
  };
}

export interface BattleState {
  wild: Creature;
  log: string[];
  /** Index into party of the active creature. */
  activeIndex: number;
  /** Set once the battle has concluded; the player must dismiss it. */
  result?: 'win' | 'lose' | 'caught' | 'fled';
  /** True while waiting for the player to choose a sub-action (e.g. a move). */
  choosingMove: boolean;
}

export type ToolId = 'hoe' | 'water' | string; // string = a seed item id when planting

export interface GameState {
  mode: Mode;
  player: { x: number; y: number; dir: Dir };
  soil: Record<string, SoilPlot>;
  gold: number;
  day: number;
  energy: number;
  maxEnergy: number;
  /** Currently selected tool/seed on the action bar. */
  tool: ToolId;
  inventory: Record<string, number>;
  party: Creature[];
  battle?: BattleState;
  /** Transient toast message shown in the overworld. */
  message?: string;
  /** Incrementing key so identical messages still re-trigger the toast. */
  messageKey: number;
}
