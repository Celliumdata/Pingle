import { useEffect, useRef } from 'react';
import type { Action } from '../engine';
import type { Creature, GameState } from '../types';

const TYPE_COLOR: Record<string, string> = {
  normal: '#9ca3af',
  grass: '#4ade80',
  fire: '#fb923c',
  water: '#38bdf8',
  electric: '#facc15',
  rock: '#a8a29e',
};

function HpBar({ c }: { c: Creature }) {
  const pct = Math.max(0, Math.round((c.hp / c.maxHp) * 100));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-white">
          {c.name} <span className="text-gray-400">Lv {c.level}</span>
        </span>
        <span
          className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-black"
          style={{ background: TYPE_COLOR[c.type] }}
        >
          {c.type}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/50">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, background: pct > 50 ? '#34d399' : pct > 20 ? '#fbbf24' : '#f87171' }}
        />
      </div>
      <div className="mt-0.5 text-right text-[11px] tabular-nums text-gray-300">
        {c.hp}/{c.maxHp}
      </div>
    </div>
  );
}

export function Battle({ state, dispatch }: { state: GameState; dispatch: React.Dispatch<Action> }) {
  const battle = state.battle!;
  const active = state.party[battle.activeIndex];
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [battle.log.length]);

  const over = !!battle.result;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-gradient-to-b from-sky-900/40 to-emerald-900/30 p-4">
      <div className="grid grid-cols-2 gap-4">
        {/* Wild */}
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <HpBar c={battle.wild} />
          <div className="mt-2 flex justify-center text-6xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
            {battle.wild.emoji}
          </div>
        </div>
        {/* Active */}
        <div className="flex flex-col rounded-xl border border-white/10 bg-black/20 p-3">
          <div className="mb-2 flex justify-center text-6xl" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }}>
            {active.emoji}
          </div>
          <HpBar c={active} />
        </div>
      </div>

      <div
        ref={logRef}
        className="scroll-thin h-24 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-gray-200"
      >
        {battle.log.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>

      {over ? (
        <button
          onClick={() => dispatch({ type: 'BATTLE_END' })}
          className="w-full rounded-lg bg-indigo-500 px-4 py-2.5 font-semibold text-white hover:bg-indigo-400"
        >
          Continue ▶
        </button>
      ) : battle.choosingMove ? (
        <div className="grid grid-cols-2 gap-2">
          {active.moves.map((m, i) => (
            <button
              key={m.name}
              onClick={() => dispatch({ type: 'BATTLE_FIGHT', moveIndex: i })}
              className="flex flex-col items-start rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-left hover:bg-white/10"
            >
              <span className="text-sm font-semibold text-white">{m.name}</span>
              <span className="text-xs text-gray-400">
                <span style={{ color: TYPE_COLOR[m.type] }}>{m.type}</span> · pow {m.power}
              </span>
            </button>
          ))}
          <button
            onClick={() => dispatch({ type: 'BATTLE_CHOOSE_MOVE', choosing: false })}
            className="col-span-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-300 hover:bg-white/10"
          >
            ◀ Back
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <ActionBtn label="⚔️ Fight" onClick={() => dispatch({ type: 'BATTLE_CHOOSE_MOVE', choosing: true })} />
          <ActionBtn
            label={`🟣 Catch (${state.inventory.valleyball ?? 0})`}
            onClick={() => dispatch({ type: 'BATTLE_CATCH' })}
          />
          <ActionBtn
            label={`🫐 Berry (${state.inventory.berry ?? 0})`}
            onClick={() => dispatch({ type: 'BATTLE_ITEM' })}
          />
          <ActionBtn label="🏃 Run" onClick={() => dispatch({ type: 'BATTLE_RUN' })} />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
    >
      {label}
    </button>
  );
}
