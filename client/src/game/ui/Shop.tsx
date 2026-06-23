import { ITEMS, SHOP_BUY } from '../data';
import type { Action } from '../engine';
import type { GameState } from '../types';

export function Shop({ state, dispatch, onClose }: { state: GameState; dispatch: React.Dispatch<Action>; onClose: () => void }) {
  const sellable = Object.entries(state.inventory).filter(
    ([id, qty]) => qty > 0 && ITEMS[id]?.kind === 'produce',
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">🏪 Valley General Store</h2>
        <div className="flex items-center gap-3">
          <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-sm">🪙 {state.gold}g</span>
          <button onClick={onClose} className="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20">
            Leave
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Buy</h3>
          <div className="flex flex-col gap-2">
            {SHOP_BUY.map((id) => {
              const item = ITEMS[id];
              const afford = state.gold >= (item.buy ?? 0);
              return (
                <div
                  key={id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                >
                  <span className="flex items-center gap-2 text-sm">
                    <span className="text-lg">{item.emoji}</span>
                    {item.name}
                    <span className="text-xs text-gray-500">×{state.inventory[id] ?? 0}</span>
                  </span>
                  <button
                    disabled={!afford}
                    onClick={() => dispatch({ type: 'BUY', itemId: id })}
                    className={`rounded-md px-3 py-1 text-xs font-semibold ${
                      afford ? 'bg-emerald-500 text-white hover:bg-emerald-400' : 'cursor-not-allowed bg-white/5 text-gray-500'
                    }`}
                  >
                    {item.buy}g
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Sell harvest</h3>
          {sellable.length === 0 ? (
            <p className="rounded-lg border border-dashed border-white/10 px-3 py-6 text-center text-sm text-gray-500">
              No crops to sell yet. Grow and harvest some!
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sellable.map(([id, qty]) => {
                const item = ITEMS[id];
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-lg">{item.emoji}</span>
                      {item.name}
                      <span className="text-xs text-gray-500">×{qty}</span>
                    </span>
                    <button
                      onClick={() => dispatch({ type: 'SELL', itemId: id })}
                      className="rounded-md bg-amber-500 px-3 py-1 text-xs font-semibold text-black hover:bg-amber-400"
                    >
                      +{item.sell}g
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
