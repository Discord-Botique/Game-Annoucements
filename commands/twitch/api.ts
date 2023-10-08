import axios from "axios";
import { logtail } from "../../utils/logtailConfig";
import { supabase } from "../../utils/supabase";

interface OauthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

// https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow
export const authorizeTwitch = async (): Promise<OauthResponse | undefined> => {
  try {
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

    return response.data;
  } catch (e) {
    await logtail.error(`Error authorizing Twitch`, {
      error: String(e),
    });
    return undefined;
  }
};

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
}

// https://dev.twitch.tv/docs/api/reference/#get-users
export const findTwitchUser = async (
  username: string,
  token: string,
): Promise<TwitchUser | undefined> => {
  try {
    const response = await axios.get<{
      data: TwitchUser[];
    }>("https://api.twitch.tv/helix/users", {
      params: {
        login: username,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });

    return response.data.data[0];
  } catch (e) {
    await logtail.error(`Error finding Twitch user ${username}`, {
      error: String(e),
    });
    return undefined;
  }
};

export const findTwitchUsers = async (
  ids: string[],
  token: string,
): Promise<TwitchUser[]> => {
  try {
    const params = ids.map((username) => `id=${username}`);

    const response = await axios.get<{
      data: TwitchUser[];
    }>(`https://api.twitch.tv/helix/users?${params.join("&")}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });

    return response.data.data;
  } catch (e) {
    await logtail.error(`Error finding Twitch users ${ids.join(", ")}`, {
      error: String(e),
    });
    return [];
  }
};

interface TwitchSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  condition: {
    broadcaster_user_id: string;
  };
  created_at: string;
  transport: {
    method: string;
    callback: string;
  };
  cost: number;
}

interface TwitchSubscriptionResponse {
  total: number;
  data: TwitchSubscription[];
  total_cost: number;
  max_total_cost: number;
}

// https://dev.twitch.tv/docs/api/reference/#get-eventsub-subscriptions
const findTwitchSubscription = async (
  userId: string,
  token: string,
): Promise<TwitchSubscription | undefined> => {
  try {
    const response = await axios.get<TwitchSubscriptionResponse>(
      "https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        params: {
          user_id: userId,
        },
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
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
};

export const getSubscription = async (
  match: Record<"user_id" | "channel_id", string>,
) => {
  const data = await supabase
    .from("twitch_subscriptions")
    .select()
    .match(match)
    .maybeSingle();

  return data.data;
};

//  https://api.twitch.tv/helix/eventsub/subscriptions
const createTwitchSubscription = async (userId: string, token: string) => {
  try {
    const data = await axios.post<TwitchSubscriptionResponse>(
      " https://api.twitch.tv/helix/eventsub/subscriptions",
      {
        type: "stream.online",
        version: "1",
        condition: {
          broadcaster_user_id: userId,
        },
        transport: {
          method: "webhook",
          callback: "https://api.example.com/webhooks/callback",
          secret: process.env.TWITCH_SUBSCRIPTION_SECRET,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Client-Id": process.env.TWITCH_CLIENT_ID,
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
};

const deleteTwitchSubscription = async (
  subscriptionId: string,
  token: string,
) => {
  try {
    await axios.delete(" https://api.twitch.tv/helix/eventsub/subscriptions", {
      params: {
        id: subscriptionId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
        "Client-Id": process.env.TWITCH_CLIENT_ID,
      },
    });
  } catch (e) {
    await logtail.error(`Error deleting subscription ${subscriptionId}`, {
      error: String(e),
    });
    return undefined;
  }
};

export const createSubscription = async (
  data: {
    server_id: string;
    user_id: string;
    channel_id: string;
    role_id?: string;
  },
  token: string,
) => {
  const twitchSubscription = await findTwitchSubscription(data.user_id, token);
  let subscription_id: string;

  if (!twitchSubscription) {
    const twitchSubscription = await createTwitchSubscription(
      data.user_id,
      token,
    );
    if (!twitchSubscription) throw new Error("Could not create subscription");
    subscription_id = twitchSubscription.id;
  } else {
    subscription_id = twitchSubscription.id;
  }

  const { error } = await supabase
    .from("twitch_subscriptions")
    .insert({ ...data, subscription_id });

  if (error) throw new Error(error.message);
};

export const getAllSubscriptions = async (guildId: string) => {
  const { data } = await supabase
    .from("twitch_subscriptions")
    .select()
    .match({
      server_id: guildId,
    })
    .order("channel_id", { ascending: true });

  return data;
};

export const removeSubscription = async (
  data: {
    user_id: string;
    channel_id: string;
  },
  token: string,
) => {
  const { error } = await supabase
    .from("twitch_subscriptions")
    .delete()
    .match(data);

  if (error) throw new Error(error.message);

  const remainingSubscriptions = await supabase
    .from("twitch_subscriptions")
    .select()
    .match({ user_id: data.user_id });

  // if there are still subscriptions for that user, we shouldn't delete the twitch webhook
  if (remainingSubscriptions.data?.length) return;

  const twitchSubscription = await findTwitchSubscription(data.user_id, token);
  if (!twitchSubscription) return;
  await deleteTwitchSubscription(twitchSubscription.id, token);
};
