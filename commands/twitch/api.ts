import { supabase } from "@utils/supabase";
import { TwitchApi } from "@apis/twitch";

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

export const createSubscription = async (
  data: {
    server_id: string;
    user_id: string;
    channel_id: string;
    role_id?: string;
  },
  twitch: TwitchApi,
) => {
  const twitchSubscription = await twitch.getSubscription(data.user_id);
  let subscription_id: string;

  if (!twitchSubscription) {
    const twitchSubscription = await twitch.createSubscription(data.user_id);
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
  twitch: TwitchApi,
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

  const twitchSubscription = await twitch.getSubscription(data.user_id);
  if (!twitchSubscription) return;
  await twitch.deleteSubscription(twitchSubscription.id);
};
