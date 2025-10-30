import { Grid, Rotation, Tetromino, TetrominoKey } from './types';

// Pure game engine helpers for Tetris (no React)
export const COLS = 10;
export const ROWS = 20;

export const TETROMINOS: Record<TetrominoKey, Rotation[]> = {
  I: [
    [[0, -1], [0, 0], [0, 1], [0, 2]],
    [[-1, 0], [0, 0], [1, 0], [2, 0]],
  ],
  J: [
    [[-1, -1], [0, -1], [0, 0], [0, 1]],
    [[-1, 0], [-1, 1], [0, 0], [1, 0]],
    [[0, -1], [0, 0], [0, 1], [1, 1]],
    [[-1, 0], [0, 0], [1, 0], [1, -1]],
  ],
  L: [
    [[-1, 1], [0, -1], [0, 0], [0, 1]],
    [[-1, 0], [-1, -1], [0, 0], [1, 0]],
    [[0, -1], [0, 0], [0, 1], [1, -1]],
    [[-1, 0], [0, 0], [1, 0], [1, 1]],
  ],
  O: [[[0, 0], [0, 1], [1, 0], [1, 1]]],
  S: [
    [[0, -1], [0, 0], [1, 0], [1, 1]],
    [[-1, 0], [0, 0], [0, 1], [1, 1]],
  ],
  T: [
    [[0, -1], [0, 0], [0, 1], [1, 0]],
    [[-1, 0], [0, 0], [1, 0], [0, 1]],
    [[0, -1], [0, 0], [0, 1], [-1, 0]],
    [[-1, 0], [0, 0], [1, 0], [0, -1]],
  ],
  Z: [
    [[-1, 1], [0, 0], [0, 1], [1, 0]],
    [[-1, -1], [-1, 0], [0, 0], [0, 1]],
  ],
};

export const TETROMINO_KEYS = Object.keys(TETROMINOS);

export function createEmptyGrid(): Grid {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export function collides(grid: Grid, piece: Tetromino, dRow = 0, dCol = 0, nextRot: number | null = null): boolean {
  const rot = nextRot !== null ? piece.rotations[nextRot] : piece.rotations[piece.rotIndex];
  for (const [rOff, cOff] of rot) {
    const r = piece.pos.row + rOff + dRow;
    const c = piece.pos.col + cOff + dCol;
    if (c < 0 || c >= COLS || r >= ROWS) return true;
    if (r >= 0 && grid[r][c]) return true;
  }
  return false;
}

export function lockPiece(grid: Grid, piece: Tetromino): Grid {
  const copy = grid.map((row) => row.slice());
  for (const [rOff, cOff] of piece.rotations[piece.rotIndex]) {
    const r = piece.pos.row + rOff;
    const c = piece.pos.col + cOff;
    if (r >= 0 && r < ROWS && c >= 0 && c < COLS) {
      copy[r][c] = { tileIdx: piece.tileIdx };
    }
  }
  return copy;
}

export function clearLines(grid: Grid): { grid: Grid; cleared: number } {
  const newGrid = grid.filter((r) => r.some((c) => !c));
  const cleared = ROWS - newGrid.length;
  while (newGrid.length < ROWS) newGrid.unshift(Array(COLS).fill(null));
  return { grid: newGrid, cleared };
}

export function scoreForLines(lines: number, level = 1): number {
  const base = [0, 40, 100, 300, 1200];
  return (base[lines] || 0) * level;
}

export function randomTileIndex(length: number): number {
  return Math.floor(Math.random() * length);
}

export function randomPiece(tileImagesLength: number): Tetromino {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)] as TetrominoKey;
  const rotations = TETROMINOS[key];
  const pos = { row: 0, col: Math.floor(COLS / 2) - 1 };
  return { key, rotations, rotIndex: 0, tileIdx: randomTileIndex(tileImagesLength), pos };
}
