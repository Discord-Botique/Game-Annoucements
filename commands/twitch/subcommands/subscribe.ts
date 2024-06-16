import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "@utils/logtail";
import { TwitchApi } from "@apis/twitch";
import { confirmChannelAccess, mentionRole } from "@utils";

export const subscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const role = interaction.options.getRole("role-mention");
  const username = interaction.options.getString("username", true);

  try {
    const hasAccess = await confirmChannelAccess(interaction);
    if (!hasAccess) return;

    const twitch = new TwitchApi();
    await twitch.isReady();

    const twitchUser = await twitch.findUser(username);
    if (!twitchUser)
      return interaction.reply({
        content: "Could not find the twitch user",
        ephemeral: true,
      });

    const supabaseSubscription = await twitch.getSubscription({
      channel_id: interaction.channelId,
      user_id: twitchUser.id,
    });

    if (supabaseSubscription)
      return interaction.reply({
        content: `You are already subscribed to ${twitchUser.display_name} on this channel!`,
        ephemeral: true,
      });

    await twitch.createSubscription({
      channel_id: interaction.channelId,
      server_id: interaction.guildId,
      user_id: twitchUser.id,
      role_id: role?.id,
    });

    await interaction.reply({
      content: `Subscribed to ${twitchUser.display_name} on Twitch! ${
        role ? mentionRole(role.id, interaction.guild) : "Members"
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
