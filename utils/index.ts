import { ChatInputCommandInteraction } from "discord.js";

export const confirmChannelAccess = async (
  interaction: ChatInputCommandInteraction,
) => {
  const channel = await interaction.guild?.channels
    .fetch(interaction.channelId, {
      force: true,
      cache: false,
    })
    .catch(() => undefined);

  if (!channel) {
    await interaction.reply({
      content:
        "Sorry! This bot is not allowed to send messages to this channel. Please update the channel permissions to allow this bot to view this channel and try again.",
      ephemeral: true,
    });
    return false;
  } else {
    return true;
  }
};
