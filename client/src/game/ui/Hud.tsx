import { ITEMS, TOOL_BAR } from '../data';
import type { Action } from '../engine';
import type { GameState } from '../types';

export function Hud({
  state,
  dispatch,
  onOpenParty,
}: {
  state: GameState;
  dispatch: React.Dispatch<Action>;
  onOpenParty: () => void;
}) {
  const energyPct = Math.round((state.energy / state.maxEnergy) * 100);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge>📅 Day {state.day}</Badge>
          <Badge>🪙 {state.gold}g</Badge>
          <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="text-sm">⚡</span>
            <div className="h-2.5 w-28 overflow-hidden rounded-full bg-black/40">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${energyPct}%`,
                  background:
                    energyPct > 50 ? '#34d399' : energyPct > 20 ? '#fbbf24' : '#f87171',
                }}
              />
            </div>
            <span className="text-xs tabular-nums text-gray-300">{state.energy}</span>
          </div>
        </div>

        <button
          onClick={onOpenParty}
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm hover:bg-white/10"
        >
          <span className="text-gray-300">Team</span>
          <span className="flex gap-0.5">
            {state.party.map((c) => (
              <span key={c.uid} title={`${c.name} Lv${c.level}`} className={c.hp <= 0 ? 'opacity-30 grayscale' : ''}>
                {c.emoji}
              </span>
            ))}
          </span>
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {TOOL_BAR.map((t, i) => {
          const isSeed = t.id.startsWith('seed_');
          const count = isSeed ? state.inventory[t.id] ?? 0 : null;
          const active = state.tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => dispatch({ type: 'SELECT_TOOL', tool: t.id })}
              title={`${t.label} (press ${i + 1})`}
              className={`relative flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition ${
                active
                  ? 'border-amber-400/70 bg-amber-400/15 text-amber-100'
                  : 'border-white/10 bg-white/5 text-gray-300 hover:bg-white/10'
              }`}
            >
              <span className="text-xs text-gray-500">{i + 1}</span>
              <span>{t.emoji}</span>
              <span className="hidden sm:inline">{t.label.replace(' Seeds', '')}</span>
              {count !== null && (
                <span className="rounded bg-black/40 px-1 text-xs tabular-nums text-gray-300">{count}</span>
              )}
            </button>
          );
        })}
        <div className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-gray-400">
          🟣 {state.inventory.valleyball ?? 0} · 🫐 {ITEMS.berry.emoji ? state.inventory.berry ?? 0 : 0}
        </div>
      </div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-gray-200">
      {children}
    </span>
  );
}
