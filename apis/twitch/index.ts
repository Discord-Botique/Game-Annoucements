import axios, { create, AxiosInstance } from "axios";
import { logtail } from "@utils/logtail";
import {
  OauthResponse,
  StreamResponse,
  TwitchSubscription,
  TwitchSubscriptionResponse,
  TwitchUser,
} from "./types";
import { supabase } from "@utils/supabase";

export class TwitchApi {
  private axios: AxiosInstance = create();
  private ready = false;

  constructor() {
    TwitchApi.authorize()
      .then((axiosInstance) => {
        this.axios = axiosInstance;
        this.ready = true;
      })
      .catch((e) =>
        logtail.error(`Error authorizing Twitch`, {
          error: String(e),
        }),
      );
  }

  // https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow
  static async authorize(): Promise<AxiosInstance> {
    const response = await axios.post<OauthResponse>(
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

    return create({
      baseURL: "https://api.twitch.tv/helix",
      headers: {
        Authorization: `Bearer ${response.data.access_token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });
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
  async getTwitchSubscription(
    user_id: string,
  ): Promise<TwitchSubscription | undefined> {
    try {
      const response = await this.axios.get<TwitchSubscriptionResponse>(
        "/eventsub/subscriptions",
        {
          params: { user_id },
        },
      );

      return response.data.data[0];
    } catch (e) {
      await logtail.error(`Error getting subscriptions for user ${user_id}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  // https://api.twitch.tv/helix/eventsub/subscriptions
  async createTwitchSubscription(broadcaster_user_id: string) {
    try {
      const data = await this.axios.post<TwitchSubscriptionResponse>(
        "/eventsub/subscriptions",
        {
          type: "stream.online",
          version: "1",
          condition: {
            broadcaster_user_id,
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
        `Error creating subscription for user ${broadcaster_user_id}`,
        {
          error: String(e),
        },
      );
      return undefined;
    }
  }

  async getAllSubscriptions(server_id: string) {
    const { data } = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({ server_id })
      .order("channel_id", { ascending: true });

    return data;
  }

  async getSubscription(params: { channel_id?: string; user_id: string }) {
    const data = await supabase
      .from("twitch_subscriptions")
      .select()
      .match(params)
      .maybeSingle();

    return data.data;
  }

  async createSubscription({
    server_id,
    channel_id,
    user_id,
    role_id,
  }: {
    server_id: string;
    channel_id: string;
    user_id: string;
    role_id?: string;
  }) {
    const twitchSubscription = await this.getTwitchSubscription(user_id);
    let subscription_id: string;

    if (!twitchSubscription) {
      const twitchSubscription = await this.createTwitchSubscription(user_id);
      if (!twitchSubscription) throw new Error("Could not create subscription");
      subscription_id = twitchSubscription.id;
    } else {
      subscription_id = twitchSubscription.id;
    }

    const { error } = await supabase.from("twitch_subscriptions").insert({
      server_id,
      channel_id,
      role_id,
      subscription_id,
      user_id,
    });

    if (error) throw new Error(error.message);
  }

  async deleteSubscription(channel_id: string, user_id: string) {
    const { error } = await supabase
      .from("twitch_subscriptions")
      .delete()
      .match({ channel_id, user_id });

    if (error) throw new Error(error.message);

    const remainingSubscriptions = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({ user_id });

    // if there are still subscriptions for that user, we shouldn't delete the twitch webhook
    if (remainingSubscriptions.data?.length) return;

    const twitchSubscription = await this.getTwitchSubscription(user_id);
    if (!twitchSubscription) return;
    await this.deleteTwitchSubscription(twitchSubscription.id);
  }

  private async deleteTwitchSubscription(subscriptionId: string) {
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

  async getLiveStream(user_id: string) {
    const streamParams = new URLSearchParams({
      user_id,
      type: "live",
    });

    // https://dev.twitch.tv/docs/api/reference/#get-streams
    const streams = await this.axios.get<StreamResponse | undefined>(
      `https://api.twitch.tv/helix/streams?${streamParams.toString()}`,
      {},
    );

    return streams.data?.data[0];
  }
}
