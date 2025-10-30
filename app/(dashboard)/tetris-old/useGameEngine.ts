import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    clearLines,
    collides,
    COLS,
    createEmptyGrid,
    lockPiece,
    randomPiece,
    ROWS,
    scoreForLines,
} from "./game.engine";
import type { Grid, Tetromino } from "./types";

const GAME_DURATION_MS = 5 * 60 * 1000;

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
  actions: {
    moveHoriz: (d: number) => void;
    rotatePiece: () => void;
    togglePause: () => void;
    hardDrop: () => void;
    stepDown: () => void;
    reset: () => void;
  };
};

export default function useGameEngine(tileImagesLength: number, opts?: { initialLevel?: number }): GameState {
  const [grid, setGrid] = useState(() => createEmptyGrid());
  const [current, setCurrent] = useState(() => randomPiece(tileImagesLength));
  const [next, setNext] = useState(() => randomPiece(tileImagesLength));
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(opts?.initialLevel ?? 1);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION_MS);

  const rafRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);
  const accumulatorRef = useRef<number>(0);

  // Fixed timestep in milliseconds - much slower initial speed for better touch control
  const getTimeStep = () => Math.max(400, 1000 - (level - 1) * 50);

  useEffect(() => {
    AsyncStorage.getItem("@tetris_highscore").then((hs) => {
      if (hs) setHighScore(parseInt(hs));
    });
  }, []);

  useEffect(() => {
    let animationFrameId: number | null = null;
    
    function gameLoop(timestamp: number) {
      if (gameOver || isPaused) {
        lastUpdateRef.current = timestamp;
        accumulatorRef.current = 0;
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      // Calculate elapsed time since last frame
      const elapsed = Math.min(timestamp - lastUpdateRef.current, 1000); // Cap at 1 second to prevent huge jumps
      lastUpdateRef.current = timestamp;
      accumulatorRef.current += elapsed;

      const timeStep = getTimeStep();

      // Update game state at a fixed timestep
      while (accumulatorRef.current >= timeStep) {
        stepDown();
        accumulatorRef.current -= timeStep;
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    }

    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isPaused, gameOver, level]);

  useEffect(() => {
    if (gameOver || isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1000) {
          clearInterval(timerRef.current!);
          endGame();
          return 0;
        }
        return t - 1000;
      });
    }, 1000) as unknown as number;
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaused, gameOver]);

  function endGame() {
    setGameOver(true);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    AsyncStorage.setItem("@tetris_lastscore", String(score));
  }

  function stepDown() {
    if (collides(grid, current, 1, 0)) {
      const locked = lockPiece(grid, current);
      const { grid: cleared, cleared: lines } = clearLines(locked);
      if (lines > 0) {
        const gained = scoreForLines(lines, level);
        const newScore = score + gained;
        setScore(newScore);
        if (newScore > highScore) {
          setHighScore(newScore);
          AsyncStorage.setItem("@tetris_highscore", String(newScore));
        }
        setLevel(Math.floor(newScore / 1000) + 1);
      }
      setGrid(cleared);
      const spawn = { ...next, pos: { row: 0, col: Math.floor(COLS / 2) - 1 } };
      if (collides(cleared, spawn)) {
        endGame();
        return;
      }
      setCurrent(spawn);
      setNext(randomPiece(tileImagesLength));
    } else {
      setCurrent((p) => ({ ...p, pos: { ...p.pos, row: p.pos.row + 1 } }));
    }
  }

  const moveHoriz = useCallback((d: number) => {
    if (!collides(grid, current, 0, d))
      setCurrent((p) => ({ ...p, pos: { ...p.pos, col: p.pos.col + d } }));
  }, [grid, current]);

  const rotatePiece = useCallback(() => {
    const nextRot = (current.rotIndex + 1) % current.rotations.length;
    if (!collides(grid, current, 0, 0, nextRot)) setCurrent((p) => ({ ...p, rotIndex: nextRot }));
  }, [grid, current]);

  const togglePause = useCallback(() => {
    setIsPaused((p) => !p);
  }, []);

  function hardDrop() {
    let drop = 0;
    while (!collides(grid, current, drop + 1, 0)) {
      drop++;
      if (drop > ROWS) break;
    }
    if (drop <= 0) {
      if (collides(grid, current, 1, 0)) {
        const locked = lockPiece(grid, current);
        const { grid: cleared, cleared: lines } = clearLines(locked);
        if (lines > 0) {
          const gained = scoreForLines(lines, level);
          const newScore = score + gained;
          setScore(newScore);
          if (newScore > highScore) {
            setHighScore(newScore);
            AsyncStorage.setItem("@tetris_highscore", String(newScore));
          }
          setLevel(Math.floor(newScore / 1000) + 1);
        }
        setGrid(cleared);
        const spawn = { ...next, pos: { row: 0, col: Math.floor(COLS / 2) - 1 } };
        if (collides(cleared, spawn)) {
          endGame();
          return;
        }
        setCurrent(spawn);
        setNext(randomPiece(tileImagesLength));
      }
      return;
    }
    const newPiece = { ...current, pos: { ...current.pos, row: current.pos.row + drop } };
    const locked = lockPiece(grid, newPiece);
    const { grid: cleared, cleared: lines } = clearLines(locked);
    if (lines > 0) {
      const gained = scoreForLines(lines, level);
      const newScore = score + gained;
      setScore(newScore);
      if (newScore > highScore) {
        setHighScore(newScore);
        AsyncStorage.setItem("@tetris_highscore", String(newScore));
      }
      setLevel(Math.floor(newScore / 1000) + 1);
    }
    setGrid(cleared);
    const spawn = { ...next, pos: { row: 0, col: Math.floor(COLS / 2) - 1 } };
    if (collides(cleared, spawn)) {
      endGame();
      return;
    }
    setCurrent(spawn);
    setNext(randomPiece(tileImagesLength));
  }

  function reset() {
    setGrid(createEmptyGrid());
    setCurrent(randomPiece(tileImagesLength));
    setNext(randomPiece(tileImagesLength));
    setScore(0);
    setLevel(1);
    setTimeLeft(GAME_DURATION_MS);
    setGameOver(false);
    setIsPaused(false);
  }

  return {
    grid,
    current,
    next,
    score,
    highScore,
    isPaused,
    gameOver,
    level,
    timeLeft,
    actions: {
      moveHoriz,
      rotatePiece,
      togglePause,
      hardDrop,
      stepDown,
      reset,
    },
  } as const;
}
