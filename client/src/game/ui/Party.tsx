import type { GameState } from '../types';

const TYPE_COLOR: Record<string, string> = {
  normal: '#9ca3af',
  grass: '#4ade80',
  fire: '#fb923c',
  water: '#38bdf8',
  electric: '#facc15',
  rock: '#a8a29e',
};

export function Party({ state, onClose }: { state: GameState; onClose: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">🎒 Your Team ({state.party.length}/6)</h2>
        <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
          Close
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {state.party.map((c) => {
          const hpPct = Math.round((c.hp / c.maxHp) * 100);
          const xpNext = c.level * 18;
          return (
            <div key={c.uid} className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{c.emoji}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white">{c.name}</span>
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-black"
                      style={{ background: TYPE_COLOR[c.type] }}
                    >
                      {c.type}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">Lv {c.level}</div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-black/50">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${hpPct}%`, background: hpPct > 50 ? '#34d399' : hpPct > 20 ? '#fbbf24' : '#f87171' }}
                    />
                  </div>
                  <div className="mt-0.5 flex justify-between text-[11px] tabular-nums text-gray-400">
                    <span>HP {c.hp}/{c.maxHp}</span>
                    <span>XP {c.xp}/{xpNext}</span>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {c.moves.map((m) => (
                  <span
                    key={m.name}
                    className="rounded border border-white/10 bg-black/30 px-1.5 py-0.5 text-[11px] text-gray-300"
                  >
                    {m.name} <span style={{ color: TYPE_COLOR[m.type] }}>·{m.power}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
