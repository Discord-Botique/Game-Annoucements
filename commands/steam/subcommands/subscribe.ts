import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "@utils/logtail";
import { parseGameId } from "../utils";
import { confirmChannelAccess, mentionRole } from "@utils";
import { SteamApi } from "@apis/steam";

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

    const idOrUrl = interaction.options.getString("id-or-url", true);
    const role = interaction.options.getRole("role-mention");

    const gameId = parseGameId(idOrUrl);

    if (!gameId)
      return interaction.reply({
        content: `Could not parse the game ID from ${idOrUrl}.`,
        ephemeral: true,
      });

    const steam = new SteamApi(gameId);
    const gameName = (await steam.getGameDetails())?.name;
    if (!gameName)
      return interaction.reply({
        content: `Could not find a game with ID ${gameId} on Steam.`,
        ephemeral: true,
      });

    const channelId = interaction.channelId;

    const subscription = await steam.getSubscription({
      channelId,
    });

    if (subscription) {
      return await interaction.reply({
        content: `${channelMention(
          channelId,
        )} is already subscribed to ${gameName}.`,
        ephemeral: true,
      });
    } else {
      await steam.createSubscription({
        guildId,
        channelId,
        roleId: role?.id,
      });
    }

    await interaction.reply(
      `Subscribed to ${gameName}! ${
        role ? mentionRole(role.id, interaction.guild) : "Members"
      } will now receive announcements for this game in the ${channelMention(
        interaction.channelId,
      )} channel.`,
    );
  } catch (error) {
    await logtail.error(String(error), {
      input: interaction.options.getString("id-or-url", true),
    });
    await interaction.reply({
      content: String(error),
      ephemeral: true,
    });
  }
};
