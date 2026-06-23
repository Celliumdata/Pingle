import { useEffect, useMemo, useState } from 'react';

type TileType = 'soil' | 'grass' | 'water' | 'path' | 'wild';
type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

interface Crop extends Point {
  stage: number;
}

interface Creature {
  name: string;
  mood: string;
  power: string;
}

interface GameState {
  player: Point;
  seeds: number;
  berries: number;
  day: number;
  energy: number;
  crops: Crop[];
  team: Creature[];
  encounter: Creature | null;
  milestones: {
    planted: boolean;
    harvested: boolean;
    befriended: boolean;
  };
  log: string[];
}

const SAVE_KEY = 'pokevalley-save-v1';
const MAX_ENERGY = 10;
const MAP: TileType[][] = [
  ['grass', 'grass', 'wild', 'wild', 'grass', 'soil', 'soil'],
  ['grass', 'path', 'path', 'grass', 'grass', 'soil', 'soil'],
  ['soil', 'soil', 'path', 'grass', 'water', 'water', 'grass'],
  ['soil', 'soil', 'path', 'path', 'path', 'grass', 'wild'],
  ['grass', 'grass', 'grass', 'soil', 'soil', 'soil', 'wild'],
  ['water', 'water', 'grass', 'soil', 'path', 'path', 'grass'],
  ['grass', 'wild', 'grass', 'soil', 'soil', 'grass', 'grass'],
];

const WILD_FRIENDS: Creature[] = [
  { name: 'Sproutle', mood: 'curious', power: 'waters fresh berry sprouts' },
  { name: 'Pebblip', mood: 'steadfast', power: 'clears stones around the field' },
  { name: 'Flameling', mood: 'bold', power: 'warms crops through chilly nights' },
];

const INITIAL_STATE: GameState = {
  player: { x: 2, y: 3 },
  seeds: 2,
  berries: 1,
  day: 1,
  energy: MAX_ENERGY,
  crops: [],
  team: [],
  encounter: null,
  milestones: {
    planted: false,
    harvested: false,
    befriended: false,
  },
  log: ['Day 1: You arrive in Pokevalley with two berry seeds and one snack berry.'],
};

const tileStyles: Record<TileType, string> = {
  soil: 'border-amber-700/60 bg-amber-900/60',
  grass: 'border-emerald-600/50 bg-emerald-800/60',
  water: 'border-cyan-500/50 bg-cyan-900/70',
  path: 'border-stone-500/40 bg-stone-700/60',
  wild: 'border-lime-400/50 bg-lime-800/70',
};

const tileIcons: Record<TileType, string> = {
  soil: '▦',
  grass: '·',
  water: '≈',
  path: '═',
  wild: '✦',
};

export function PokevalleyGame() {
  const [state, setState] = useState<GameState>(() => loadGame());
  const currentTile = MAP[state.player.y][state.player.x];
  const currentCrop = state.crops.find(
    (crop) => crop.x === state.player.x && crop.y === state.player.y,
  );

  const objectives = useMemo(
    () => [
      { label: 'Plant a berry seed', done: state.milestones.planted },
      { label: 'Harvest a ripe berry', done: state.milestones.harvested },
      { label: 'Befriend a wild creature', done: state.milestones.befriended },
    ],
    [state.milestones],
  );

  const completedObjectives = objectives.filter((objective) => objective.done).length;

  useEffect(() => {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: 'up',
        w: 'up',
        W: 'up',
        ArrowDown: 'down',
        s: 'down',
        S: 'down',
        ArrowLeft: 'left',
        a: 'left',
        A: 'left',
        ArrowRight: 'right',
        d: 'right',
        D: 'right',
      };
      const direction = keys[event.key];
      if (!direction) return;
      event.preventDefault();
      move(direction);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const move = (direction: Direction) => {
    setState((previous) => {
      const delta = {
        up: { x: 0, y: -1 },
        down: { x: 0, y: 1 },
        left: { x: -1, y: 0 },
        right: { x: 1, y: 0 },
      }[direction];
      const next = { x: previous.player.x + delta.x, y: previous.player.y + delta.y };

      if (!isInsideMap(next)) return withLog(previous, 'The valley fence blocks that path.');
      if (MAP[next.y][next.x] === 'water') return withLog(previous, 'The pond is too deep to cross.');

      return { ...previous, player: next };
    });
  };

  const plant = () => {
    setState((previous) => {
      const tile = MAP[previous.player.y][previous.player.x];
      const occupied = previous.crops.some(
        (crop) => crop.x === previous.player.x && crop.y === previous.player.y,
      );
      if (tile !== 'soil') return withLog(previous, 'Berry seeds need soft tilled soil.');
      if (occupied) return withLog(previous, 'A berry plant is already growing here.');
      if (previous.seeds <= 0) return withLog(previous, 'You need more seeds before planting.');
      if (previous.energy <= 0) return withLog(previous, 'You are out of energy. Rest until tomorrow.');

      return withLog(
        {
          ...previous,
          seeds: previous.seeds - 1,
          energy: previous.energy - 1,
          crops: [...previous.crops, { ...previous.player, stage: 0 }],
          milestones: { ...previous.milestones, planted: true },
        },
        'Planted a berry seed. It will ripen after two rests.',
      );
    });
  };

  const harvest = () => {
    setState((previous) => {
      const crop = previous.crops.find(
        (candidate) => candidate.x === previous.player.x && candidate.y === previous.player.y,
      );
      if (!crop) return withLog(previous, 'There is no crop to harvest on this tile.');
      if (crop.stage < 2) return withLog(previous, 'This berry plant is still growing.');

      return withLog(
        {
          ...previous,
          berries: previous.berries + 2,
          crops: previous.crops.filter((candidate) => candidate !== crop),
          milestones: { ...previous.milestones, harvested: true },
        },
        'Harvested two bright Pokeberries.',
      );
    });
  };

  const forage = () => {
    setState((previous) => {
      const tile = MAP[previous.player.y][previous.player.x];
      if (!['grass', 'wild'].includes(tile)) {
        return withLog(previous, 'Foraging works best in grass or rustling wild patches.');
      }
      if (previous.energy <= 0) return withLog(previous, 'You are out of energy. Rest until tomorrow.');

      const foundSeed = tile === 'wild' || previous.seeds <= previous.berries;
      return withLog(
        {
          ...previous,
          energy: previous.energy - 1,
          seeds: previous.seeds + (foundSeed ? 1 : 0),
          berries: previous.berries + (foundSeed ? 0 : 1),
        },
        foundSeed ? 'Found a hardy berry seed in the grass.' : 'Found a snackable wild berry.',
      );
    });
  };

  const searchWild = () => {
    setState((previous) => {
      const tile = MAP[previous.player.y][previous.player.x];
      if (tile !== 'wild') return withLog(previous, 'Wild friends hide in sparkling tall grass.');
      if (previous.encounter) return withLog(previous, `${previous.encounter.name} is watching you.`);
      const friend = WILD_FRIENDS[(previous.day + previous.team.length) % WILD_FRIENDS.length];
      return withLog({ ...previous, encounter: friend }, `A ${friend.mood} ${friend.name} appeared!`);
    });
  };

  const befriend = () => {
    setState((previous) => {
      if (!previous.encounter) return withLog(previous, 'Search wild grass to meet a creature first.');
      if (previous.berries <= 0) return withLog(previous, 'You need a berry snack to befriend it.');
      if (previous.team.some((creature) => creature.name === previous.encounter?.name)) {
        return withLog({ ...previous, encounter: null }, 'That creature is already on your farm team.');
      }

      return withLog(
        {
          ...previous,
          berries: previous.berries - 1,
          team: [...previous.team, previous.encounter],
          encounter: null,
          milestones: { ...previous.milestones, befriended: true },
        },
        'Shared a berry snack. Your new friend joined the farm team!',
      );
    });
  };

  const rest = () => {
    setState((previous) =>
      withLog(
        {
          ...previous,
          day: previous.day + 1,
          energy: MAX_ENERGY,
          crops: previous.crops.map((crop) => ({ ...crop, stage: Math.min(crop.stage + 1, 2) })),
        },
        `Day ${previous.day + 1}: dew settles, crops grow, and your energy returns.`,
      ),
    );
  };

  const reset = () => {
    window.localStorage.removeItem(SAVE_KEY);
    setState(INITIAL_STATE);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-950 via-slate-950 to-indigo-950 shadow-2xl shadow-emerald-950/30">
        <div className="grid gap-6 p-5 lg:grid-cols-[1.15fr_0.85fr] lg:p-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/70">
              Milestone 1 playable slice
            </p>
            <h1 className="text-3xl font-black text-white sm:text-4xl">Pokevalley</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50/75">
              Tend berry crops, forage the valley, and befriend wild companions in a compact
              Pokemon-meets-farming loop.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2">
            <Stat label="Day" value={state.day} />
            <Stat label="Energy" value={`${state.energy}/${MAX_ENERGY}`} />
            <Stat label="Seeds" value={state.seeds} />
            <Stat label="Berries" value={state.berries} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Farmstead map</h2>
              <p className="text-sm text-gray-400">Use WASD, arrow keys, or the controls.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-black/25 px-3 py-1 text-xs text-gray-300">
              Standing on {describeTile(currentTile)}
            </span>
          </div>

          <div className="grid max-w-[620px] grid-cols-7 gap-2">
            {MAP.flatMap((row, y) =>
              row.map((tile, x) => {
                const crop = state.crops.find((candidate) => candidate.x === x && candidate.y === y);
                const hasPlayer = state.player.x === x && state.player.y === y;
                return (
                  <div
                    key={`${x}-${y}`}
                    className={`relative aspect-square rounded-2xl border text-center text-lg shadow-inner transition ${tileStyles[tile]} ${
                      hasPlayer ? 'ring-4 ring-yellow-300/80' : ''
                    }`}
                    title={describeTile(tile)}
                  >
                    <span className="absolute left-2 top-1 text-xs text-white/50">{tileIcons[tile]}</span>
                    {crop && (
                      <span className="absolute inset-0 flex items-center justify-center text-2xl">
                        {crop.stage >= 2 ? '🍓' : crop.stage === 1 ? '🌿' : '🌱'}
                      </span>
                    )}
                    {hasPlayer && (
                      <span className="absolute inset-0 flex items-center justify-center text-3xl drop-shadow">
                        🧢
                      </span>
                    )}
                  </div>
                );
              }),
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-[160px_1fr]">
            <div className="grid grid-cols-3 gap-2 self-start">
              <span />
              <ControlButton onClick={() => move('up')}>↑</ControlButton>
              <span />
              <ControlButton onClick={() => move('left')}>←</ControlButton>
              <ControlButton onClick={() => move('down')}>↓</ControlButton>
              <ControlButton onClick={() => move('right')}>→</ControlButton>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <ActionButton onClick={plant}>Plant</ActionButton>
              <ActionButton onClick={harvest} disabled={!currentCrop}>
                Harvest
              </ActionButton>
              <ActionButton onClick={forage}>Forage</ActionButton>
              <ActionButton onClick={searchWild}>Search wild grass</ActionButton>
              <ActionButton onClick={befriend} disabled={!state.encounter}>
                Befriend
              </ActionButton>
              <ActionButton onClick={rest}>Rest</ActionButton>
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-white">Discovery objectives</h2>
              <span className="text-xs text-emerald-300">
                {completedObjectives}/{objectives.length} done
              </span>
            </div>
            <div className="space-y-2">
              {objectives.map((objective) => (
                <div
                  key={objective.label}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    objective.done
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                      : 'border-white/10 bg-black/20 text-gray-300'
                  }`}
                >
                  {objective.done ? '✓' : '○'} {objective.label}
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 font-bold text-white">Encounter</h2>
            {state.encounter ? (
              <div className="rounded-2xl border border-lime-300/30 bg-lime-500/10 p-4">
                <p className="text-xl font-black text-white">{state.encounter.name}</p>
                <p className="mt-1 text-sm text-lime-100/80">
                  A {state.encounter.mood} friend that {state.encounter.power}.
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Search sparkling tall grass to meet a companion.</p>
            )}
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-3 font-bold text-white">Farm team</h2>
            {state.team.length > 0 ? (
              <div className="space-y-2">
                {state.team.map((creature) => (
                  <div key={creature.name} className="rounded-2xl bg-black/25 p-3">
                    <p className="font-semibold text-white">{creature.name}</p>
                    <p className="text-xs text-gray-400">{creature.power}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No companions yet.</p>
            )}
          </section>
        </aside>
      </div>

      <section className="rounded-3xl border border-white/10 bg-black/25 p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-bold text-white">Valley log</h2>
          <button onClick={reset} className="text-xs font-semibold text-red-300 hover:text-red-200">
            Reset save
          </button>
        </div>
        <div className="scroll-thin max-h-36 space-y-2 overflow-y-auto pr-2 text-sm text-gray-300">
          {state.log.map((entry, index) => (
            <p key={`${entry}-${index}`} className="rounded-xl bg-white/5 px-3 py-2">
              {entry}
            </p>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function ControlButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/10 px-4 py-3 font-bold text-white transition hover:border-white/30 hover:bg-white/15"
    >
      {children}
    </button>
  );
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function isInsideMap(point: Point) {
  return point.y >= 0 && point.y < MAP.length && point.x >= 0 && point.x < MAP[0].length;
}

function describeTile(tile: TileType) {
  const descriptions: Record<TileType, string> = {
    soil: 'tilled soil',
    grass: 'meadow grass',
    water: 'pond water',
    path: 'farm path',
    wild: 'sparkling tall grass',
  };
  return descriptions[tile];
}

function withLog(state: GameState, message: string): GameState {
  return { ...state, log: [message, ...state.log].slice(0, 8) };
}

function loadGame(): GameState {
  try {
    const saved = window.localStorage.getItem(SAVE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved) as Partial<GameState>;
    return { ...INITIAL_STATE, ...parsed, milestones: { ...INITIAL_STATE.milestones, ...parsed.milestones } };
  } catch {
    return INITIAL_STATE;
  }
}
