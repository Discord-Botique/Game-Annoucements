import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { mentionRole } from "@utils";
import { FortniteApi } from "@apis/fortnite";

export const list = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const subscriptions = await FortniteApi.getSubscriptions(interaction.guildId);

  if (!subscriptions || subscriptions.length === 0)
    return interaction.reply(
      "There are no subscriptions for this server! Create some with the `/fortnite subscribe` application command.",
    );

  let message =
    "Here are the channels that are currently subscribed to Fortnite:\n\n";

  const updateMessage = async (index: number) => {
    const subscription = subscriptions[index];

    message += `${channelMention(subscription.channel_id)}${
      subscription.role_id
        ? ` - ${mentionRole(subscription.role_id, interaction.guild)}`
        : ""
    }\n`;

    if (index < subscriptions.length - 1) await updateMessage(index + 1);
  };

  await updateMessage(0);

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
};
