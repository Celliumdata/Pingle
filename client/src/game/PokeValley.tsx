import { useCallback, useEffect, useReducer, useRef } from 'react';
import { CROPS, CROP_IDS, MAP_H, MAP_W, MOVES, SPECIES, TILE } from './data';
import { reduce, type Action } from './engine';
import { draw } from './render';
import { createInitialState } from './data';
import type { Creature, GameState, Tool } from './types';

const STORAGE_KEY = 'pokevalley.save.v1';

function load(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as GameState;
  } catch {
    /* ignore corrupt saves */
  }
  return createInitialState();
}

const reducer = (s: GameState, a: Action) => reduce(s, a, Math.random);

export function PokeValley() {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Persist on every change.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [state]);

  // Redraw the overworld whenever state changes.
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) draw(ctx, state);
  }, [state]);

  // Keyboard controls (overworld only).
  const onKey = useCallback(
    (e: KeyboardEvent) => {
      if (state.scene !== 'world') return;
      const k = e.key.toLowerCase();
      const map: Record<string, Action> = {
        arrowup: { type: 'move', dir: 'up' },
        w: { type: 'move', dir: 'up' },
        arrowdown: { type: 'move', dir: 'down' },
        s: { type: 'move', dir: 'down' },
        arrowleft: { type: 'move', dir: 'left' },
        a: { type: 'move', dir: 'left' },
        arrowright: { type: 'move', dir: 'right' },
        d: { type: 'move', dir: 'right' },
        ' ': { type: 'interact' },
        e: { type: 'interact' },
        '1': { type: 'selectTool', tool: 'hoe' },
        '2': { type: 'selectTool', tool: 'water' },
        '3': { type: 'selectTool', tool: 'seed' },
        q: { type: 'cycleSeed' },
      };
      const action = map[k];
      if (action) {
        e.preventDefault();
        dispatch(action);
      }
    },
    [state.scene],
  );

  useEffect(() => {
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onKey]);

  return (
    <div className="grid gap-4 lg:grid-cols-[auto,1fr]">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={MAP_W * TILE}
          height={MAP_H * TILE}
          className="w-full max-w-[864px] rounded-2xl border border-white/10 shadow-lg"
          style={{ imageRendering: 'pixelated' }}
        />
        {state.scene === 'battle' && state.battle && (
          <BattleOverlay state={state} dispatch={dispatch} />
        )}
        {state.scene === 'shop' && <ShopOverlay state={state} dispatch={dispatch} />}
      </div>
      <Hud state={state} dispatch={dispatch} />
    </div>
  );
}

function Hud({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const tools: { id: Tool; label: string; emoji: string; hint: string }[] = [
    { id: 'hoe', label: 'Hoe', emoji: '⛏️', hint: '1' },
    { id: 'water', label: 'Water', emoji: '💧', hint: '2' },
    { id: 'seed', label: 'Seed', emoji: '🌱', hint: '3' },
  ];
  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-3">
        <Stat icon="📅" label={`Day ${state.day}`} />
        <Stat icon="💰" label={`${state.gold}g`} />
        <Stat icon="🎒" label={`${state.inventory.capsules} Capsules`} />
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-yellow-400 transition-all"
              style={{ width: `${(state.energy / state.maxEnergy) * 100}%` }}
            />
          </div>
          <span className="tabular-nums text-gray-300">
            {state.energy}/{state.maxEnergy}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Tools</div>
        <div className="flex flex-wrap gap-2">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => dispatch({ type: 'selectTool', tool: t.id })}
              className={`rounded-lg border px-3 py-2 transition ${
                state.tool === t.id
                  ? 'border-emerald-400 bg-emerald-400/20 text-white'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              {t.emoji} {t.label} <span className="ml-1 opacity-50">[{t.hint}]</span>
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: 'cycleSeed' })}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-gray-300 hover:bg-white/10"
          >
            {CROPS[state.selectedSeed].emoji} {CROPS[state.selectedSeed].name} seed
            <span className="ml-1 opacity-50">×{state.inventory.seeds[state.selectedSeed] ?? 0} [Q]</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Party ({state.party.length}/6)
        </div>
        <div className="flex flex-col gap-2">
          {state.party.map((c, i) => (
            <PartyRow key={c.uid} c={c} active={i === state.activeIndex} />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Harvest
        </div>
        <div className="flex flex-wrap gap-2 text-gray-300">
          {CROP_IDS.filter((id) => (state.inventory.crops[id] ?? 0) > 0).map((id) => (
            <span key={id} className="rounded-lg bg-white/5 px-2 py-1">
              {CROPS[id].emoji} {CROPS[id].name} ×{state.inventory.crops[id]}
            </span>
          ))}
          {CROP_IDS.every((id) => (state.inventory.crops[id] ?? 0) === 0) && (
            <span className="text-gray-500">No crops harvested yet.</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Log</div>
        <ul className="flex flex-col gap-1 text-gray-300">
          {state.log.slice(0, 5).map((l, i) => (
            <li key={i} className={i === 0 ? 'text-white' : 'opacity-70'}>
              • {l}
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-gray-400">
        <div className="mb-1 font-semibold text-gray-300">How to play</div>
        Move with <b>WASD / arrows</b>. Use <b>Space / E</b> to act on the tile you face. Pick a tool
        (<b>1</b> hoe, <b>2</b> water, <b>3</b> seed), <b>Q</b> cycles seeds. Face the{' '}
        <b>🛏️ bed</b> to sleep (next day), the <b>🏪 shop</b> to trade. Walk in the{' '}
        <b>tall grass</b> to find wild creatures!
        <div className="mt-3">
          <button
            onClick={() => {
              if (confirm('Start a brand new game? Your save will be erased.'))
                dispatch({ type: 'reset' });
            }}
            className="rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-red-300 hover:bg-red-500/20"
          >
            New game
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="flex items-center gap-1 rounded-lg bg-white/5 px-2 py-1 text-gray-200">
      <span>{icon}</span>
      <span className="font-medium tabular-nums">{label}</span>
    </span>
  );
}

function HpBar({ hp, max }: { hp: number; max: number }) {
  const pct = Math.max(0, (hp / max) * 100);
  const color = pct > 50 ? 'bg-emerald-400' : pct > 20 ? 'bg-yellow-400' : 'bg-red-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-black/30">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function PartyRow({ c, active }: { c: Creature; active: boolean }) {
  const sp = SPECIES[c.speciesId];
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        active ? 'border-emerald-400/60 bg-emerald-400/10' : 'border-white/10 bg-white/5'
      } ${c.hp <= 0 ? 'opacity-50' : ''}`}
    >
      <div className="flex items-center justify-between text-gray-200">
        <span>
          {sp.emoji} {sp.name} <span className="text-xs text-gray-400">Lv {c.level}</span>
        </span>
        <span className="tabular-nums text-xs text-gray-400">
          {c.hp}/{c.maxHp}
        </span>
      </div>
      <div className="mt-1">
        <HpBar hp={c.hp} max={c.maxHp} />
      </div>
    </div>
  );
}

function BattleOverlay({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  const battle = state.battle!;
  const enemy = battle.enemy;
  const enemySp = SPECIES[enemy.speciesId];
  const active = state.party[state.activeIndex];
  const activeSp = SPECIES[active.speciesId];
  const mustSwitch = active.hp <= 0 && !battle.result;
  const over = battle.result !== null;

  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10162b] p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between">
          <div className="text-left">
            <div className="text-xs text-gray-400">Wild</div>
            <div className="text-lg font-semibold text-white">
              {enemySp.emoji} {enemySp.name} <span className="text-sm text-gray-400">Lv {enemy.level}</span>
            </div>
            <div className="mt-1 w-40">
              <HpBar hp={enemy.hp} max={enemy.maxHp} />
            </div>
          </div>
          <div className="text-6xl">{enemySp.emoji}</div>
        </div>

        <div className="mb-4 flex items-end justify-between">
          <div className="text-5xl">{activeSp.emoji}</div>
          <div className="text-right">
            <div className="text-xs text-gray-400">Your {activeSp.name}</div>
            <div className="text-lg font-semibold text-white">
              {activeSp.emoji} Lv {active.level}
            </div>
            <div className="ml-auto mt-1 w-40">
              <HpBar hp={active.hp} max={active.maxHp} />
            </div>
            <div className="tabular-nums text-xs text-gray-400">
              {active.hp}/{active.maxHp}
            </div>
          </div>
        </div>

        <div className="mb-4 min-h-[2.5rem] whitespace-pre-line rounded-lg bg-black/30 px-3 py-2 text-sm text-gray-100">
          {battle.message}
        </div>

        {over ? (
          <button
            onClick={() => dispatch({ type: 'battleEnd' })}
            className="w-full rounded-lg bg-emerald-500 px-4 py-2 font-semibold text-white hover:bg-emerald-400"
          >
            Continue
          </button>
        ) : mustSwitch ? (
          <SwitchList state={state} dispatch={dispatch} label="Choose your next creature:" />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 p-2">
              <div className="mb-1 text-xs uppercase text-gray-400">Moves</div>
              <div className="grid grid-cols-1 gap-1">
                {active.moves.map((mId, i) => (
                  <button
                    key={mId}
                    onClick={() => dispatch({ type: 'battleFight', moveIndex: i })}
                    className="rounded bg-white/5 px-2 py-1 text-left text-sm text-gray-100 hover:bg-white/15"
                  >
                    {MOVES[mId].name}{' '}
                    <span className="text-xs text-gray-400">
                      {MOVES[mId].type} · {MOVES[mId].power}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => dispatch({ type: 'battleCatch' })}
                className="rounded-lg bg-indigo-500 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-400"
              >
                🎯 Throw Capsule ({state.inventory.capsules})
              </button>
              <button
                onClick={() => dispatch({ type: 'battleRun' })}
                className="rounded-lg bg-white/10 px-3 py-2 text-sm font-semibold text-gray-100 hover:bg-white/20"
              >
                🏃 Run
              </button>
              {state.party.length > 1 && (
                <SwitchList state={state} dispatch={dispatch} label="Switch" compact />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SwitchList({
  state,
  dispatch,
  label,
  compact,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'rounded-lg border border-white/10 p-2' : ''}>
      <div className="mb-1 text-xs uppercase text-gray-400">{label}</div>
      <div className="flex flex-col gap-1">
        {state.party.map((c, i) =>
          i === state.activeIndex ? null : (
            <button
              key={c.uid}
              disabled={c.hp <= 0}
              onClick={() => dispatch({ type: 'battleSwitch', index: i })}
              className="rounded bg-white/5 px-2 py-1 text-left text-sm text-gray-100 hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {SPECIES[c.speciesId].emoji} {SPECIES[c.speciesId].name} Lv {c.level} ({c.hp}/{c.maxHp})
            </button>
          ),
        )}
      </div>
    </div>
  );
}

function ShopOverlay({
  state,
  dispatch,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/70 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#10162b] p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">🏪 Valley General Store</h3>
          <span className="rounded-lg bg-white/5 px-2 py-1 text-sm text-gray-200">💰 {state.gold}g</span>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-xs uppercase text-gray-400">Buy seeds</div>
          <div className="grid grid-cols-1 gap-1">
            {CROP_IDS.map((id) => (
              <div key={id} className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5">
                <span className="text-sm text-gray-100">
                  {CROPS[id].emoji} {CROPS[id].name}{' '}
                  <span className="text-xs text-gray-400">
                    (grows {CROPS[id].growthDays}d · sells {CROPS[id].sell}g · own{' '}
                    {state.inventory.seeds[id] ?? 0})
                  </span>
                </span>
                <button
                  disabled={state.gold < CROPS[id].seedCost}
                  onClick={() => dispatch({ type: 'buySeed', cropId: id })}
                  className="rounded bg-emerald-500 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-400 disabled:opacity-40"
                >
                  Buy {CROPS[id].seedCost}g
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5">
              <span className="text-sm text-gray-100">
                🎯 Capsule <span className="text-xs text-gray-400">(catch creatures)</span>
              </span>
              <button
                disabled={state.gold < 25}
                onClick={() => dispatch({ type: 'buyCapsule' })}
                className="rounded bg-indigo-500 px-2 py-1 text-xs font-semibold text-white hover:bg-indigo-400 disabled:opacity-40"
              >
                Buy 25g
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-2 text-xs uppercase text-gray-400">Sell harvest</div>
          <div className="grid grid-cols-1 gap-1">
            {CROP_IDS.filter((id) => (state.inventory.crops[id] ?? 0) > 0).map((id) => (
              <div key={id} className="flex items-center justify-between rounded bg-white/5 px-3 py-1.5">
                <span className="text-sm text-gray-100">
                  {CROPS[id].emoji} {CROPS[id].name} ×{state.inventory.crops[id]}
                </span>
                <button
                  onClick={() => dispatch({ type: 'sellCrop', cropId: id })}
                  className="rounded bg-yellow-500 px-2 py-1 text-xs font-semibold text-black hover:bg-yellow-400"
                >
                  Sell {CROPS[id].sell}g
                </button>
              </div>
            ))}
            {CROP_IDS.every((id) => (state.inventory.crops[id] ?? 0) === 0) && (
              <div className="text-sm text-gray-500">Nothing to sell. Grow some crops!</div>
            )}
          </div>
        </div>

        <button
          onClick={() => dispatch({ type: 'closeShop' })}
          className="w-full rounded-lg bg-white/10 px-4 py-2 font-semibold text-gray-100 hover:bg-white/20"
        >
          Leave shop
        </button>
      </div>
    </div>
  );
}
