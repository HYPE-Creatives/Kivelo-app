// components/DrawingBoard.tsx
import React, { useRef, useState, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
  ScrollView,
  PanResponder,
  GestureResponderEvent,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Color palette for kids
const COLORS = [
  "#1F2937", // Black
  "#EF4444", // Red
  "#F97316", // Orange
  "#F59E0B", // Amber
  "#FBBF24", // Yellow
  "#84CC16", // Lime
  "#22C55E", // Green
  "#14B8A6", // Teal
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#6366F1", // Indigo
  "#8B5CF6", // Violet
  "#A855F7", // Purple
  "#D946EF", // Fuchsia
  "#EC4899", // Pink
  "#F472B6", // Light Pink
  "#FFFFFF", // White (eraser effect on colored bg)
];

const BRUSH_SIZES = [
  { size: 4, label: "S" },
  { size: 8, label: "M" },
  { size: 14, label: "L" },
  { size: 22, label: "XL" },
];

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  size: number;
}

interface DrawingBoardProps {
  onSave?: (imageData: string) => void;
  onClose?: () => void;
  initialImage?: string;
  backgroundColor?: string;
  canvasHeight?: number;
}

// Web Canvas Component
const WebCanvas = ({
  strokes,
  currentStroke,
  backgroundColor,
  canvasRef,
  width,
  height,
}: {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  backgroundColor: string;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  width: number;
  height: number;
}) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear and fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Draw all strokes
    const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  }, [strokes, currentStroke, backgroundColor, width, height]);

  return (
    <canvas
      ref={canvasRef as any}
      width={width}
      height={height}
      style={{
        width,
        height,
        touchAction: "none",
        cursor: "crosshair",
      }}
    />
  );
};

// Mobile Canvas using react-native-svg
const MobileCanvas = ({
  strokes,
  currentStroke,
  backgroundColor,
  width,
  height,
  onStart,
  onMove,
  onEnd,
}: {
  strokes: Stroke[];
  currentStroke: Stroke | null;
  backgroundColor: string;
  width: number;
  height: number;
  onStart: (x: number, y: number) => void;
  onMove: (x: number, y: number) => void;
  onEnd: () => void;
}) => {
  const allStrokes = currentStroke ? [...strokes, currentStroke] : strokes;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        onStart(locationX, locationY);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        onMove(locationX, locationY);
      },
      onPanResponderRelease: () => {
        onEnd();
      },
      onPanResponderTerminate: () => {
        onEnd();
      },
    })
  ).current;

  // Convert points to SVG path string
  const pointsToPath = (points: Point[]): string => {
    if (points.length < 1) return "";
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      path += ` L ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  return (
    <View
      style={{ width, height, backgroundColor }}
      {...panResponder.panHandlers}
    >
      <Svg width={width} height={height} style={{ position: "absolute" }}>
        <Rect x={0} y={0} width={width} height={height} fill={backgroundColor} />
        {allStrokes.map((stroke, strokeIndex) => {
          if (stroke.points.length < 1) return null;
          const pathData = pointsToPath(stroke.points);
          return (
            <Path
              key={strokeIndex}
              d={pathData}
              stroke={stroke.color}
              strokeWidth={stroke.size}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          );
        })}
      </Svg>
    </View>
  );
};

export default function DrawingBoard({
  onSave,
  onClose,
  initialImage,
  backgroundColor = "#FFFFFF",
  canvasHeight,
}: DrawingBoardProps) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1].size);
  const [undoStack, setUndoStack] = useState<Stroke[][]>([]);
  const [bgColor, setBgColor] = useState(backgroundColor);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<View>(null);

  const canvasWidth = Math.min(SCREEN_WIDTH - 32, 500);
  const finalCanvasHeight = canvasHeight || Math.min(canvasWidth * 0.75, 400);

  const isWeb = Platform.OS === "web";

  // Start drawing (with direct x, y for mobile)
  const handleStartMobile = useCallback(
    (x: number, y: number) => {
      setCurrentStroke({
        points: [{ x, y }],
        color: selectedColor,
        size: brushSize,
      });
    },
    [selectedColor, brushSize]
  );

  // Continue drawing (with direct x, y for mobile)
  const handleMoveMobile = useCallback(
    (x: number, y: number) => {
      setCurrentStroke((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, { x, y }],
        };
      });
    },
    []
  );

  // Get position from event (for web)
  const getPosition = useCallback(
    (event: any): Point | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const clientX = event.clientX ?? event.touches?.[0]?.clientX;
      const clientY = event.clientY ?? event.touches?.[0]?.clientY;
      if (clientX === undefined || clientY === undefined) return null;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  // Start drawing (for web)
  const handleStart = useCallback(
    (event: any) => {
      const pos = getPosition(event);
      if (!pos) return;

      setCurrentStroke({
        points: [pos],
        color: selectedColor,
        size: brushSize,
      });
    },
    [getPosition, selectedColor, brushSize]
  );

  // Continue drawing (for web)
  const handleMove = useCallback(
    (event: any) => {
      if (!currentStroke) return;
      const pos = getPosition(event);
      if (!pos) return;

      setCurrentStroke((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          points: [...prev.points, pos],
        };
      });
    },
    [currentStroke, getPosition]
  );

  // End drawing
  const handleEnd = useCallback(() => {
    if (currentStroke && currentStroke.points.length > 0) {
      setUndoStack((prev) => [...prev, strokes]);
      setStrokes((prev) => [...prev, currentStroke]);
    }
    setCurrentStroke(null);
  }, [currentStroke, strokes]);

  // Undo last stroke
  const handleUndo = useCallback(() => {
    if (undoStack.length > 0) {
      const previousStrokes = undoStack[undoStack.length - 1];
      setStrokes(previousStrokes);
      setUndoStack((prev) => prev.slice(0, -1));
    } else if (strokes.length > 0) {
      setStrokes((prev) => prev.slice(0, -1));
    }
  }, [undoStack, strokes]);

  // Clear canvas
  const handleClear = useCallback(() => {
    if (strokes.length > 0) {
      setUndoStack((prev) => [...prev, strokes]);
    }
    setStrokes([]);
    setCurrentStroke(null);
  }, [strokes]);

  // Save drawing as base64
  const handleSave = useCallback(async () => {
    if (isWeb && canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      onSave?.(dataUrl);
    } else {
      // For mobile, we'll create a simple SVG data URL
      const svgContent = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${finalCanvasHeight}">
          <rect width="100%" height="100%" fill="${bgColor}"/>
          ${strokes
            .map((stroke) => {
              if (stroke.points.length < 2) return "";
              const pathData = stroke.points
                .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
                .join(" ");
              return `<path d="${pathData}" stroke="${stroke.color}" stroke-width="${stroke.size}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
            })
            .join("")}
        </svg>
      `;
      const base64 = btoa(svgContent);
      const dataUrl = `data:image/svg+xml;base64,${base64}`;
      onSave?.(dataUrl);
    }
  }, [isWeb, strokes, bgColor, canvasWidth, finalCanvasHeight, onSave]);

  // Web event handlers
  const webHandlers = isWeb
    ? {
        onMouseDown: handleStart,
        onMouseMove: handleMove,
        onMouseUp: handleEnd,
        onMouseLeave: handleEnd,
        onTouchStart: handleStart,
        onTouchMove: handleMove,
        onTouchEnd: handleEnd,
      }
    : {};

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(300)} style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.title}>🎨 Let's Draw!</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <LinearGradient
            colors={["#10B981", "#059669"]}
            style={styles.saveGradient}
          >
            <Ionicons name="checkmark" size={20} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Canvas */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(400)}
        style={styles.canvasContainer}
      >
        <View
          ref={containerRef}
          style={[
            styles.canvas,
            { width: canvasWidth, height: finalCanvasHeight },
          ]}
        >
          {isWeb ? (
            <div {...webHandlers} style={{ touchAction: "none" }}>
              <WebCanvas
                strokes={strokes}
                currentStroke={currentStroke}
                backgroundColor={bgColor}
                canvasRef={canvasRef}
                width={canvasWidth}
                height={finalCanvasHeight}
              />
            </div>
          ) : (
            <MobileCanvas
              strokes={strokes}
              currentStroke={currentStroke}
              backgroundColor={bgColor}
              width={canvasWidth}
              height={finalCanvasHeight}
              onStart={handleStartMobile}
              onMove={handleMoveMobile}
              onEnd={handleEnd}
            />
          )}
        </View>
      </Animated.View>

      {/* Toolbar */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(400)}
        style={styles.toolbar}
      >
        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionButton, strokes.length === 0 && styles.actionButtonDisabled]}
            onPress={handleUndo}
            disabled={strokes.length === 0}
          >
            <Ionicons name="arrow-undo" size={22} color={strokes.length === 0 ? "#D1D5DB" : "#6B7280"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, strokes.length === 0 && styles.actionButtonDisabled]}
            onPress={handleClear}
            disabled={strokes.length === 0}
          >
            <Ionicons name="trash-outline" size={22} color={strokes.length === 0 ? "#D1D5DB" : "#EF4444"} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, showBgPicker && styles.actionButtonActive]}
            onPress={() => {
              setShowBgPicker(!showBgPicker);
              setShowColorPicker(false);
            }}
          >
            <View style={[styles.bgPreview, { backgroundColor: bgColor }]} />
            <Text style={styles.actionLabel}>BG</Text>
          </TouchableOpacity>
        </View>

        {/* Brush Size */}
        <View style={styles.brushRow}>
          <Text style={styles.sectionLabel}>Brush</Text>
          <View style={styles.brushSizes}>
            {BRUSH_SIZES.map((brush) => (
              <TouchableOpacity
                key={brush.size}
                style={[
                  styles.brushOption,
                  brushSize === brush.size && styles.brushOptionActive,
                ]}
                onPress={() => setBrushSize(brush.size)}
              >
                <View
                  style={[
                    styles.brushDot,
                    {
                      width: brush.size,
                      height: brush.size,
                      backgroundColor: brushSize === brush.size ? selectedColor : "#9CA3AF",
                    },
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Color Picker Toggle */}
        <TouchableOpacity
          style={styles.colorToggle}
          onPress={() => {
            setShowColorPicker(!showColorPicker);
            setShowBgPicker(false);
          }}
        >
          <View style={[styles.currentColor, { backgroundColor: selectedColor }]} />
          <Text style={styles.colorToggleText}>
            {showColorPicker ? "Hide Colors" : "Pick Color"}
          </Text>
          <Ionicons
            name={showColorPicker ? "chevron-up" : "chevron-down"}
            size={16}
            color="#6B7280"
          />
        </TouchableOpacity>

        {/* Color Palette */}
        {showColorPicker && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.colorPalette}>
            {COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  selectedColor === color && styles.colorOptionSelected,
                  color === "#FFFFFF" && styles.colorOptionWhite,
                ]}
                onPress={() => setSelectedColor(color)}
              >
                {selectedColor === color && (
                  <Ionicons
                    name="checkmark"
                    size={16}
                    color={color === "#FFFFFF" || color === "#FBBF24" ? "#1F2937" : "#fff"}
                  />
                )}
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Background Color Picker */}
        {showBgPicker && (
          <Animated.View entering={FadeIn.duration(200)} style={styles.colorPalette}>
            <Text style={styles.bgPickerLabel}>Canvas Background</Text>
            <View style={styles.bgColors}>
              {["#FFFFFF", "#FEF3C7", "#DBEAFE", "#FCE7F3", "#D1FAE5", "#F3E8FF", "#1F2937"].map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.bgColorOption,
                    { backgroundColor: color },
                    bgColor === color && styles.bgColorSelected,
                  ]}
                  onPress={() => setBgColor(color)}
                >
                  {bgColor === color && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={color === "#1F2937" ? "#fff" : "#1F2937"}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  saveButton: {
    borderRadius: 20,
    overflow: "hidden",
  },
  saveGradient: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  canvasContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  canvas: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  toolbar: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  actionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonActive: {
    backgroundColor: "#E0E7FF",
  },
  bgPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#D1D5DB",
  },
  actionLabel: {
    fontSize: 8,
    color: "#6B7280",
    marginTop: 2,
  },
  brushRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  brushSizes: {
    flexDirection: "row",
    gap: 8,
  },
  brushOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  brushOptionActive: {
    borderColor: "#667EEA",
    backgroundColor: "#EEF2FF",
  },
  brushDot: {
    borderRadius: 50,
  },
  colorToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    gap: 8,
  },
  currentColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  colorToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  colorPalette: {
    marginTop: 12,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorOptionSelected: {
    borderColor: "#1F2937",
    transform: [{ scale: 1.1 }],
  },
  colorOptionWhite: {
    borderColor: "#E5E7EB",
  },
  bgPickerLabel: {
    width: "100%",
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
  },
  bgColors: {
    flexDirection: "row",
    gap: 12,
  },
  bgColorOption: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  bgColorSelected: {
    borderColor: "#667EEA",
    borderWidth: 3,
  },
});
