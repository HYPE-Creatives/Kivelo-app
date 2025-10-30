import { useMemo } from "react";
import { GAMES, RECENT } from "./data";
import type { Game } from "./types";

export function useGames() {
  const games: Game[] = useMemo(() => GAMES, []);
  const recent = useMemo(() => RECENT, []);
  return { games, recent };
}
