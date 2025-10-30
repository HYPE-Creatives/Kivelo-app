export const ROUTES = {
  CHILD_GAMES: '/(dashboard)/child/games',
  TETRIS: '/(dashboard)/tetris-new',
} as const;

export type AppRoute = typeof ROUTES[keyof typeof ROUTES];
