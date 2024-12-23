import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "@utils/logtail";
import { FortniteApi } from "@apis/fortnite";
import { mentionRole } from "@utils";

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

    const subscription = await FortniteApi.getSubscription({
      channelId,
    });

    if (!subscription)
      return interaction.reply({
        content: `Error: You are not subscribed to Fortnite on this channel.`,
        ephemeral: true,
      });

    await FortniteApi.deleteSubscription(subscription.id);
    await interaction.reply(
      `Unsubscribed to Fortnite! ${
        subscription.role_id
          ? mentionRole(subscription.role_id, interaction.guild)
          : "Members"
      } will no longer receive announcements for this game in the ${channelMention(
        interaction.channelId,
      )} channel.`,
    );
  } catch (error) {
    await logtail.error(String(error));
    await interaction.reply({
      content: String(error),
      ephemeral: true,
    });
  }
};
