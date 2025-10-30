import type { Game } from "./types";

export const GAMES: Game[] = [
  { title: "Tetris", image: "https://via.placeholder.com/300x200", route: "/(dashboard)/tetris-new" },
  { title: "Spelling Challenge", image: "https://via.placeholder.com/300x200" },
  { title: "Math Quiz", image: "https://via.placeholder.com/300x200" },
  { title: "Animal Puzzle", image: "https://via.placeholder.com/300x200" },
  { title: "Memory Match", image: "https://via.placeholder.com/300x200" },
  { title: "Drawing Fun", image: "https://via.placeholder.com/300x200" },
  { title: "Word Hunt", image: "https://via.placeholder.com/300x200" },
  { title: "Logic Builder", image: "https://via.placeholder.com/300x200" },
];

export const RECENT: Array<Game & { subtitle?: string; bg?: string }> = [
  { title: "Tetris", subtitle: "Stack and clear lines", bg: "#dbe4ff", route: "/(dashboard)/tetris-new", image: "https://via.placeholder.com/300x200" },
  { title: "Spelling Challenge", subtitle: "Play and get rewarded", bg: "#e6f3ff", image: "https://via.placeholder.com/300x200" },
  { title: "Math Quiz", subtitle: "Sharpen your skills", bg: "#ffe6cc", image: "https://via.placeholder.com/300x200" },
];
