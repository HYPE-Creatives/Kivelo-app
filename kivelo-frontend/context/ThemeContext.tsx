// context/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColorScheme, Appearance } from "react-native";

const THEME_STORAGE_KEY = "kivelo_theme_settings";

// Theme mode types
export type ThemeMode = "light" | "dark" | "auto";

// Color themes (lovely themes to choose from)
export type ColorTheme = 
  | "default"      // Green (current)
  | "ocean"        // Blue
  | "sunset"       // Orange/Pink
  | "lavender"     // Purple
  | "rose"         // Pink
  | "forest"       // Dark Green
  | "candy"        // Bright Pink/Cyan
  | "midnight";    // Dark Blue

// Theme colors configuration
export const THEME_COLORS: Record<ColorTheme, {
  name: string;
  emoji: string;
  primary: string;
  secondary: string;
  gradient: [string, string];
  accent: string;
}> = {
  default: {
    name: "Garden Green",
    emoji: "🌿",
    primary: "#16A34A",
    secondary: "#22C55E",
    gradient: ["#16A34A", "#15803D"],
    accent: "#86EFAC",
  },
  ocean: {
    name: "Ocean Blue",
    emoji: "🌊",
    primary: "#0EA5E9",
    secondary: "#38BDF8",
    gradient: ["#0EA5E9", "#0284C7"],
    accent: "#7DD3FC",
  },
  sunset: {
    name: "Sunset Glow",
    emoji: "🌅",
    primary: "#F97316",
    secondary: "#FB923C",
    gradient: ["#F97316", "#EA580C"],
    accent: "#FDBA74",
  },
  lavender: {
    name: "Lavender Dream",
    emoji: "💜",
    primary: "#8B5CF6",
    secondary: "#A78BFA",
    gradient: ["#8B5CF6", "#7C3AED"],
    accent: "#C4B5FD",
  },
  rose: {
    name: "Rose Garden",
    emoji: "🌹",
    primary: "#EC4899",
    secondary: "#F472B6",
    gradient: ["#EC4899", "#DB2777"],
    accent: "#F9A8D4",
  },
  forest: {
    name: "Deep Forest",
    emoji: "🌲",
    primary: "#059669",
    secondary: "#10B981",
    gradient: ["#059669", "#047857"],
    accent: "#6EE7B7",
  },
  candy: {
    name: "Candy Pop",
    emoji: "🍭",
    primary: "#E879F9",
    secondary: "#22D3EE",
    gradient: ["#E879F9", "#A855F7"],
    accent: "#67E8F9",
  },
  midnight: {
    name: "Midnight Sky",
    emoji: "🌙",
    primary: "#6366F1",
    secondary: "#818CF8",
    gradient: ["#6366F1", "#4F46E5"],
    accent: "#A5B4FC",
  },
};

// Light and dark mode colors
export const MODE_COLORS = {
  light: {
    background: "#FFFFFF",
    surface: "#F9FAFB",
    card: "#FFFFFF",
    text: "#1F2937",
    textSecondary: "#6B7280",
    border: "#E5E7EB",
    statusBar: "dark",
  },
  dark: {
    background: "#111827",
    surface: "#1F2937",
    card: "#374151",
    text: "#F9FAFB",
    textSecondary: "#9CA3AF",
    border: "#374151",
    statusBar: "light",
  },
};

export interface ThemeSettings {
  mode: ThemeMode;
  colorTheme: ColorTheme;
}

interface ThemeContextType {
  mode: ThemeMode;
  colorTheme: ColorTheme;
  isDark: boolean;
  colors: typeof MODE_COLORS.light;
  themeColors: typeof THEME_COLORS.default;
  setMode: (mode: ThemeMode) => Promise<void>;
  setColorTheme: (theme: ColorTheme) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const DEFAULT_SETTINGS: ThemeSettings = {
  mode: "auto",
  colorTheme: "default",
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("auto");
  const [colorTheme, setColorThemeState] = useState<ColorTheme>("default");
  const [isLoaded, setIsLoaded] = useState(false);

  // Determine if dark mode is active
  const isDark = mode === "auto" 
    ? systemColorScheme === "dark"
    : mode === "dark";

  // Get current mode colors
  const colors = isDark ? MODE_COLORS.dark : MODE_COLORS.light;
  
  // Get current theme colors
  const themeColors = THEME_COLORS[colorTheme];

  // Load saved settings on mount
  useEffect(() => {
    loadSettings();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      // This will trigger a re-render if mode is "auto"
    });
    return () => subscription.remove();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (saved) {
        const settings: ThemeSettings = JSON.parse(saved);
        setModeState(settings.mode || "auto");
        setColorThemeState(settings.colorTheme || "default");
      }
    } catch (error) {
      console.error("Failed to load theme settings:", error);
    } finally {
      setIsLoaded(true);
    }
  };

  const saveSettings = async (settings: ThemeSettings) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save theme settings:", error);
    }
  };

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    await saveSettings({ mode: newMode, colorTheme });
  }, [colorTheme]);

  const setColorTheme = useCallback(async (newTheme: ColorTheme) => {
    setColorThemeState(newTheme);
    await saveSettings({ mode, colorTheme: newTheme });
  }, [mode]);

  const resetToDefaults = useCallback(async () => {
    setModeState(DEFAULT_SETTINGS.mode);
    setColorThemeState(DEFAULT_SETTINGS.colorTheme);
    await saveSettings(DEFAULT_SETTINGS);
  }, []);

  const value: ThemeContextType = {
    mode,
    colorTheme,
    isDark,
    colors,
    themeColors,
    setMode,
    setColorTheme,
    resetToDefaults,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeContext;
