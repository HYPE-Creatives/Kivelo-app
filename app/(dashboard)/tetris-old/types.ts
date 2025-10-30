// Types shared across Tetris game components
export type TileIndex = number;

export type GridCell = null | {
  tileIdx: TileIndex;
  isActive?: boolean;
};

export type Grid = GridCell[][];

export type Point = [number, number];
export type Rotation = Point[];

export const TETROMINO_KEYS = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'] as const;
export type TetrominoKey = typeof TETROMINO_KEYS[number];

export type Tetromino = {
  key: TetrominoKey;
  rotations: Rotation[];
  rotIndex: number;
  tileIdx: TileIndex;
  pos: {
    row: number;
    col: number;
  };
};

export type GameActions = {
  moveHoriz: (d: number) => void;
  rotatePiece: () => void;
  togglePause: () => void;
  hardDrop: () => void;
  stepDown: () => void;
  reset: () => void;
};

export type GameState = {
  grid: Grid;
  current: Tetromino;
  next: Tetromino;
  score: number;
  highScore: number;
  isPaused: boolean;
  gameOver: boolean;
  level: number;
  timeLeft: number;
  actions: GameActions;
};