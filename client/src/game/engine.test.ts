// Run with:  node --import tsx --test client/src/game/engine.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createInitialState, createCreature, CROPS, SPECIES } from './data';
import {
  reduce,
  computeDamage,
  catchChance,
  rollEncounter,
  spawnWild,
  gainXp,
} from './engine';
import type { BattleState, GameState } from './types';

const constRng = (v: number) => () => v;

test('initial state is sane', () => {
  const s = createInitialState();
  assert.equal(s.day, 1);
  assert.equal(s.party.length, 1);
  assert.equal(s.party[0].speciesId, 'leafkit');
  assert.equal(s.scene, 'world');
});

test('tilling grass converts it to soil and costs energy', () => {
  const s = createInitialState(); // player at (3,8) facing down -> front (3,9) is grass
  s.tool = 'hoe';
  const after = reduce(s, { type: 'interact' });
  assert.equal(after.map[9][3].terrain, 'soil');
  assert.equal(after.energy, s.energy - 2);
});

test('planting consumes a seed and creates a crop; watering marks it watered', () => {
  let s = createInitialState();
  s.tool = 'hoe';
  s = reduce(s, { type: 'interact' }); // till (3,9)
  s.tool = 'seed';
  s.selectedSeed = 'parsnip';
  const seedsBefore = s.inventory.seeds.parsnip;
  s = reduce(s, { type: 'interact' }); // plant
  assert.equal(s.inventory.seeds.parsnip, seedsBefore - 1);
  assert.ok(s.crops['3,9']);
  assert.equal(s.crops['3,9'].stage, 0);

  s.tool = 'water';
  s = reduce(s, { type: 'interact' }); // water
  assert.equal(s.crops['3,9'].watered, true);
  assert.equal(s.map[9][3].watered, true);
});

test('planting without seeds fails', () => {
  let s = createInitialState();
  s.inventory.seeds.parsnip = 0;
  s.tool = 'hoe';
  s = reduce(s, { type: 'interact' });
  s.tool = 'seed';
  s = reduce(s, { type: 'interact' });
  assert.equal(s.crops['3,9'], undefined);
});

test('sleeping advances day, grows watered crops, resets water and energy', () => {
  let s = createInitialState();
  s.tool = 'hoe';
  s = reduce(s, { type: 'interact' });
  s.tool = 'seed';
  s = reduce(s, { type: 'interact' });
  s.tool = 'water';
  s = reduce(s, { type: 'interact' });
  s.energy = 10;
  s = reduce(s, { type: 'sleep' });
  assert.equal(s.day, 2);
  assert.equal(s.energy, s.maxEnergy);
  assert.equal(s.crops['3,9'].stage, 1);
  assert.equal(s.crops['3,9'].watered, false);
  assert.equal(s.map[9][3].watered, false);
});

test('unwatered crops do not grow', () => {
  let s = createInitialState();
  s.tool = 'hoe';
  s = reduce(s, { type: 'interact' });
  s.tool = 'seed';
  s = reduce(s, { type: 'interact' });
  s = reduce(s, { type: 'sleep' });
  assert.equal(s.crops['3,9'].stage, 0);
});

test('mature crop can be harvested into inventory', () => {
  const s = createInitialState();
  s.map[9][3].terrain = 'soil';
  s.crops['3,9'] = { cropId: 'parsnip', stage: CROPS.parsnip.growthDays, watered: false };
  const after = reduce(s, { type: 'interact' });
  assert.equal(after.crops['3,9'], undefined);
  assert.equal(after.inventory.crops.parsnip, 1);
});

test('damage respects type effectiveness', () => {
  const fireMon = createCreature('emberpup', 5);
  const grassMon = createCreature('leafkit', 5);
  const waterMon = createCreature('aquafin', 5);
  const ember = { id: 'ember', name: 'Ember', type: 'fire' as const, power: 45 };
  const superEffective = computeDamage(fireMon, grassMon, SPECIES.leafkit.type, ember, constRng(0));
  const notVeryEffective = computeDamage(fireMon, waterMon, SPECIES.aquafin.type, ember, constRng(0));
  assert.ok(superEffective > notVeryEffective);
});

test('catch chance rises as enemy HP falls', () => {
  const mon = createCreature('buzzbee', 4);
  const full = catchChance({ ...mon, hp: mon.maxHp });
  const low = catchChance({ ...mon, hp: 1 });
  assert.ok(low > full);
});

test('rollEncounter and spawnWild are deterministic with a fixed rng', () => {
  assert.equal(rollEncounter(constRng(0)), true);
  assert.equal(rollEncounter(constRng(0.99)), false);
  const w = spawnWild(constRng(0));
  assert.ok(SPECIES[w.speciesId]);
  assert.ok(w.level >= 2 && w.level <= 5);
});

test('moving into tall grass can trigger a battle', () => {
  const s = createInitialState();
  s.player = { x: 18, y: 2, dir: 'down' }; // already in the tall grass rect
  // move to (18,3) which is tall grass; rng=0 forces encounter
  const after = reduce(s, { type: 'move', dir: 'down' }, constRng(0));
  assert.equal(after.scene, 'battle');
  assert.ok(after.battle);
});

function battleState(): GameState {
  const s = createInitialState();
  s.scene = 'battle';
  s.battle = {
    enemy: createCreature('buzzbee', 3),
    turn: 'player',
    result: null,
    message: '',
  } satisfies BattleState;
  return s;
}

test('winning a battle grants gold and xp', () => {
  const s = battleState();
  s.battle!.enemy.hp = 1; // one hit kills
  const goldBefore = s.gold;
  const after = reduce(s, { type: 'battleFight', moveIndex: 0 }, constRng(0));
  assert.equal(after.battle!.result, 'win');
  assert.ok(after.gold > goldBefore);
  assert.ok(after.party[0].xp > 0 || after.party[0].level > s.party[0].level);
});

test('catching adds the creature to the party (rng favourable)', () => {
  const s = battleState();
  s.battle!.enemy.hp = 1;
  const after = reduce(s, { type: 'battleCatch' }, constRng(0));
  assert.equal(after.battle!.result, 'caught');
  assert.equal(after.party.length, 2);
  assert.equal(after.inventory.capsules, s.inventory.capsules - 1);
});

test('catching without capsules is blocked', () => {
  const s = battleState();
  s.inventory.capsules = 0;
  const after = reduce(s, { type: 'battleCatch' }, constRng(0));
  assert.equal(after.battle!.result, null);
  assert.match(after.battle!.message, /Capsule/);
});

test('losing all creatures ends the battle and battleEnd heals + returns home', () => {
  const s = battleState();
  s.party[0].hp = 1;
  s.battle!.enemy.hp = 999;
  s.battle!.enemy.atk = 999;
  const fought = reduce(s, { type: 'battleFight', moveIndex: 0 }, constRng(0.99));
  assert.equal(fought.battle!.result, 'lose');
  const ended = reduce(fought, { type: 'battleEnd' });
  assert.equal(ended.scene, 'world');
  assert.equal(ended.party[0].hp, ended.party[0].maxHp);
});

test('shop buy and sell adjust gold and inventory', () => {
  let s = createInitialState();
  s.gold = 200;
  s = reduce(s, { type: 'buySeed', cropId: 'potato' });
  assert.equal(s.inventory.seeds.potato, 1);
  assert.equal(s.gold, 200 - CROPS.potato.seedCost);

  s.inventory.crops.parsnip = 2;
  const goldBefore = s.gold;
  s = reduce(s, { type: 'sellCrop', cropId: 'parsnip' });
  assert.equal(s.inventory.crops.parsnip, 1);
  assert.equal(s.gold, goldBefore + CROPS.parsnip.sell);
});

test('gainXp levels up and increases stats', () => {
  const mon = createCreature('leafkit', 3);
  const hpBefore = mon.maxHp;
  gainXp(mon, 1000);
  assert.ok(mon.level > 3);
  assert.ok(mon.maxHp > hpBefore);
});
