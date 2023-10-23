import axios from "axios";
import { AppNews, AppDetails, GameData } from "./types";
import { logtail } from "@utils/logtail";
import { supabase } from "@utils/supabase";

export class SteamApi {
  private gameId: number;

  constructor(gameId: number) {
    this.gameId = gameId;
  }

  async getNewsForGame() {
    try {
      const gameInfo = await axios.get<AppNews>(
        "https://api.steampowered.com/ISteamNews/GetNewsForApp/v0002",
        {
          params: {
            appid: this.gameId,
            maxlength: 500,
            count: 1,
          },
        },
      );

      return gameInfo.data.appnews.newsitems?.[0];
    } catch (e) {
      await logtail.warn(`Error fetching game news for ID ${this.gameId}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  async getGameDetails(): Promise<GameData | undefined> {
    try {
      const response = await axios.get<AppDetails>(
        "https://store.steampowered.com/api/appdetails",
        {
          params: {
            appids: this.gameId,
          },
        },
      );

      const gameData = response?.data[this.gameId];

      if (gameData?.success) {
        await this.updateGameDetails(gameData.data);
        return gameData.data;
      }

      return undefined;
    } catch (e) {
      await logtail.error(`Error fetching game name for ID ${this.gameId}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  private async updateGameDetails(gameData: GameData) {
    const latestNews = await this.getNewsForGame();

    await supabase.from("steam_games").upsert([
      {
        name: gameData.name,
        id: gameData.steam_appid,
        updated_at: new Date().toISOString(),
        last_announcement_id: latestNews?.gid,
      },
    ]);
  }

  async getSubscription({ channelId }: { channelId: string }) {
    const { data, error } = await supabase
      .from("steam_subscriptions")
      .select("*, steam_games(*)")
      .eq("game_id", String(this.gameId))
      .eq("channel_id", channelId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getSubscriptions(guildId: string) {
    const { data } = await supabase
      .from("steam_subscriptions")
      .select("*, steam_games(name, last_announcement_id)")
      .match({
        server_id: guildId,
      })
      .order("channel_id", { ascending: true });

    return data;
  }

  static async deleteSubscription(id: number) {
    const { error } = await supabase
      .from("steam_subscriptions")
      .delete()
      .match({ id });
    if (error) throw new Error(error.message);
  }

  async createSubscription({
    guildId,
    channelId,
    roleId,
  }: {
    channelId: string;
    guildId: string;
    roleId?: string;
  }) {
    const { error } = await supabase.from("steam_subscriptions").insert([
      {
        game_id: this.gameId,
        channel_id: channelId,
        server_id: guildId,
        role_id: roleId,
      },
    ]);

    if (error) throw new Error(error.message);
  }
}
