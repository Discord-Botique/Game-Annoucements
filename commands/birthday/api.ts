import { supabase } from "../../utils/supabase";
import { Guild } from "discord.js";
import { Database } from "../../utils/supabase.types";

export const getBirthdaySubscriptions = async (guildId: string) => {
  const { data } = await supabase
    .from("birthdays")
    .select("*")
    .match({
      server_id: guildId,
    })
    .order("channel_id", { ascending: true });

  return data;
};

type User = Database["public"]["Tables"]["birthdays"]["Row"];

// This method get subscriptions only for users that are still in the server
export const getActiveUsersSubscriptions = async (
  guild: Guild
): Promise<User[]> => {
  const subscriptions = await getBirthdaySubscriptions(guild.id);

  if (!subscriptions || subscriptions.length === 0) return [];

  const users = await guild.members.fetch({
    user: subscriptions.map(({ user_id }) => user_id),
  });

  return subscriptions.filter((subscription) =>
    users.has(subscription.user_id)
  );
};

export const getBirthdaySubscription = async ({
  userId,
  channelId,
}: {
  userId: string;
  channelId: string;
}) => {
  const { data, error } = await supabase
    .from("birthdays")
    .select("*")
    .eq("user_id", userId)
    .eq("channel_id", channelId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
};

export const deleteBirthdaySubscription = async (id: number) => {
  const { error } = await supabase.from("birthdays").delete().match({ id });
  if (error) throw new Error(error.message);
};

export const createBirthdaySubscription = async ({
  birthday,
  guildId,
  channelId,
  userId,
  hasYear,
}: {
  birthday: string;
  channelId: string;
  guildId: string;
  userId: string;
  hasYear: boolean;
}) => {
  const { error } = await supabase.from("birthdays").insert([
    {
      user_id: userId,
      channel_id: channelId,
      server_id: guildId,
      birthday,
      has_year: hasYear,
    },
  ]);

  if (error) throw new Error(error.message);
};
