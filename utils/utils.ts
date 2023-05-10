export const getGameId = (idOrUrl: string) =>
  idOrUrl.split("/").map(Number).find(Boolean);
