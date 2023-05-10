import axios from "axios";
import { supabase } from "./supabase";

interface AppDetails {
  [key: string]:
    | {
        success: true;
        data: {
          name: string;
        };
      }
    | { success: false }
    | undefined;
}

export interface NewsItem {
  gid: string;
  title: string;
  url: string;
  is_external_url: true;
  author: "erics";
  contents: string;
  feedlabel: string;
  date: number;
  feedname: string;
  appid: number;
  tags: string[];
}

export interface AppNews {
  appnews: {
    appid?: number;
    newsitems?: NewsItem[];
    count?: number;
  };
}

export const getSteamGameName = async (
  gameId: number
): Promise<string | undefined> => {
  const { data } = await supabase
    .from("steam_games")
    .select("name, updated_at")
    .eq("id", gameId)
    .maybeSingle();

  if (data && new Date(data.updated_at).getTime() > Date.now() - 2592000000)
    return data.name;

  const gameInfo = await axios.get<AppDetails>(
    "https://store.steampowered.com/api/appdetails",
    {
      params: {
        appids: gameId,
      },
    }
  );

  const gameData = gameInfo?.data[gameId];

  if (gameData?.success) {
    await supabase.from("steam_games").upsert([
      {
        name: gameData.data.name,
        id: gameId,
        updated_at: new Date().toISOString(),
      },
    ]);

    return gameData.data.name;
  }

  return undefined;
};

export const getSteamGameNews = async (gameId: number) => {
  const gameInfo = await axios.get<AppNews>(
    "http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002",
    {
      params: {
        appid: gameId,
        maxlength: 500,
        count: 1,
      },
    }
  );

  return gameInfo.data.appnews.newsitems?.[0];
};

export const getSteamSubscriptions = async (guildId: string) => {
  const { data } = await supabase
    .from("steam_subscriptions")
    .select("*, steam_games(name)")
    .match({
      server_id: guildId,
    })
    .order("channel_id", { ascending: true });

  return data;
};

export const getSteamSubscription = async ({
  gameId,
  channelId,
}: {
  gameId: number;
  channelId: string;
}) => {
  const { data, error } = await supabase
    .from("steam_subscriptions")
    .select("*, steam_games(*)")
    .eq("game_id", String(gameId))
    .eq("channel_id", channelId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteSteamSubscription = async (id: number) => {
  const { error } = await supabase
    .from("steam_subscriptions")
    .delete()
    .match({ id });
  if (error) throw new Error(error.message);
};

export const createSteamSubscription = async ({
  gameId,
  guildId,
  channelId,
}: {
  gameId: number;
  channelId: string;
  guildId: string;
}) => {
  const { error } = await supabase.from("steam_subscriptions").insert([
    {
      game_id: gameId,
      channel_id: channelId,
      server_id: guildId,
    },
  ]);

  if (error) throw new Error(error.message);
};
