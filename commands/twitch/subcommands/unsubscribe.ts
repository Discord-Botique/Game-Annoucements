import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { getSubscription, removeSubscription } from "../api";
import { logtail } from "@utils/logtail";
import { TwitchApi } from "@apis/twitch";

export const unsubscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const username = interaction.options.getString("username", true);

  try {
    const twitch = new TwitchApi();
    await twitch.isReady();

    const twitchUser = await twitch.findUser(username);

    if (!twitchUser)
      return interaction.reply({
        content: "Could not find the twitch user",
        ephemeral: true,
      });

    const supabaseSubscription = await getSubscription({
      user_id: twitchUser.id,
      channel_id: interaction.channelId,
    });

    if (!supabaseSubscription)
      return interaction.reply({
        content: `You are not subscribed to ${twitchUser.display_name} on this channel!`,
        ephemeral: true,
      });

    await removeSubscription(
      {
        user_id: twitchUser.id,
        channel_id: interaction.channelId,
      },
      twitch,
    );
    await interaction.reply({
      content: `${channelMention(
        interaction.channelId,
      )} is no longer subscribed to ${twitchUser.display_name} on Twitch! `,
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
