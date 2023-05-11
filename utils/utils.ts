export const parseGameId = (idOrUrl: string) =>
  idOrUrl.split("/").map(Number).find(Boolean);

interface SteamGame {
  name: string;
  last_announcement_id: string | null;
}

const isArray = (value: SteamGame | SteamGame[]): value is SteamGame[] =>
  Boolean(value && typeof value === "object" && value.constructor === Array);

export const getGameData = (value: SteamGame | SteamGame[]) =>
  isArray(value) ? value[0] : value;
