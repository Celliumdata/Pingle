import { CROPS, MAP, MAP_H, MAP_W, TILE, TILE_INFO } from '../data';
import { facingTile } from '../engine';
import type { GameState } from '../types';

function CropSprite({ cropId, growth }: { cropId: string; growth: number }) {
  const crop = CROPS[cropId];
  const ready = growth >= crop.growDays;
  const frac = Math.min(1, growth / crop.growDays);
  const scale = 0.45 + frac * 0.55;
  if (growth === 0) {
    // freshly planted seed
    return <span style={{ fontSize: TILE * 0.52 }}>🌱</span>;
  }
  return (
    <span
      style={{
        fontSize: TILE * 0.62 * scale + TILE * 0.18,
        filter: ready ? 'drop-shadow(0 0 6px rgba(250,204,21,0.9))' : 'none',
        transform: ready ? 'translateY(-2px)' : 'none',
      }}
    >
      {crop.emoji}
    </span>
  );
}

export function World({ state }: { state: GameState }) {
  const face = facingTile(state.player);
  const showFace = state.mode === 'overworld';

  return (
    <div
      className="relative overflow-hidden rounded-2xl shadow-2xl ring-1 ring-black/40"
      style={{ width: MAP_W * TILE, height: MAP_H * TILE }}
    >
      {MAP.map((row, y) =>
        row.split('').map((ch, x) => {
          const info = TILE_INFO[ch];
          const key = `${x},${y}`;
          const plot = state.soil[key];
          const tilled = plot?.tilled;
          const watered = plot?.watered;
          const isBuilding = ch === 'B' || ch === 'S';
          let bg = info?.color ?? '#000';
          if (tilled) bg = watered ? '#5b3d22' : '#7a5733';
          return (
            <div
              key={key}
              className="absolute flex items-center justify-center"
              style={{
                left: x * TILE,
                top: y * TILE,
                width: TILE,
                height: TILE,
                background: bg,
                boxShadow: tilled ? 'inset 0 0 0 1px rgba(0,0,0,0.25)' : 'inset 0 0 0 0.5px rgba(0,0,0,0.06)',
              }}
            >
              {isBuilding && (
                <span
                  className="absolute inset-1 rounded-md"
                  style={{
                    background: ch === 'S' ? 'rgba(214,138,46,0.92)' : 'rgba(120,80,160,0.55)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.25)',
                  }}
                />
              )}
              {!tilled && info?.decor && (
                <span
                  className="relative"
                  style={{ fontSize: TILE * (isBuilding ? 0.78 : 0.6), lineHeight: 1, opacity: ch === 'w' ? 0.55 : 1 }}
                >
                  {info.decor}
                </span>
              )}
              {isBuilding && (
                <span
                  className="absolute bottom-0 left-0 right-0 text-center font-bold uppercase text-white"
                  style={{ fontSize: 9, lineHeight: '11px', textShadow: '0 1px 2px rgba(0,0,0,0.9)' }}
                >
                  {ch === 'S' ? 'Shop' : 'Bed'}
                </span>
              )}
              {watered && !plot?.crop && (
                <span style={{ position: 'absolute', bottom: 1, right: 2, fontSize: TILE * 0.28, opacity: 0.7 }}>
                  💧
                </span>
              )}
              {plot?.crop && <CropSprite cropId={plot.crop.cropId} growth={plot.crop.growth} />}
            </div>
          );
        }),
      )}

      {showFace && (
        <div
          className="pointer-events-none absolute rounded-md"
          style={{
            left: face.x * TILE + 2,
            top: face.y * TILE + 2,
            width: TILE - 4,
            height: TILE - 4,
            boxShadow: '0 0 0 2px rgba(255,255,255,0.65)',
            transition: 'left 120ms, top 120ms',
          }}
        />
      )}

      <div
        className="pointer-events-none absolute z-10 flex items-center justify-center"
        style={{
          left: state.player.x * TILE,
          top: state.player.y * TILE,
          width: TILE,
          height: TILE,
          transition: 'left 120ms ease, top 120ms ease',
        }}
      >
        <span style={{ fontSize: TILE * 0.72, filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.4))' }}>🧑‍🌾</span>
        <DirArrow dir={state.player.dir} />
      </div>
    </div>
  );
}

function DirArrow({ dir }: { dir: GameState['player']['dir'] }) {
  const pos: Record<string, React.CSSProperties> = {
    up: { top: -2, left: '50%', transform: 'translateX(-50%)' },
    down: { bottom: -2, left: '50%', transform: 'translateX(-50%)' },
    left: { left: -2, top: '50%', transform: 'translateY(-50%)' },
    right: { right: -2, top: '50%', transform: 'translateY(-50%)' },
  };
  const arrow = { up: '▲', down: '▼', left: '◀', right: '▶' }[dir];
  return (
    <span
      className="absolute font-bold text-white/90"
      style={{ fontSize: TILE * 0.22, lineHeight: 1, textShadow: '0 1px 1px rgba(0,0,0,0.6)', ...pos[dir] }}
    >
      {arrow}
    </span>
  );
}
