import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback } from 'react';
import {
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { CELL_SIZE as BASE_CELL_SIZE, BOARD_HEIGHT, BOARD_WIDTH } from './constants';
import type { GameState } from './types';
import { useGameEngine } from './useGameEngine';

const { width } = Dimensions.get('window');

// Responsive scaling for grid
const CELL_SIZE = width < 380 ? BASE_CELL_SIZE * 0.8 : BASE_CELL_SIZE * 0.9;

// Controls
const SWIPE_THRESHOLD = 20;
const TAP_THRESHOLD = 10;
const DOUBLE_TAP_DELAY = 300;

export default function TetrisGame() {
  const {
    state,
    moveLeft,
    moveRight,
    moveDown,
    rotate,
    hardDrop,
    reset,
    togglePause
  } = useGameEngine();

  const lastTapRef = React.useRef(0);
  const lastMoveRef = React.useRef({ x: 0, y: 0 });

  const handleGesture = useCallback(
    (gestureState: PanResponderGestureState) => {
      const { dx, dy } = gestureState;

      if (Math.abs(dx) < TAP_THRESHOLD && Math.abs(dy) < TAP_THRESHOLD) {
        lastMoveRef.current = { x: 0, y: 0 };
        return;
      }

      if (Math.abs(dx - lastMoveRef.current.x) > SWIPE_THRESHOLD) {
        dx > lastMoveRef.current.x ? moveRight() : moveLeft();
        lastMoveRef.current.x = dx;
      }

      if (dy - lastMoveRef.current.y > SWIPE_THRESHOLD) {
        moveDown();
        lastMoveRef.current.y = dy;
      }
    },
    [moveLeft, moveRight, moveDown]
  );

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (_e: GestureResponderEvent) => {
        const now = Date.now();
        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          hardDrop();
          lastTapRef.current = 0;
        } else {
          lastTapRef.current = now;
        }
        lastMoveRef.current = { x: 0, y: 0 };
      },
      onPanResponderMove: (_e, gestureState) => handleGesture(gestureState),
      onPanResponderRelease: (_e, gestureState) => {
        const { dx, dy } = gestureState;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const now = Date.now();

        if (distance < TAP_THRESHOLD && now - lastTapRef.current < DOUBLE_TAP_DELAY) {
          rotate();
        }
        lastMoveRef.current = { x: 0, y: 0 };
      }
    })
  ).current;

  return (
    <View style={styles.container}>
      {/* HEADER WITH PAUSE BUTTON */}
      <View style={styles.header}>
        <Text style={styles.text}>Score: {state.score}</Text>
        <TouchableOpacity onPress={togglePause}>
          <LinearGradient
            colors={["rgba(34,139,34,1)", "rgba(50,205,50,1)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pauseButton}
          >
            <Ionicons
              name={state.isPaused ? "play" : "pause"}
              size={22}
              color="#fff"
            />
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.text}>Level: {state.level}</Text>
      </View>

      {/* GAME BOARD */}
      <View style={styles.gameBoard} {...panResponder.panHandlers}>
        <Board state={state} />
      </View>

      {/* OVERLAY */}
      {(state.isGameOver || state.isPaused) && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>
            {state.isGameOver ? 'Game Over!' : 'Paused'}
          </Text>
          <Text style={styles.overlaySubText} onPress={reset}>
            Tap to {state.isGameOver ? 'Restart' : 'Resume'}
          </Text>
        </View>
      )}
    </View>
  );
}

function Board({ state }: { state: GameState }) {
  return (
    <View style={styles.board}>
      {state.board.map((row, y) => (
        <View key={y} style={styles.row}>
          {row.map((cell, x) => {
            let color = cell;

            if (state.currentPiece) {
              const pieceY = y - state.currentPiece.position.y;
              const pieceX = x - state.currentPiece.position.x;
              if (
                pieceY >= 0 &&
                pieceY < state.currentPiece.shape.length &&
                pieceX >= 0 &&
                pieceX < state.currentPiece.shape[0].length &&
                state.currentPiece.shape[pieceY][pieceX]
              ) {
                color = state.currentPiece.color;
              }
            }

            return (
              <View
                key={x}
                style={[
                  styles.cell,
                  color ? { backgroundColor: color } : styles.emptyCell
                ]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// 🎨 Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: BOARD_WIDTH * CELL_SIZE,
    paddingVertical: 10,
    marginBottom: 10
  },
  text: {
    color: '#222',
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold'
  },
  pauseButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#228B22',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5
  },
  gameBoard: {
    width: BOARD_WIDTH * CELL_SIZE,
    height: BOARD_HEIGHT * CELL_SIZE,
    borderRadius: 1,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5
  },
  board: {
    width: '100%',
    height: '100%'
  },
  row: {
    flexDirection: 'row'
  },
  cell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderWidth: 0.5,
    borderColor: '#ddd'
  },
  emptyCell: {
    backgroundColor: '#f9f9f9'
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  overlayText: {
    color: '#222',
    fontSize: 32,
    fontFamily: 'Poppins_700Bold',
    textAlign: 'center'
  },
  overlaySubText: {
    color: '#555',
    fontSize: 18,
    marginTop: 20,
    fontFamily: 'Poppins_500Medium'
  }
});
