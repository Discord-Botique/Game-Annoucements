import { channelMention, ChatInputCommandInteraction } from "discord.js";
import {
  authorizeTwitch,
  findTwitchUser,
  getSubscription,
  removeSubscription,
} from "../api";
import { logtail } from "../../../utils/logtailConfig";

export const unsubscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const username = interaction.options.getString("username", true);

  try {
    const oauth = await authorizeTwitch();
    if (!oauth)
      return interaction.reply({
        content: "Something went wrong with Twitch authorization",
        ephemeral: true,
      });

    const twitchUser = await findTwitchUser(username, oauth.access_token);

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
      oauth.access_token,
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
