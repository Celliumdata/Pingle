// PokeValley — canvas renderer for the overworld.
import { CROPS, MAP_H, MAP_W, SPECIES, TILE } from './data';
import type { Direction, GameState, Terrain } from './types';

const TERRAIN_COLORS: Record<Terrain, string> = {
  grass: '#6cbf52',
  tallgrass: '#3f9b3f',
  soil: '#7a4a23',
  water: '#3d8fd6',
  tree: '#2f7d39',
  rock: '#8b8d92',
  bed: '#caa472',
  shop: '#b5651d',
};

function emoji(ctx: CanvasRenderingContext2D, char: string, cx: number, cy: number, size: number) {
  ctx.font = `${size}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(char, cx, cy + 1);
}

function dirOffset(dir: Direction): [number, number] {
  switch (dir) {
    case 'up':
      return [0, -1];
    case 'down':
      return [0, 1];
    case 'left':
      return [-1, 0];
    case 'right':
      return [1, 0];
  }
}

export function draw(ctx: CanvasRenderingContext2D, s: GameState): void {
  ctx.clearRect(0, 0, MAP_W * TILE, MAP_H * TILE);

  for (let y = 0; y < MAP_H; y++) {
    for (let x = 0; x < MAP_W; x++) {
      const cell = s.map[y][x];
      const px = x * TILE;
      const py = y * TILE;

      // Base grass under everything for natural look.
      ctx.fillStyle = (x + y) % 2 === 0 ? '#6cbf52' : '#63b54a';
      ctx.fillRect(px, py, TILE, TILE);

      if (cell.terrain === 'soil') {
        ctx.fillStyle = cell.watered ? '#5a3417' : TERRAIN_COLORS.soil;
        ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
      } else if (cell.terrain === 'water') {
        ctx.fillStyle = TERRAIN_COLORS.water;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(px + 4, py + 6, TILE - 8, 3);
      } else if (cell.terrain === 'tallgrass') {
        ctx.fillStyle = TERRAIN_COLORS.tallgrass;
        ctx.fillRect(px, py, TILE, TILE);
        emoji(ctx, '🌿', px + TILE / 2, py + TILE / 2, TILE - 8);
      } else if (cell.terrain === 'tree') {
        emoji(ctx, '🌳', px + TILE / 2, py + TILE / 2, TILE - 2);
      } else if (cell.terrain === 'rock') {
        emoji(ctx, '🪨', px + TILE / 2, py + TILE / 2, TILE - 6);
      } else if (cell.terrain === 'bed') {
        emoji(ctx, '🛏️', px + TILE / 2, py + TILE / 2, TILE - 4);
      } else if (cell.terrain === 'shop') {
        emoji(ctx, '🏪', px + TILE / 2, py + TILE / 2, TILE - 2);
      }

      // Crops.
      const crop = s.crops[`${x},${y}`];
      if (crop) {
        const def = CROPS[crop.cropId];
        if (crop.stage >= def.growthDays) {
          emoji(ctx, def.emoji, px + TILE / 2, py + TILE / 2, TILE - 8);
        } else if (crop.stage === 0) {
          ctx.fillStyle = '#3a7d27';
          ctx.beginPath();
          ctx.arc(px + TILE / 2, py + TILE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else {
          emoji(ctx, '🌱', px + TILE / 2, py + TILE / 2, 12 + crop.stage * 4);
        }
      }
    }
  }

  // Facing highlight.
  const [dx, dy] = dirOffset(s.player.dir);
  const fx = s.player.x + dx;
  const fy = s.player.y + dy;
  if (fx >= 0 && fy >= 0 && fx < MAP_W && fy < MAP_H) {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(fx * TILE + 2, fy * TILE + 2, TILE - 4, TILE - 4);
  }

  // Player.
  const pcx = s.player.x * TILE + TILE / 2;
  const pcy = s.player.y * TILE + TILE / 2;
  emoji(ctx, '🧑‍🌾', pcx, pcy, TILE - 4);
  // Active creature tag.
  const active = s.party[s.activeIndex];
  if (active) {
    emoji(ctx, SPECIES[active.speciesId].emoji, pcx + TILE / 2, pcy - TILE / 2, 16);
  }
}
