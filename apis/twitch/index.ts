import axios, { create, AxiosInstance } from "axios";
import { logtail } from "@utils/logtail";
import {
  OauthResponse,
  TwitchUser,
  TwitchSubscription,
  TwitchSubscriptionResponse,
  StreamResponse,
  TwitchStream,
} from "./types";
import { supabase } from "@utils/supabase";
import { ChatInputCommandInteraction } from "discord.js";

export class TwitchApi {
  private axios: AxiosInstance = create();
  private ready = false;
  user: TwitchUser | undefined;
  private interaction: ChatInputCommandInteraction;

  constructor(interaction: ChatInputCommandInteraction) {
    this.interaction = interaction;
    TwitchApi.authorize()
      .then(async (axiosInstance) => {
        this.axios = axiosInstance;
        const username = interaction.options.getString("username");
        if (username) this.user = await this.findUser(username);
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

  // https://dev.twitch.tv/docs/api/reference/#get-streams
  static async getStream(userId: string): Promise<TwitchStream | undefined> {
    try {
      const api = await TwitchApi.authorize();
      const response = await api.get<StreamResponse>("/streams", {
        params: {
          user_id: userId,
          type: "live",
        },
      });

      return response.data.data[0];
    } catch (e) {
      await logtail.error(`Error finding Twitch stream for user ${userId}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  // https://dev.twitch.tv/docs/api/reference/#get-users
  private async findUser(username: string): Promise<TwitchUser | undefined> {
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

  async getAllSubscriptions() {
    const { data } = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({
        server_id: this.interaction.guildId,
      })
      .order("channel_id", { ascending: true });

    return data;
  }

  async getSubscription() {
    if (!this.user) throw new Error("User not found");
    const data = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({ channel_id: this.interaction.channelId, user_id: this.user.id })
      .maybeSingle();

    return data.data;
  }

  async createSubscription() {
    if (!this.user || !this.interaction.guildId)
      throw new Error("User or Guild not found");
    const twitchSubscription = await this.getTwitchSubscription();
    let subscription_id: string;

    if (!twitchSubscription) {
      const twitchSubscription = await this.createTwitchSubscription();
      if (!twitchSubscription) throw new Error("Could not create subscription");
      subscription_id = twitchSubscription.id;
    } else {
      subscription_id = twitchSubscription.id;
    }

    const { error } = await supabase.from("twitch_subscriptions").insert({
      server_id: this.interaction.guildId,
      channel_id: this.interaction.channelId,
      role_id: this.interaction.options.getRole("role-mention")?.id,
      subscription_id,
      user_id: this.user.id,
    });

    if (error) throw new Error(error.message);
  }

  async deleteSubscription() {
    if (!this.user) throw new Error("User not found");
    const { error } = await supabase
      .from("twitch_subscriptions")
      .delete()
      .match({ channel_id: this.interaction.channelId, user_id: this.user.id });

    if (error) throw new Error(error.message);

    const remainingSubscriptions = await supabase
      .from("twitch_subscriptions")
      .select()
      .match({ user_id: this.user.id });

    // if there are still subscriptions for that user, we shouldn't delete the twitch webhook
    if (remainingSubscriptions.data?.length) return;

    const twitchSubscription = await this.getTwitchSubscription();
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
}
