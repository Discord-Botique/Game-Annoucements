import axios from "axios";
import { BlogItem, PostsResponse } from "./types";
import { logtail } from "@utils/logtail";
import { supabase } from "@utils/supabase";

export class FortniteApi {
  static async getNews() {
    try {
      const gameInfo = await axios.get<PostsResponse>(
        "https://www.fortnite.com/api/blog/getPosts",
        {
          params: {
            category: "",
            postsPerPage: 1,
            offset: 0,
            locale: "en-US",
            rootPageSlug: "blog",
          },
        },
      );

      return gameInfo.data.blogList[0];
    } catch (e) {
      await logtail.warn(`Error fetching game news for Fortnite`, {
        error: String(e),
      });
      return undefined;
    }
  }

  static async getSubscription({ channelId }: { channelId: string }) {
    const { data, error } = await supabase
      .from("fortnite_subscriptions")
      .select("*")
      .eq("channel_id", channelId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  static async getSubscriptions(guildId: string) {
    const { data } = await supabase
      .from("fortnite_subscriptions")
      .select("*")
      .match({
        server_id: guildId,
      })
      .order("channel_id", { ascending: true });

    return data;
  }

  static async deleteSubscription(id: number) {
    const { error } = await supabase
      .from("fortnite_subscriptions")
      .delete()
      .match({ id });
    if (error) throw new Error(error.message);
  }

  static async createSubscription({
    guildId,
    channelId,
    roleId,
  }: {
    channelId: string;
    guildId: string;
    roleId?: string;
  }) {
    const news = await this.getNews();

    const { error } = await supabase.from("fortnite_subscriptions").insert([
      {
        channel_id: channelId,
        server_id: guildId,
        role_id: roleId,
        last_announcement_id: news?._id,
      },
    ]);

    if (error) throw new Error(error.message);
  }

  static async updateGameDetails({
    id,
    blogItem,
  }: {
    id: number;
    blogItem: BlogItem;
  }) {
    await supabase
      .from("fortnite_subscriptions")
      .update({
        last_announcement_id: blogItem._id,
      })
      .eq("id", id);
  }
}
