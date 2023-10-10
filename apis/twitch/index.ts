import { create, AxiosInstance } from "axios";
import { logtail } from "@utils/logtail";
import {
  OauthResponse,
  TwitchUser,
  TwitchSubscription,
  TwitchSubscriptionResponse,
} from "./types";

export class TwitchApi {
  private axios: AxiosInstance = create();
  private ready = false;

  constructor() {
    this.authorize()
      .then((data) => {
        this.axios = create({
          baseURL: "https://api.twitch.tv/helix",
          headers: {
            Authorization: `Bearer ${data.access_token}`,
            "Client-Id": process.env.TWITCH_CLIENT_ID,
          },
        });
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
  async getSubscription(
    userId: string,
  ): Promise<TwitchSubscription | undefined> {
    try {
      const response = await this.axios.get<TwitchSubscriptionResponse>(
        "/eventsub/subscriptions",
        {
          params: {
            user_id: userId,
          },
        },
      );

      return response.data.data[0];
    } catch (e) {
      await logtail.error(`Error getting subscriptions for user ${userId}`, {
        error: String(e),
      });
      return undefined;
    }
  }

  // https://api.twitch.tv/helix/eventsub/subscriptions
  async createSubscription(userId: string) {
    try {
      const data = await this.axios.post<TwitchSubscriptionResponse>(
        "/eventsub/subscriptions",
        {
          type: "stream.online",
          version: "1",
          condition: {
            broadcaster_user_id: userId,
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
      await logtail.error(`Error creating subscription for user ${userId}`, {
        error: String(e),
      });
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
}
