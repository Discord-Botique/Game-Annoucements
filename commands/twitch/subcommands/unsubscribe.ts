import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "@utils/logtail";
import { TwitchApi } from "@apis/twitch";

export const unsubscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const username = interaction.options.getString("username", true);

  try {
    const twitch = new TwitchApi(username);
    await twitch.isReady();

    if (!twitch.user)
      return interaction.reply({
        content: "Could not find the twitch user",
        ephemeral: true,
      });

    const supabaseSubscription = await twitch.getSubscription(
      interaction.channelId,
    );

    if (!supabaseSubscription)
      return interaction.reply({
        content: `You are not subscribed to ${twitch.user.display_name} on this channel!`,
        ephemeral: true,
      });

    await twitch.removeSubscription(interaction.channelId);
    await interaction.reply({
      content: `${channelMention(
        interaction.channelId,
      )} is no longer subscribed to ${twitch.user.display_name} on Twitch! `,
    });
  } catch (error) {
    await logtail.error(String(error), {
      input: interaction.options.getString("username", true),
    });
    await interaction.reply({
      content: String(error),
      ephemeral: true,
    });
  }
};
