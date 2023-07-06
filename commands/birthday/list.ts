import { getBirthdaySubscriptions } from "../../utils/api";
import {
  channelMention,
  ChatInputCommandInteraction,
  userMention,
} from "discord.js";

export const list = async (
  interaction: ChatInputCommandInteraction
): Promise<unknown> => {
  if (!interaction.guildId || !interaction.guild) return;

  const noSubscriptionsMessage = () =>
    interaction.reply(
      "There are no birthday announcements for this server! Channel managers can create some with the `/birthday subscribe` application command."
    );

  const subscriptions = await getBirthdaySubscriptions(interaction.guildId);

  if (!subscriptions || subscriptions.length === 0)
    return noSubscriptionsMessage();

  const users = await interaction.guild.members.fetch({
    user: subscriptions.map(({ user_id }) => user_id),
  });
  const filteredSubscriptions = subscriptions?.filter((subscription) =>
    users.has(subscription.user_id)
  );

  if (!filteredSubscriptions || filteredSubscriptions.length === 0)
    return noSubscriptionsMessage();

  let message =
    "Here are the birthdays this server is currently subscribed to:\n";

  const updateMessage = async (index: number) => {
    const subscription = filteredSubscriptions[index];
    const birthday = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: subscription.has_year ? "numeric" : undefined,
    }).format(new Date(subscription.birthday));

    if (
      index === 0 ||
      subscription.channel_id !== filteredSubscriptions[index - 1].channel_id
    ) {
      message += `\n${channelMention(subscription.channel_id)}\n`;
    }

    message += `• ${userMention(subscription.user_id)} - ${birthday}\n`;

    if (index < filteredSubscriptions.length - 1)
      await updateMessage(index + 1);
  };

  await updateMessage(0);

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
};
