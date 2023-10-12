import { create, AxiosInstance } from "axios";
import { logtail } from "@utils/logtail";
import {
  OauthResponse,
  TwitchUser,
  TwitchSubscription,
  TwitchSubscriptionResponse,
} from "./types";
import { supabase } from "@utils/supabase";

export class TwitchApi {
  private axios: AxiosInstance = create();
  private ready = false;
  user: TwitchUser | undefined;

  constructor(username?: string) {
    this.authorize()
      .then(async (data) => {
        this.axios = create({
          baseURL: "https://api.twitch.tv/helix",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Client-Id": process.env.TWITCH_CLIENT_ID,
          },
        });
        if (username) this.user = await this.findUser(username);
        this.ready = true;
      })
      .catch((e) =>
        logtail.error(`Error authorizing Twitch`, {
          error: String(e),
        }),
      );
  }

  async isReady(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      let count = 0;
      const check = () => {
        count += 1;
        if (this.ready) return resolve(true);
        if (count > 40) return reject("Twitch API never became ready");
        setTimeout(check, 50);
      };
      check();
    });
  }

  // https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow
  private async authorize(): Promise<OauthResponse> {
    const response = await this.axios.post<OauthResponse>(
      "https://id.twitch.tv/oauth2/token",
      undefined,
      {
        params: {
          client_id: process.env.TWITCH_CLIENT_ID,
          client_secret: process.env.TWITCH_CLIENT_SECRET,
          grant_type: "client_credentials",
        },
      },
    );

    return response.data;
  }

  // https://dev.twitch.tv/docs/api/reference/#get-users
  async findUser(username: string): Promise<TwitchUser | undefined> {
    try {
      const response = await this.axios.get<{
        data: TwitchUser[];
      }>("/users", {
        params: {
          login: username,
        },
      });

      return response.data.data[0];
    } catch (e) {
      await logtail.error(`Error finding Twitch user ${username}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  async findUsers(ids: string[]): Promise<TwitchUser[]> {
    try {
      const params = ids.map((username) => `id=${username}`);

      const response = await this.axios.get<{
        data: TwitchUser[];
      }>(`/users?${params.join("&")}`);

      return response.data.data;
    } catch (e) {
      await logtail.error(`Error finding Twitch users ${ids.join(", ")}`, {
        error: String(e),
      });
      return [];
    }
  }

  // https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions
  async getTwitchSubscription(): Promise<TwitchSubscription | undefined> {
    if (!this.user) throw new Error("User not found");
    try {
      const response = await this.axios.get<TwitchSubscriptionResponse>(
        "/eventsub/subscriptions",
        {
          params: {
            user_id: this.user.id,
          },
        },
      );

      return response.data.data[0];
    } catch (e) {
      await logtail.error(
        `Error getting subscriptions for user ${this.user.id}`,
        {
          error: String(e),
        },
      );
      return undefined;
    }
  }

  // https://api.twitch.tv/helix/eventsub/subscriptions
  async createTwitchSubscription() {
    if (!this.user) throw new Error("User not found");
    try {
      const data = await this.axios.post<TwitchSubscriptionResponse>(
        "/eventsub/subscriptions",
        {
          type: "stream.online",
          version: "1",
          condition: {
            broadcaster_user_id: this.user.id,
          },
          transport: {
            method: "webhook",
            callback: process.env.WEBHOOK_URL,
            secret: process.env.TWITCH_SUBSCRIPTION_SECRET,
          },
        },
      );

      return data.data.data[0];
    } catch (e) {
      await logtail.error(
        `Error creating subscription for user ${this.user.id}`,
        {
          error: String(e),
        },
      );
      return undefined;
    }
  }

  async deleteSubscription(subscriptionId: string) {
    try {
      await this.axios.delete("/eventsub/subscriptions", {
        params: {
          id: subscriptionId,
        },
      });
    } catch (e) {
      await logtail.error(`Error deleting subscription ${subscriptionId}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  static async getAllSubscriptions(guildId: string) {
    const { data } = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({
        server_id: guildId,
      })
      .order("channel_id", { ascending: true });

    return data;
  }

  async getSubscription(channel_id: string) {
    if (!this.user) throw new Error("User not found");
    const data = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({ channel_id, user_id: this.user.id })
      .maybeSingle();

    return data.data;
  }

  async createSubscription(data: {
    server_id: string;
    channel_id: string;
    role_id?: string;
  }) {
    if (!this.user) throw new Error("User not found");
    const twitchSubscription = await this.getTwitchSubscription();
    let subscription_id: string;

    if (!twitchSubscription) {
      const twitchSubscription = await this.createTwitchSubscription();
      if (!twitchSubscription) throw new Error("Could not create subscription");
      subscription_id = twitchSubscription.id;
    } else {
      subscription_id = twitchSubscription.id;
    }

    const { error } = await supabase
      .from("twitch_subscriptions")
      .insert({ ...data, subscription_id, user_id: this.user.id });

    if (error) throw new Error(error.message);
  }

  async removeSubscription(channel_id: string) {
    if (!this.user) throw new Error("User not found");
    const { error } = await supabase
      .from("twitch_subscriptions")
      .delete()
      .match({ channel_id, user_id: this.user.id });

    if (error) throw new Error(error.message);

    const remainingSubscriptions = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({ user_id: this.user.id });

    // if there are still subscriptions for that user, we shouldn't delete the twitch webhook
    if (remainingSubscriptions.data?.length) return;

    const twitchSubscription = await this.getTwitchSubscription();
    if (!twitchSubscription) return;
    await this.deleteSubscription(twitchSubscription.id);
  }
}
