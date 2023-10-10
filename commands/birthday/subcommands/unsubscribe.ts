import { ChatInputCommandInteraction, userMention } from "discord.js";
import { logtail } from "@utils/logtail";

import { deleteBirthdaySubscription, getBirthdaySubscription } from "../api";

export const unsubscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  const guildId = interaction.guildId;
  if (!guildId)
    return interaction.reply({
      content: "This is not a server.",
      ephemeral: true,
    });

  try {
    const channelId = interaction.channelId;
    const userId = interaction.user.id;

    const subscription = await getBirthdaySubscription({
      userId,
      channelId,
    });

    if (!subscription)
      return interaction.reply({
        content: `Error: Your birthday is not set up to be announced on this channel.`,
        ephemeral: true,
      });

    await deleteBirthdaySubscription(subscription.id);
    await interaction.reply(
      `Unsubscribed to birthday announcements for ${userMention(
        userId,
      )} on this channel.`,
    );
  } catch (error) {
    await logtail.error(String(error));
    await interaction.reply({
      content: String(error),
      ephemeral: true,
    });
  }
};
