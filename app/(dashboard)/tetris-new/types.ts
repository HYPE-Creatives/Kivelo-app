export type Point = {
  x: number;
  y: number;
};

export type Piece = {
  shape: number[][];
  position: Point;
  color: string;
};

export type GameState = {
  score: number;
  level: number;
  isGameOver: boolean;
  isPaused: boolean;
  board: (string | null)[][];
  currentPiece: Piece | null;
  nextPiece: Piece | null;
};

export type GameAction = 
  | { type: 'MOVE_LEFT' }
  | { type: 'MOVE_RIGHT' }
  | { type: 'MOVE_DOWN' }
  | { type: 'ROTATE' }
  | { type: 'HARD_DROP' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'RESET' };