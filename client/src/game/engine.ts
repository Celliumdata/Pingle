import {
  CROPS,
  ENCOUNTER_RATE,
  ENERGY_COST,
  ITEMS,
  MAP,
  MAP_H,
  MAP_W,
  PLAYER_START,
  SPECIES,
  TILE_INFO,
  WILD_POOL,
  typeMultiplier,
} from './data';
import type { BattleState, Creature, Dir, GameState, Move } from './types';

const SAVE_KEY = 'pokevalley-save-v1';

/* ----------------------------- small utils ----------------------------- */

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

export function tileChar(x: number, y: number): string {
  if (y < 0 || y >= MAP_H || x < 0 || x >= MAP_W) return 'T';
  return MAP[y][x];
}

function canWalk(x: number, y: number): boolean {
  return TILE_INFO[tileChar(x, y)]?.walkable ?? false;
}

function isTall(x: number, y: number): boolean {
  return TILE_INFO[tileChar(x, y)]?.tall ?? false;
}

function delta(dir: Dir): { dx: number; dy: number } {
  switch (dir) {
    case 'up':
      return { dx: 0, dy: -1 };
    case 'down':
      return { dx: 0, dy: 1 };
    case 'left':
      return { dx: -1, dy: 0 };
    case 'right':
      return { dx: 1, dy: 0 };
  }
}

export function facingTile(player: GameState['player']): { x: number; y: number } {
  const { dx, dy } = delta(player.dir);
  return { x: player.x + dx, y: player.y + dy };
}

/* ----------------------------- creatures ----------------------------- */

export function createCreature(speciesId: string, level: number): Creature {
  const s = SPECIES[speciesId];
  const maxHp = s.baseHp + (level - 1) * 3;
  return {
    uid: uid(),
    speciesId,
    name: s.name,
    emoji: s.emoji,
    type: s.type,
    level,
    xp: 0,
    maxHp,
    hp: maxHp,
    moves: s.moves,
  };
}

function xpNeeded(level: number): number {
  return level * 18;
}

function awardXp(creature: Creature, amount: number): { creature: Creature; logs: string[] } {
  const c: Creature = { ...creature, xp: creature.xp + amount };
  const logs: string[] = [];
  while (c.xp >= xpNeeded(c.level)) {
    c.xp -= xpNeeded(c.level);
    c.level += 1;
    c.maxHp += 4;
    c.hp += 4;
    logs.push(`${c.name} grew to Lv ${c.level}!`);
  }
  return { creature: c, logs };
}

function calcDamage(attacker: Creature, move: Move, defender: Creature): number {
  const mult = typeMultiplier(move.type, defender.type);
  const levelFactor = 1 + attacker.level * 0.14;
  const rand = 0.85 + Math.random() * 0.15;
  return Math.max(1, Math.round(move.power * levelFactor * mult * rand));
}

function effectivenessNote(move: Move, defender: Creature): string | null {
  const mult = typeMultiplier(move.type, defender.type);
  if (mult > 1) return "It's super effective!";
  if (mult < 1) return "It's not very effective...";
  return null;
}

/* ----------------------------- battle helpers ----------------------------- */

function startWildBattle(): BattleState {
  const speciesId = WILD_POOL[Math.floor(Math.random() * WILD_POOL.length)];
  const level = 2 + Math.floor(Math.random() * 4); // 2..5
  const wild = createCreature(speciesId, level);
  return {
    wild,
    log: [`A wild ${wild.name} (Lv ${level}) appeared!`],
    activeIndex: 0,
    choosingMove: false,
  };
}

/** Wild creature retaliates against the active party member. Mutates clones. */
function wildAttack(battle: BattleState, party: Creature[]): { battle: BattleState; party: Creature[] } {
  const b: BattleState = { ...battle, log: [...battle.log] };
  const p = party.slice();
  const wild = b.wild;
  const active = { ...p[b.activeIndex] };
  const move = wild.moves[Math.floor(Math.random() * wild.moves.length)];
  const dmg = calcDamage(wild, move, active);
  active.hp = Math.max(0, active.hp - dmg);
  p[b.activeIndex] = active;
  b.log.push(`Wild ${wild.name} used ${move.name}! (-${dmg})`);
  const note = effectivenessNote(move, active);
  if (note) b.log.push(note);
  if (active.hp <= 0) {
    b.log.push(`${active.name} fainted!`);
    const next = p.findIndex((c) => c.hp > 0);
    if (next === -1) {
      b.result = 'lose';
      b.log.push('You have no creatures left...');
    } else {
      b.activeIndex = next;
      b.log.push(`Go, ${p[next].name}!`);
    }
  }
  return { battle: b, party: p };
}

/* ----------------------------- state setup ----------------------------- */

export function createInitialState(): GameState {
  return {
    mode: 'overworld',
    player: { x: PLAYER_START.x, y: PLAYER_START.y, dir: 'down' },
    soil: {},
    gold: 120,
    day: 1,
    energy: 100,
    maxEnergy: 100,
    tool: 'hoe',
    inventory: { seed_parsnip: 5, valleyball: 5, berry: 2 },
    party: [createCreature('sproutle', 5)],
    messageKey: 0,
  };
}

function withMessage(state: GameState, message: string): GameState {
  return { ...state, message, messageKey: state.messageKey + 1 };
}

/* ----------------------------- persistence ----------------------------- */

export function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed.player || !Array.isArray(parsed.party)) return null;
    // Never restore mid-battle / transient UI state.
    return { ...parsed, mode: 'overworld', battle: undefined, message: undefined, messageKey: 0 };
  } catch {
    return null;
  }
}

export function saveGame(state: GameState): void {
  try {
    const { battle: _b, message: _m, ...persist } = state;
    void _b;
    void _m;
    localStorage.setItem(SAVE_KEY, JSON.stringify(persist));
  } catch {
    /* ignore quota / serialization errors */
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    /* ignore */
  }
}

/* ----------------------------- reducer ----------------------------- */

export type Action =
  | { type: 'NEW_GAME' }
  | { type: 'MOVE'; dir: Dir }
  | { type: 'USE_TOOL' }
  | { type: 'INTERACT' }
  | { type: 'SELECT_TOOL'; tool: string }
  | { type: 'SET_MODE'; mode: GameState['mode'] }
  | { type: 'CLEAR_MESSAGE' }
  | { type: 'BATTLE_FIGHT'; moveIndex: number }
  | { type: 'BATTLE_CATCH' }
  | { type: 'BATTLE_RUN' }
  | { type: 'BATTLE_ITEM' }
  | { type: 'BATTLE_CHOOSE_MOVE'; choosing: boolean }
  | { type: 'BATTLE_END' }
  | { type: 'BUY'; itemId: string }
  | { type: 'SELL'; itemId: string };

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'NEW_GAME':
      return createInitialState();

    case 'CLEAR_MESSAGE':
      return state.message ? { ...state, message: undefined } : state;

    case 'SET_MODE':
      return { ...state, mode: action.mode };

    case 'SELECT_TOOL':
      return { ...state, tool: action.tool };

    case 'MOVE': {
      if (state.mode !== 'overworld') return state;
      const { dir } = action;
      const { dx, dy } = delta(dir);
      const nx = state.player.x + dx;
      const ny = state.player.y + dy;
      let player = { ...state.player, dir };
      if (!canWalk(nx, ny)) {
        return { ...state, player };
      }
      player = { ...player, x: nx, y: ny };
      const next = { ...state, player };
      if (isTall(nx, ny) && state.party.some((c) => c.hp > 0) && Math.random() < ENCOUNTER_RATE) {
        return { ...next, mode: 'battle', battle: startWildBattle() };
      }
      return next;
    }

    case 'USE_TOOL': {
      if (state.mode !== 'overworld') return state;
      const { x, y } = facingTile(state.player);
      const char = tileChar(x, y);
      const key = `${x},${y}`;
      const tool = state.tool;
      const info = TILE_INFO[char];

      if (tool === 'hoe') {
        if (!info?.farm) return withMessage(state, "You can't till here.");
        const plot = state.soil[key];
        if (plot?.tilled) return withMessage(state, 'Already tilled.');
        if (state.energy < ENERGY_COST.till) return withMessage(state, 'Too tired — sleep to recover.');
        return {
          ...state,
          energy: state.energy - ENERGY_COST.till,
          soil: { ...state.soil, [key]: { tilled: true, watered: false } },
        };
      }

      if (tool === 'water') {
        const plot = state.soil[key];
        if (!plot?.tilled) return withMessage(state, 'Nothing to water here.');
        if (plot.watered) return withMessage(state, 'Already watered.');
        if (state.energy < ENERGY_COST.water) return withMessage(state, 'Too tired — sleep to recover.');
        return {
          ...state,
          energy: state.energy - ENERGY_COST.water,
          soil: { ...state.soil, [key]: { ...plot, watered: true } },
        };
      }

      // seed planting
      const item = ITEMS[tool];
      if (item?.kind === 'seed' && item.cropId) {
        const plot = state.soil[key];
        if (!plot?.tilled) return withMessage(state, 'Till the soil first.');
        if (plot.crop) return withMessage(state, 'Something is already planted.');
        if ((state.inventory[tool] ?? 0) <= 0) return withMessage(state, `Out of ${item.name}.`);
        if (state.energy < ENERGY_COST.plant) return withMessage(state, 'Too tired — sleep to recover.');
        return {
          ...state,
          energy: state.energy - ENERGY_COST.plant,
          inventory: { ...state.inventory, [tool]: state.inventory[tool] - 1 },
          soil: { ...state.soil, [key]: { ...plot, crop: { cropId: item.cropId, growth: 0 } } },
        };
      }
      return state;
    }

    case 'INTERACT': {
      if (state.mode !== 'overworld') return state;
      const { x, y } = facingTile(state.player);
      const char = tileChar(x, y);
      const key = `${x},${y}`;

      if (char === 'S') return { ...state, mode: 'shop' };

      if (char === 'B') {
        // Sleep: advance day, grow watered crops, restore energy, heal party.
        const soil: GameState['soil'] = {};
        for (const [k, plot] of Object.entries(state.soil)) {
          let p = { ...plot };
          if (p.crop && p.watered) {
            p = { ...p, crop: { ...p.crop, growth: p.crop.growth + 1 } };
          }
          p.watered = false;
          soil[k] = p;
        }
        const party = state.party.map((c) => ({ ...c, hp: c.maxHp }));
        return withMessage(
          {
            ...state,
            day: state.day + 1,
            energy: state.maxEnergy,
            soil,
            party,
          },
          `You slept well. Day ${state.day + 1} begins — crops grew and your team is healed.`,
        );
      }

      // Harvest a ready crop in front of you.
      const plot = state.soil[key];
      if (plot?.crop) {
        const crop = CROPS[plot.crop.cropId];
        if (plot.crop.growth >= crop.growDays) {
          return withMessage(
            {
              ...state,
              inventory: { ...state.inventory, [crop.id]: (state.inventory[crop.id] ?? 0) + 1 },
              soil: { ...state.soil, [key]: { tilled: true, watered: false } },
            },
            `Harvested a ${crop.name}! ${crop.emoji}`,
          );
        }
        return withMessage(state, `${crop.name} is still growing (${plot.crop.growth}/${crop.growDays} days).`);
      }
      return state;
    }

    /* --------------------------- battle --------------------------- */

    case 'BATTLE_CHOOSE_MOVE':
      if (!state.battle) return state;
      return { ...state, battle: { ...state.battle, choosingMove: action.choosing } };

    case 'BATTLE_FIGHT': {
      if (!state.battle || state.battle.result) return state;
      const b: BattleState = { ...state.battle, log: [...state.battle.log], choosingMove: false };
      const party = state.party.slice();
      const active = { ...party[b.activeIndex] };
      const move = active.moves[action.moveIndex];
      const wild = { ...b.wild };
      const dmg = calcDamage(active, move, wild);
      wild.hp = Math.max(0, wild.hp - dmg);
      b.wild = wild;
      party[b.activeIndex] = active;
      b.log.push(`${active.name} used ${move.name}! (-${dmg})`);
      const note = effectivenessNote(move, wild);
      if (note) b.log.push(note);

      if (wild.hp <= 0) {
        b.log.push(`Wild ${wild.name} fainted!`);
        const gained = wild.level * 9;
        const res = awardXp(active, gained);
        party[b.activeIndex] = res.creature;
        b.log.push(`${active.name} gained ${gained} XP.`);
        res.logs.forEach((l) => b.log.push(l));
        b.result = 'win';
        return { ...state, battle: b, party };
      }
      const after = wildAttack(b, party);
      return { ...state, battle: after.battle, party: after.party };
    }

    case 'BATTLE_CATCH': {
      if (!state.battle || state.battle.result) return state;
      const b: BattleState = { ...state.battle, log: [...state.battle.log], choosingMove: false };
      if ((state.inventory.valleyball ?? 0) <= 0) {
        b.log.push('You have no Valley Balls!');
        return { ...state, battle: b };
      }
      const inventory = { ...state.inventory, valleyball: state.inventory.valleyball - 1 };
      const party = state.party.slice();
      const wild = b.wild;
      const hpFrac = wild.hp / wild.maxHp;
      const chance = clamp((1 - hpFrac) * 0.65 + 0.25, 0.05, 0.95);
      b.log.push('You threw a Valley Ball...');
      if (Math.random() < chance) {
        if (party.length < 6) {
          party.push({ ...wild, uid: uid() });
          b.log.push(`Gotcha! ${wild.name} was caught!`);
        } else {
          b.log.push(`${wild.name} was caught, but your party is full — it was released.`);
        }
        b.result = 'caught';
        return { ...state, battle: b, party, inventory };
      }
      b.log.push(`Oh no! ${wild.name} broke free!`);
      const after = wildAttack(b, party);
      return { ...state, battle: after.battle, party: after.party, inventory };
    }

    case 'BATTLE_ITEM': {
      if (!state.battle || state.battle.result) return state;
      const b: BattleState = { ...state.battle, log: [...state.battle.log], choosingMove: false };
      const item = ITEMS.berry;
      if ((state.inventory.berry ?? 0) <= 0) {
        b.log.push('You have no Heal Berries!');
        return { ...state, battle: b };
      }
      const party = state.party.slice();
      const active = { ...party[b.activeIndex] };
      if (active.hp >= active.maxHp) {
        b.log.push(`${active.name}'s HP is already full!`);
        return { ...state, battle: b };
      }
      const heal = item.heal ?? 20;
      active.hp = Math.min(active.maxHp, active.hp + heal);
      party[b.activeIndex] = active;
      b.log.push(`${active.name} ate a Heal Berry! (+${heal} HP)`);
      const inventory = { ...state.inventory, berry: state.inventory.berry - 1 };
      const after = wildAttack(b, party);
      return { ...state, battle: after.battle, party: after.party, inventory };
    }

    case 'BATTLE_RUN': {
      if (!state.battle || state.battle.result) return state;
      const b: BattleState = { ...state.battle, log: [...state.battle.log], choosingMove: false };
      if (Math.random() < 0.85) {
        b.result = 'fled';
        b.log.push('Got away safely!');
        return { ...state, battle: b };
      }
      b.log.push("Couldn't get away!");
      const after = wildAttack(b, state.party.slice());
      return { ...state, battle: after.battle, party: after.party };
    }

    case 'BATTLE_END': {
      if (!state.battle) return { ...state, mode: 'overworld' };
      if (state.battle.result === 'lose') {
        const party = state.party.map((c) => ({ ...c, hp: c.maxHp }));
        return withMessage(
          { ...state, party, mode: 'overworld', battle: undefined },
          'You blacked out! Your team was healed back home.',
        );
      }
      return { ...state, mode: 'overworld', battle: undefined };
    }

    /* --------------------------- shop --------------------------- */

    case 'BUY': {
      const item = ITEMS[action.itemId];
      if (!item?.buy) return state;
      if (state.gold < item.buy) return withMessage(state, 'Not enough gold.');
      return withMessage(
        {
          ...state,
          gold: state.gold - item.buy,
          inventory: { ...state.inventory, [item.id]: (state.inventory[item.id] ?? 0) + 1 },
        },
        `Bought ${item.name}.`,
      );
    }

    case 'SELL': {
      const item = ITEMS[action.itemId];
      if (!item?.sell) return state;
      if ((state.inventory[item.id] ?? 0) <= 0) return state;
      return withMessage(
        {
          ...state,
          gold: state.gold + item.sell,
          inventory: { ...state.inventory, [item.id]: state.inventory[item.id] - 1 },
        },
        `Sold ${item.name} for ${item.sell}g.`,
      );
    }

    default:
      return state;
  }
}
