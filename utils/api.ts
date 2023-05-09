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

export const getSteamGameName = async (gameId: number | string) => {
  const gameInfo = await axios.get<AppDetails>(
    "https://store.steampowered.com/api/appdetails",
    {
      params: {
        appids: gameId,
      },
    }
  );

  const gameData = gameInfo?.data[gameId];
  if (!gameData?.success)
    throw new Error(`Could not find the game ${gameId} in the Steam Database.`);

  return gameData.data.name;
};

export const getSteamGameNews = async (gameId: string) => {
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

  const newsItems = gameInfo.data.appnews.newsitems;
  if (!newsItems)
    throw new Error(`Could not find the game ${gameId} in the Steam Database.`);

  return newsItems[0];
};

export const getSteamSubscriptions = async (guildId: string) => {
  const { data } = await supabase
    .from("steam_subscriptions")
    .select()
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
  const { data } = await supabase
    .from("steam_subscriptions")
    .select("*")
    .eq("game_id", String(gameId))
    .eq("channel_id", channelId)
    .maybeSingle();

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
      game_id: String(gameId),
      channel_id: channelId,
      server_id: guildId,
    },
  ]);

  if (error) throw new Error(error.message);
};
