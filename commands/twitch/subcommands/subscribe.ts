import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { logtail } from "@utils/logtail";
import { TwitchApi } from "@apis/twitch";

export const subscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const role = interaction.options.getRole("role-mention");

  try {
    const twitch = new TwitchApi(interaction);
    await twitch.isReady();

    if (!twitch.user)
      return interaction.reply({
        content: "Could not find the twitch user",
        ephemeral: true,
      });

    const supabaseSubscription = await twitch.getSubscription();

    if (supabaseSubscription)
      return interaction.reply({
        content: `You are already subscribed to ${twitch.user.display_name} on this channel!`,
        ephemeral: true,
      });

    await twitch.createSubscription();

    await interaction.reply({
      content: `Subscribed to ${twitch.user.display_name} on Twitch! ${
        role ? roleMention(role.id) : "Members"
      } will now receive announcements when they go live in the ${channelMention(
        interaction.channelId,
      )} channel.`,
      embeds: [
        {
          title: twitch.user.display_name,
          url: `https://twitch.tv/${twitch.user.login}`,
          description: twitch.user.description,
          image: {
            url: twitch.user.profile_image_url,
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
