import { useCallback, useEffect, useReducer } from 'react';
import { BOARD_HEIGHT, BOARD_WIDTH, INITIAL_STATE, TETROMINOS } from './constants';
import { GameAction, GameState, Piece } from './types';

function createRandomPiece(): Piece {
  const pieces = Object.keys(TETROMINOS);
  const randomPiece = pieces[Math.floor(Math.random() * pieces.length)] as keyof typeof TETROMINOS;
  const tetromino = TETROMINOS[randomPiece];
  
  return {
    shape: tetromino.shape,
    color: tetromino.color,
    position: {
      x: Math.floor((BOARD_WIDTH - tetromino.shape[0].length) / 2),
      y: 0
    }
  };
}

function isValidPosition(piece: Piece, board: (string | null)[][]): boolean {
  return piece.shape.every((row, dy) =>
    row.every((cell, dx) => {
      if (cell === 0) return true;
      const newX = piece.position.x + dx;
      const newY = piece.position.y + dy;
      return (
        newX >= 0 &&
        newX < BOARD_WIDTH &&
        newY >= 0 &&
        newY < BOARD_HEIGHT &&
        !board[newY][newX]
      );
    })
  );
}

function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.isGameOver && action.type !== 'RESET') return state;
  if (state.isPaused && !['PAUSE', 'RESUME', 'RESET'].includes(action.type)) return state;

  switch (action.type) {
    case 'MOVE_LEFT': {
      if (!state.currentPiece) return state;
      const newPiece = {
        ...state.currentPiece,
        position: {
          ...state.currentPiece.position,
          x: state.currentPiece.position.x - 1
        }
      };
      return isValidPosition(newPiece, state.board)
        ? { ...state, currentPiece: newPiece }
        : state;
    }

    case 'MOVE_RIGHT': {
      if (!state.currentPiece) return state;
      const newPiece = {
        ...state.currentPiece,
        position: {
          ...state.currentPiece.position,
          x: state.currentPiece.position.x + 1
        }
      };
      return isValidPosition(newPiece, state.board)
        ? { ...state, currentPiece: newPiece }
        : state;
    }

    case 'MOVE_DOWN': {
      if (!state.currentPiece) return state;
      const newPiece = {
        ...state.currentPiece,
        position: {
          ...state.currentPiece.position,
          y: state.currentPiece.position.y + 1
        }
      };

      if (isValidPosition(newPiece, state.board)) {
        return { ...state, currentPiece: newPiece };
      }

      // Lock the piece
      const newBoard = [...state.board.map(row => [...row])];
      state.currentPiece.shape.forEach((row, dy) => {
        row.forEach((cell, dx) => {
          if (cell) {
            const y = state.currentPiece!.position.y + dy;
            const x = state.currentPiece!.position.x + dx;
            if (y >= 0) newBoard[y][x] = state.currentPiece!.color;
          }
        });
      });

      // Check for completed lines
      let completedLines = 0;
      for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell !== null)) {
          completedLines++;
          newBoard.splice(y, 1);
          newBoard.unshift(Array(BOARD_WIDTH).fill(null));
        }
      }

      const points = [0, 100, 300, 500, 800][completedLines];
      const newScore = state.score + points;
      const newLevel = Math.floor(newScore / 1000) + 1;

      // Check for game over
      const nextPiece = state.nextPiece || createRandomPiece();
      const isGameOver = !isValidPosition(nextPiece, newBoard);

      return {
        ...state,
        board: newBoard,
        score: newScore,
        level: newLevel,
        currentPiece: isGameOver ? null : nextPiece,
        nextPiece: isGameOver ? null : createRandomPiece(),
        isGameOver
      };
    }

    case 'ROTATE': {
      if (!state.currentPiece) return state;
      const newShape = state.currentPiece.shape[0].map((_, i) =>
        state.currentPiece!.shape.map(row => row[i]).reverse()
      );
      const newPiece = {
        ...state.currentPiece,
        shape: newShape
      };
      return isValidPosition(newPiece, state.board)
        ? { ...state, currentPiece: newPiece }
        : state;
    }

    case 'HARD_DROP': {
      if (!state.currentPiece) return state;
      let newPiece = { ...state.currentPiece };
      while (isValidPosition(
        { ...newPiece, position: { ...newPiece.position, y: newPiece.position.y + 1 } },
        state.board
      )) {
        newPiece.position.y++;
      }
      return gameReducer({ ...state, currentPiece: newPiece }, { type: 'MOVE_DOWN' });
    }

    case 'PAUSE':
      return { ...state, isPaused: true };

    case 'RESUME':
      return { ...state, isPaused: false };

    case 'RESET':
      return {
        ...INITIAL_STATE,
        currentPiece: createRandomPiece(),
        nextPiece: createRandomPiece()
      };

    default:
      return state;
  }
}

export function useGameEngine() {
  const [state, dispatch] = useReducer(gameReducer, {
    ...INITIAL_STATE,
    currentPiece: createRandomPiece(),
    nextPiece: createRandomPiece()
  });

  const moveLeft = useCallback(() => dispatch({ type: 'MOVE_LEFT' }), []);
  const moveRight = useCallback(() => dispatch({ type: 'MOVE_RIGHT' }), []);
  const moveDown = useCallback(() => dispatch({ type: 'MOVE_DOWN' }), []);
  const rotate = useCallback(() => dispatch({ type: 'ROTATE' }), []);
  const hardDrop = useCallback(() => dispatch({ type: 'HARD_DROP' }), []);
  const pause = useCallback(() => dispatch({ type: 'PAUSE' }), []);
  const resume = useCallback(() => dispatch({ type: 'RESUME' }), []);
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  useEffect(() => {
    if (state.isGameOver || state.isPaused) return;

    const speed = Math.max(100, 800 - (state.level - 1) * 50);
    const gameLoop = setInterval(() => {
      dispatch({ type: 'MOVE_DOWN' });
    }, speed);

    return () => clearInterval(gameLoop);
  }, [state.level, state.isGameOver, state.isPaused]);

  return {
    state,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    pause,
    resume,
    reset
  };
}