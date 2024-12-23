import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "@utils/logtail";
import { confirmChannelAccess, mentionRole } from "@utils";
import { FortniteApi } from "@apis/fortnite";

export const subscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  const guildId = interaction.guildId;
  if (!guildId)
    return interaction.reply({
      content: "This is not a server.",
      ephemeral: true,
    });

  try {
    const hasAccess = await confirmChannelAccess(interaction);
    if (!hasAccess) return;

    const role = interaction.options.getRole("role-mention");
    const channelId = interaction.channelId;

    const subscription = await FortniteApi.getSubscription({
      channelId,
    });

    if (subscription) {
      return await interaction.reply({
        content: `${channelMention(
          channelId,
        )} is already subscribed to Fortnite.`,
        ephemeral: true,
      });
    } else {
      await FortniteApi.createSubscription({
        guildId,
        channelId,
        roleId: role?.id,
      });
    }

    await interaction.reply(
      `Subscribed to Fornite! ${
        role ? mentionRole(role.id, interaction.guild) : "Members"
      } will now receive announcements for this game in the ${channelMention(
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
