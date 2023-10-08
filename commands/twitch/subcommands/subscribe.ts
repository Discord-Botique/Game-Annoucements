import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { logtail } from "../../../utils/logtailConfig";
import {
  authorizeTwitch,
  createSubscription,
  findTwitchUser,
  getSubscription,
} from "../api";

export const subscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const username = interaction.options.getString("username", true);
  const role = interaction.options.getRole("role-mention");

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

    if (supabaseSubscription)
      return interaction.reply({
        content: `You are already subscribed to ${twitchUser.display_name} on this channel!`,
        ephemeral: true,
      });

    await createSubscription(
      {
        server_id: interaction.guildId,
        user_id: twitchUser.id,
        role_id: role?.id,
        channel_id: interaction.channelId,
      },
      oauth.access_token,
    );

    await interaction.reply({
      content: `Subscribed to ${twitchUser.display_name} on Twitch! ${
        role ? roleMention(role.id) : "Members"
      } will now receive announcements when they go live in the ${channelMention(
        interaction.channelId,
      )} channel.`,
      embeds: [
        {
          title: twitchUser.display_name,
          url: `https://twitch.tv/${twitchUser.login}`,
          description: twitchUser.description,
          image: {
            url: twitchUser.profile_image_url,
          },
        },
      ],
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
