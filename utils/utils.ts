export const getGameId = (idOrUrl: string) => {
  const gameId = idOrUrl.split("/").map(Number).find(Boolean);

  if (!gameId)
    throw new Error(`Could not find a game ID in the provided URL: ${idOrUrl}`);
  return gameId;
};
