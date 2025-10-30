import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, PanResponder, SafeAreaView, StyleSheet } from "react-native";

import { ROUTES } from "../../routes";
import Controls from "./Controls";
import Grid from "./Grid";
import Overlay from "./Overlay";
import TopBar from "./TopBar";
import type { Grid as GridType } from "./types";
import useGameEngine from "./useGameEngine";

const { width, height } = Dimensions.get("window");

// tile image assets (6 round pngs)
const tileImages = [
  require("../../../assets/images/surprised.png"),
  require("../../../assets/images/bad.png"),
  require("../../../assets/images/disgusted.png"),
  require("../../../assets/images/angry.png"),
  require("../../../assets/images/sad.png"),
  require("../../../assets/images/happy.png"),
] as const;

const CELL_SIZE = Math.min(Math.floor(width * 0.075), 36);

export default function GameScreen() {
  const router = useRouter();
  const {
    grid,
    current,
    next,
    score,
    highScore,
    isPaused,
    gameOver,
    level,
    timeLeft,
    actions,
  } = useGameEngine(tileImages.length);

  const { moveHoriz, rotatePiece, togglePause, hardDrop, stepDown } = actions;

  useEffect(() => {
    if (gameOver) {
      router.replace({
        pathname: ROUTES.TETRIS_CONGRATS,
        params: { score: String(score), highScore: String(highScore), level: String(level) },
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver]);

  const animFade = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef<Animated.CompositeAnimation | null>(null);
  const lastTapRef = useRef(0);

  useEffect(() => {
    Animated.timing(animFade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, []);

  useEffect(() => {
    if (isPaused || gameOver) {
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
        spinLoopRef.current = null;
      }
      return;
    }
    if (!spinLoopRef.current) {
      spin.setValue(0);
      const loop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        { resetBeforeIteration: false }
      );
      spinLoopRef.current = loop;
      loop.start();
    }
    return () => {
      // handled above when paused or gameOver
    };
  }, [isPaused, gameOver, spin]);

  const spinInterpolate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => {
        return Math.abs(g.dx) > 2 || Math.abs(g.dy) > 2;
      },
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        if (now - lastTapRef.current < 300) {
          hardDrop();
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
      },
      onPanResponderMove: (_, g) => {
        // Horizontal movement
        if (Math.abs(g.dx) > Math.abs(g.dy) && Math.abs(g.dx) > 10) {
          moveHoriz(g.dx > 0 ? 1 : -1);
        }
        // Downward movement
        else if (g.dy > 10 && g.dy > Math.abs(g.dx)) {
          stepDown();
        }
      },
      onPanResponderRelease: (_, g) => {
        // Single tap for rotation if it's a short, small movement
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5 && 
            Date.now() - lastTapRef.current < 200) {
          rotatePiece();
        }
      }
    })
  ).current;

  // Merge current piece into grid for rendering
  const mergedGrid: GridType = grid.map((row) => [...row]);
  for (const [rOff, cOff] of current.rotations[current.rotIndex]) {
    const r = current.pos.row + rOff;
    const c = current.pos.col + cOff;
    if (r >= 0 && r < grid.length && c >= 0 && c < grid[0].length) {
      mergedGrid[r][c] = { tileIdx: current.tileIdx, isActive: true };
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: animFade }]}>
        <TopBar
          score={score}
          timeLeft={timeLeft}
          highScore={highScore}
          isPaused={isPaused}
          onTogglePause={togglePause}
        />

        <Grid
          grid={mergedGrid}
          cellSize={CELL_SIZE}
          tileImages={[...tileImages]}
          spinInterpolate={spinInterpolate}
          {...panResponder.panHandlers}
          style={[
            styles.gridWrap,
            {
              height: Math.floor(height * 0.65),
              maxHeight: CELL_SIZE * 20 + 4 // 20 rows + padding
            }
          ]}
        />

        <Controls onGesture={panResponder.panHandlers} onTap={hardDrop} actions={actions} />

        <Overlay isPaused={isPaused} gameOver={gameOver} onResume={togglePause} />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f6f4ff",
  },
  container: {
    flex: 1,
    padding: 12,
  },
  gridWrap: {
    alignSelf: "center",
    marginTop: 10,
    width: CELL_SIZE * 10 + 22, // 10 cells + padding + margins
  },
});