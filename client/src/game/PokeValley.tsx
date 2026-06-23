import { useEffect, useReducer, useRef, useState } from 'react';
import { TOOL_BAR } from './data';
import { clearSave, createInitialState, loadGame, reducer, saveGame } from './engine';
import type { Dir } from './types';
import { World } from './ui/World';
import { Hud } from './ui/Hud';
import { Battle } from './ui/Battle';
import { Shop } from './ui/Shop';
import { Party } from './ui/Party';

const MOVE_KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
};

export function PokeValley() {
  const [hadSave] = useState(() => loadGame() !== null);
  const [started, setStarted] = useState(false);
  const [state, dispatch] = useReducer(reducer, undefined, () => loadGame() ?? createInitialState());

  const modeRef = useRef(state.mode);
  const startedRef = useRef(started);
  modeRef.current = state.mode;
  startedRef.current = started;

  // Persist after every change once the player has begun.
  useEffect(() => {
    if (started) saveGame(state);
  }, [state, started]);

  // Auto-dismiss transient toast messages.
  useEffect(() => {
    if (!state.message) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_MESSAGE' }), 2600);
    return () => clearTimeout(t);
  }, [state.message, state.messageKey]);

  // Global keyboard controls.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!startedRef.current) return;
      const mode = modeRef.current;
      const key = e.key;

      // Menus: allow Escape to close.
      if (key === 'Escape') {
        if (mode === 'shop' || mode === 'party') dispatch({ type: 'SET_MODE', mode: 'overworld' });
        return;
      }
      // Battle / menus block overworld controls.
      if (mode !== 'overworld') return;

      if (MOVE_KEYS[key]) {
        e.preventDefault();
        dispatch({ type: 'MOVE', dir: MOVE_KEYS[key] });
        return;
      }
      if (e.repeat) return;
      if (key === ' ' || key === 'e' || key === 'E' || key === 'Enter') {
        e.preventDefault();
        dispatch({ type: 'INTERACT' });
        return;
      }
      if (key === 'f' || key === 'F') {
        e.preventDefault();
        dispatch({ type: 'USE_TOOL' });
        return;
      }
      if (key === 'p' || key === 'P') {
        dispatch({ type: 'SET_MODE', mode: 'party' });
        return;
      }
      const n = Number(key);
      if (n >= 1 && n <= TOOL_BAR.length) {
        dispatch({ type: 'SELECT_TOOL', tool: TOOL_BAR[n - 1].id });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!started) {
    return (
      <TitleScreen
        hadSave={hadSave}
        onContinue={() => setStarted(true)}
        onNew={() => {
          clearSave();
          dispatch({ type: 'NEW_GAME' });
          setStarted(true);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Hud state={state} dispatch={dispatch} onOpenParty={() => dispatch({ type: 'SET_MODE', mode: 'party' })} />

      <div className="relative flex justify-center">
        <World state={state} />

        {state.message && (
          <div
            key={state.messageKey}
            className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-white/20 bg-black/80 px-4 py-2 text-sm text-white shadow-lg"
          >
            {state.message}
          </div>
        )}

        {state.mode !== 'overworld' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-3">
            <div className="max-h-full w-full max-w-2xl overflow-y-auto">
              {state.mode === 'battle' && state.battle && <Battle state={state} dispatch={dispatch} />}
              {state.mode === 'shop' && (
                <Shop state={state} dispatch={dispatch} onClose={() => dispatch({ type: 'SET_MODE', mode: 'overworld' })} />
              )}
              {state.mode === 'party' && (
                <Party state={state} onClose={() => dispatch({ type: 'SET_MODE', mode: 'overworld' })} />
              )}
            </div>
          </div>
        )}
      </div>

      <Controls
        onReset={() => {
          if (confirm('Start a brand new save? Your current farm and team will be lost.')) {
            clearSave();
            dispatch({ type: 'NEW_GAME' });
          }
        }}
      />
    </div>
  );
}

function Controls({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-400">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span><Key>WASD</Key>/<Key>↑↓←→</Key> Move</span>
        <span><Key>F</Key> Use tool</span>
        <span><Key>Space</Key> Interact / harvest / sleep</span>
        <span><Key>1–6</Key> Select tool</span>
        <span><Key>P</Key> Team</span>
      </div>
      <button onClick={onReset} className="rounded-md border border-white/10 px-2.5 py-1 hover:bg-white/10">
        New save
      </button>
    </div>
  );
}

function Key({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-white/20 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-gray-200">
      {children}
    </kbd>
  );
}

function TitleScreen({
  hadSave,
  onContinue,
  onNew,
}: {
  hadSave: boolean;
  onContinue: () => void;
  onNew: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-white/10 bg-gradient-to-b from-emerald-900/40 to-sky-900/30 px-6 py-12 text-center">
      <div className="text-6xl">🌾🐟⚡</div>
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-white">PokéValley</h1>
        <p className="mt-2 max-w-md text-sm text-gray-300">
          Tend your farm, raise crops, and explore the tall grass to befriend wild creatures. A cozy mashup of
          monster-catching and valley farming.
        </p>
      </div>

      <div className="grid max-w-md grid-cols-2 gap-3 text-left text-xs text-gray-300">
        <Tip emoji="⛏️">Till soil with the hoe</Tip>
        <Tip emoji="🌱">Plant seeds & water daily</Tip>
        <Tip emoji="🛏️">Sleep to grow crops & heal</Tip>
        <Tip emoji="🌿">Tall grass hides wild creatures</Tip>
        <Tip emoji="🟣">Throw Valley Balls to catch them</Tip>
        <Tip emoji="🏪">Sell harvests & buy supplies</Tip>
      </div>

      <div className="flex gap-3">
        {hadSave && (
          <button
            onClick={onContinue}
            className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-white shadow hover:bg-emerald-400"
          >
            Continue ▶
          </button>
        )}
        <button
          onClick={onNew}
          className={`rounded-lg px-6 py-2.5 font-semibold shadow ${
            hadSave ? 'border border-white/15 bg-white/5 text-white hover:bg-white/10' : 'bg-emerald-500 text-white hover:bg-emerald-400'
          }`}
        >
          {hadSave ? 'New game' : 'Start ▶'}
        </button>
      </div>
    </div>
  );
}

function Tip({ emoji, children }: { emoji: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <span className="text-lg">{emoji}</span>
      <span>{children}</span>
    </div>
  );
}
