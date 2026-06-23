// PokeValley — game engine. Pure helpers (deterministic given an injected RNG)
// plus a single reducer that drives all game state transitions.

import {
  CROPS,
  CROP_IDS,
  MAP_H,
  MAP_W,
  MOVES,
  SPECIES,
  WILD_SPECIES,
  createCreature,
  createInitialState,
  effectiveness,
  isBlocking,
  nextUid,
  statsFor,
  xpToNext,
} from './data';
import type { Creature, Direction, GameState, MoveDef, Rng, Tool } from './types';

export type Action =
  | { type: 'move'; dir: Direction }
  | { type: 'interact' }
  | { type: 'selectTool'; tool: Tool }
  | { type: 'cycleSeed' }
  | { type: 'sleep' }
  | { type: 'buySeed'; cropId: string }
  | { type: 'buyCapsule' }
  | { type: 'sellCrop'; cropId: string }
  | { type: 'closeShop' }
  | { type: 'battleFight'; moveIndex: number }
  | { type: 'battleCatch' }
  | { type: 'battleRun' }
  | { type: 'battleSwitch'; index: number }
  | { type: 'battleEnd' }
  | { type: 'reset' };

const MAX_LOG = 8;
const TILL_COST = 2;
const WATER_COST = 1;
const PLANT_COST = 1;

function pushLog(s: GameState, msg: string): void {
  s.log.unshift(msg);
  if (s.log.length > MAX_LOG) s.log.length = MAX_LOG;
}

function key(x: number, y: number): string {
  return `${x},${y}`;
}

function step(x: number, y: number, dir: Direction): [number, number] {
  switch (dir) {
    case 'up':
      return [x, y - 1];
    case 'down':
      return [x, y + 1];
    case 'left':
      return [x - 1, y];
    case 'right':
      return [x + 1, y];
  }
}

function inBounds(x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < MAP_W && y < MAP_H;
}

// ---------------------------------------------------------------------------
// Pure battle/encounter helpers
// ---------------------------------------------------------------------------

export function computeDamage(
  attacker: Creature,
  defender: Creature,
  defenderType: import('./types').ElementType,
  move: MoveDef,
  rng: Rng,
): number {
  const eff = effectiveness(move.type, defenderType);
  const base =
    Math.floor(((((2 * attacker.level) / 5 + 2) * move.power * attacker.atk) / defender.def) / 50) +
    2;
  const variance = 0.85 + rng() * 0.15;
  return Math.max(1, Math.floor(base * eff * variance));
}

export function catchChance(enemy: Creature, rng?: Rng): number {
  void rng;
  const species = SPECIES[enemy.speciesId];
  const hpFactor = 1 - 0.55 * (enemy.hp / enemy.maxHp);
  return clamp(species.catchRate * hpFactor + 0.1, 0.05, 0.95);
}

export function rollEncounter(rng: Rng): boolean {
  return rng() < 0.28;
}

export function spawnWild(rng: Rng): Creature {
  const speciesId = WILD_SPECIES[Math.floor(rng() * WILD_SPECIES.length)] ?? WILD_SPECIES[0];
  const level = 2 + Math.floor(rng() * 4); // 2..5
  return createCreature(speciesId, level);
}

export function gainXp(creature: Creature, amount: number): string[] {
  const logs: string[] = [];
  creature.xp += amount;
  while (creature.xp >= xpToNext(creature.level)) {
    creature.xp -= xpToNext(creature.level);
    creature.level += 1;
    const before = creature.maxHp;
    const stats = statsFor(creature.speciesId, creature.level);
    creature.maxHp = stats.maxHp;
    creature.atk = stats.atk;
    creature.def = stats.def;
    creature.hp = Math.min(creature.maxHp, creature.hp + (creature.maxHp - before));
    logs.push(`${SPECIES[creature.speciesId].name} grew to Lv ${creature.level}!`);
  }
  return logs;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function firstAliveIndex(party: Creature[]): number {
  return party.findIndex((c) => c.hp > 0);
}

// ---------------------------------------------------------------------------
// Day cycle & farming
// ---------------------------------------------------------------------------

function advanceDay(s: GameState): void {
  for (const k of Object.keys(s.crops)) {
    const crop = s.crops[k];
    if (crop.watered && crop.stage < CROPS[crop.cropId].growthDays) {
      crop.stage += 1;
    }
    crop.watered = false;
  }
  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) s.map[y][x].watered = false;
  }
  for (const c of s.party) c.hp = c.maxHp;
  s.day += 1;
  s.energy = s.maxEnergy;
  pushLog(s, `Day ${s.day}. Crops grew and your team is fully rested.`);
}

// ---------------------------------------------------------------------------
// Battle flow
// ---------------------------------------------------------------------------

function enemyTurn(s: GameState, rng: Rng): void {
  const battle = s.battle;
  if (!battle || battle.result) return;
  const active = s.party[s.activeIndex];
  const enemy = battle.enemy;
  const enemyMoveId = enemy.moves[Math.floor(rng() * enemy.moves.length)] ?? enemy.moves[0];
  const move = MOVES[enemyMoveId];
  const dmg = computeDamage(enemy, active, SPECIES[active.speciesId].type, move, rng);
  active.hp = Math.max(0, active.hp - dmg);
  battle.message = `Wild ${SPECIES[enemy.speciesId].name} used ${move.name}! (-${dmg} HP)`;
  if (active.hp <= 0) {
    pushLog(s, `${SPECIES[active.speciesId].name} fainted!`);
    if (firstAliveIndex(s.party) === -1) {
      battle.result = 'lose';
      battle.turn = 'over';
      battle.message = 'All your creatures fainted...';
    } else {
      battle.turn = 'player';
      battle.message = `${SPECIES[active.speciesId].name} fainted! Choose another creature.`;
    }
  } else {
    battle.turn = 'player';
  }
}

function startBattle(s: GameState, rng: Rng): void {
  const enemy = spawnWild(rng);
  if (firstAliveIndex(s.party) !== -1 && s.party[s.activeIndex].hp <= 0) {
    s.activeIndex = firstAliveIndex(s.party);
  }
  s.scene = 'battle';
  s.battle = {
    enemy,
    turn: 'player',
    result: null,
    message: `A wild ${SPECIES[enemy.speciesId].name} (Lv ${enemy.level}) appeared!`,
  };
  pushLog(s, `A wild ${SPECIES[enemy.speciesId].name} appeared in the tall grass!`);
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

export function reduce(state: GameState, action: Action, rng: Rng = Math.random): GameState {
  if (action.type === 'reset') return createInitialState();

  const s: GameState = structuredClone(state);

  switch (action.type) {
    case 'move': {
      if (s.scene !== 'world') return s;
      s.player.dir = action.dir;
      const [nx, ny] = step(s.player.x, s.player.y, action.dir);
      if (inBounds(nx, ny) && !isBlocking(s.map[ny][nx].terrain)) {
        s.player.x = nx;
        s.player.y = ny;
        if (s.map[ny][nx].terrain === 'tallgrass' && rollEncounter(rng)) {
          startBattle(s, rng);
        }
      }
      return s;
    }

    case 'selectTool':
      s.tool = action.tool;
      return s;

    case 'cycleSeed': {
      const i = CROP_IDS.indexOf(s.selectedSeed);
      s.selectedSeed = CROP_IDS[(i + 1) % CROP_IDS.length];
      s.tool = 'seed';
      return s;
    }

    case 'interact': {
      if (s.scene !== 'world') return s;
      const [fx, fy] = step(s.player.x, s.player.y, s.player.dir);
      if (!inBounds(fx, fy)) return s;
      const cell = s.map[fy][fx];

      if (cell.terrain === 'bed') {
        advanceDay(s);
        return s;
      }
      if (cell.terrain === 'shop') {
        s.scene = 'shop';
        return s;
      }

      const k = key(fx, fy);
      const crop = s.crops[k];

      // Harvest takes priority and is free.
      if (crop && crop.stage >= CROPS[crop.cropId].growthDays) {
        s.inventory.crops[crop.cropId] = (s.inventory.crops[crop.cropId] ?? 0) + 1;
        delete s.crops[k];
        pushLog(s, `Harvested ${CROPS[crop.cropId].name}!`);
        return s;
      }

      if (s.tool === 'hoe') {
        if (cell.terrain === 'grass') {
          if (s.energy < TILL_COST) return tooTired(s);
          cell.terrain = 'soil';
          s.energy -= TILL_COST;
        }
        return s;
      }

      if (s.tool === 'water') {
        if (cell.terrain === 'soil') {
          if (s.energy < WATER_COST) return tooTired(s);
          cell.watered = true;
          if (crop) crop.watered = true;
          s.energy -= WATER_COST;
        }
        return s;
      }

      if (s.tool === 'seed') {
        if (cell.terrain === 'soil' && !crop) {
          if ((s.inventory.seeds[s.selectedSeed] ?? 0) <= 0) {
            pushLog(s, `No ${CROPS[s.selectedSeed].name} seeds. Buy some at the shop.`);
            return s;
          }
          if (s.energy < PLANT_COST) return tooTired(s);
          s.inventory.seeds[s.selectedSeed] -= 1;
          s.crops[k] = { cropId: s.selectedSeed, stage: 0, watered: cell.watered };
          s.energy -= PLANT_COST;
          pushLog(s, `Planted ${CROPS[s.selectedSeed].name}.`);
        }
        return s;
      }
      return s;
    }

    case 'sleep':
      advanceDay(s);
      return s;

    case 'buySeed': {
      const def = CROPS[action.cropId];
      if (s.gold >= def.seedCost) {
        s.gold -= def.seedCost;
        s.inventory.seeds[action.cropId] = (s.inventory.seeds[action.cropId] ?? 0) + 1;
      }
      return s;
    }

    case 'buyCapsule': {
      const cost = 25;
      if (s.gold >= cost) {
        s.gold -= cost;
        s.inventory.capsules += 1;
      }
      return s;
    }

    case 'sellCrop': {
      const have = s.inventory.crops[action.cropId] ?? 0;
      if (have > 0) {
        s.inventory.crops[action.cropId] = have - 1;
        s.gold += CROPS[action.cropId].sell;
      }
      return s;
    }

    case 'closeShop':
      if (s.scene === 'shop') s.scene = 'world';
      return s;

    case 'battleFight': {
      const battle = s.battle;
      if (!battle || battle.turn !== 'player' || battle.result) return s;
      const active = s.party[s.activeIndex];
      if (active.hp <= 0) {
        battle.message = 'That creature has fainted — choose another!';
        return s;
      }
      const move = MOVES[active.moves[action.moveIndex]];
      if (!move) return s;
      const dmg = computeDamage(active, battle.enemy, SPECIES[battle.enemy.speciesId].type, move, rng);
      battle.enemy.hp = Math.max(0, battle.enemy.hp - dmg);
      battle.message = `${SPECIES[active.speciesId].name} used ${move.name}! (-${dmg} HP)`;
      if (battle.enemy.hp <= 0) {
        const reward = battle.enemy.level * 8;
        s.gold += reward;
        battle.result = 'win';
        battle.turn = 'over';
        const lvUps = gainXp(active, battle.enemy.level * 12);
        battle.message = `You defeated the wild ${SPECIES[battle.enemy.speciesId].name}! +${reward}g`;
        pushLog(s, `Won the battle! +${reward}g and XP.`);
        for (const l of lvUps) pushLog(s, l);
      } else {
        battle.turn = 'enemy';
        enemyTurn(s, rng);
      }
      return s;
    }

    case 'battleCatch': {
      const battle = s.battle;
      if (!battle || battle.turn !== 'player' || battle.result) return s;
      if (s.party[s.activeIndex].hp <= 0) {
        battle.message = 'Choose a healthy creature first!';
        return s;
      }
      if (s.inventory.capsules <= 0) {
        battle.message = 'You are out of Capsules!';
        return s;
      }
      s.inventory.capsules -= 1;
      const chance = catchChance(battle.enemy);
      if (rng() < chance) {
        if (s.party.length >= 6) {
          battle.message = 'Your party is full! It got away.';
          battle.result = 'fled';
          battle.turn = 'over';
          return s;
        }
        const caught: Creature = { ...structuredClone(battle.enemy), uid: nextUid() };
        s.party.push(caught);
        battle.result = 'caught';
        battle.turn = 'over';
        battle.message = `Gotcha! ${SPECIES[caught.speciesId].name} was caught!`;
        pushLog(s, `Caught a ${SPECIES[caught.speciesId].name}!`);
      } else {
        battle.message = 'Argh! It broke free!';
        battle.turn = 'enemy';
        enemyTurn(s, rng);
      }
      return s;
    }

    case 'battleRun': {
      const battle = s.battle;
      if (!battle || battle.turn !== 'player' || battle.result) return s;
      if (rng() < 0.6) {
        battle.result = 'fled';
        battle.turn = 'over';
        battle.message = 'Got away safely!';
      } else {
        battle.message = "Couldn't escape!";
        battle.turn = 'enemy';
        enemyTurn(s, rng);
      }
      return s;
    }

    case 'battleSwitch': {
      const battle = s.battle;
      if (!battle || battle.result) return s;
      const target = s.party[action.index];
      if (!target || target.hp <= 0 || action.index === s.activeIndex) return s;
      const wasFainted = s.party[s.activeIndex].hp <= 0;
      s.activeIndex = action.index;
      battle.message = `Go, ${SPECIES[target.speciesId].name}!`;
      if (!wasFainted) {
        // A voluntary switch costs your turn.
        battle.turn = 'enemy';
        enemyTurn(s, rng);
      } else {
        battle.turn = 'player';
      }
      return s;
    }

    case 'battleEnd': {
      const battle = s.battle;
      if (!battle) return s;
      if (battle.result === 'lose') {
        for (const c of s.party) c.hp = c.maxHp;
        s.activeIndex = 0;
        s.player = { x: 3, y: 4, dir: 'down' };
        pushLog(s, 'You blacked out and woke up at home.');
      }
      s.scene = 'world';
      s.battle = null;
      return s;
    }

    default:
      return s;
  }
}

function tooTired(s: GameState): GameState {
  pushLog(s, 'Too tired — sleep to restore energy.');
  return s;
}
