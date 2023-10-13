import {
  channelMention,
  ChatInputCommandInteraction,
  userMention,
} from "discord.js";
import { BirthdayApi } from "@apis/birthday";

export const list = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId || !interaction.guild) return;

  const guild = await interaction.guild.fetch();
  const subscriptions = await BirthdayApi.getActiveSubscriptions(guild);

  if (subscriptions.length === 0)
    return interaction.reply({
      content:
        "There are no birthday announcements for this server! You can add yours with the `/birthday subscribe` application command.",
      ephemeral: true,
    });

  let message =
    "Here are the birthdays this server is currently subscribed to:\n";

  const updateMessage = async (index: number) => {
    const subscription = subscriptions[index];
    const birthday = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: subscription.has_year ? "numeric" : undefined,
    }).format(new Date(subscription.birthday));

    if (
      index === 0 ||
      subscription.channel_id !== subscriptions[index - 1].channel_id
    ) {
      message += `\n${channelMention(subscription.channel_id)}\n`;
    }

    message += `• ${userMention(subscription.user_id)} - ${birthday}\n`;

    if (index < subscriptions.length - 1) await updateMessage(index + 1);
  };

  await updateMessage(0);

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
};
