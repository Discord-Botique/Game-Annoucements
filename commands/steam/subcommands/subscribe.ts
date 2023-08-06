import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { logtail } from "../../../utils/logtailConfig";
import {
  getSteamSubscription,
  getSteamGameName,
  createSteamSubscription,
} from "../api";
import { parseGameId } from "../utils";
import { confirmChannelAccess } from "../../../utils/confirmChannelAccess";

export const subscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  const guildId = interaction.guildId;
  if (!guildId)
    return interaction.reply({
      content: "This is not a server.",
      ephemeral: true,
    });

  const idOrUrl = interaction.options.getString("id-or-url", true);
  const role = interaction.options.getRole("role-mention");

  const gameId = parseGameId(idOrUrl);

  if (!gameId)
    return interaction.reply({
      content: `Could not parse the game ID from ${idOrUrl}.`,
      ephemeral: true,
    });

  const gameName = await getSteamGameName(gameId);
  if (!gameName)
    return interaction.reply({
      content: `Could not find a game with ID ${gameId} on Steam.`,
      ephemeral: true,
    });

  try {
    const channelId = interaction.channelId;
    const hasAccess = await confirmChannelAccess(interaction);
    if (!hasAccess) return;
    const subscription = await getSteamSubscription({
      gameId,
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
      await createSteamSubscription({
        gameId,
        guildId,
        channelId,
        roleId: role?.id,
      });
    }

    await interaction.reply(
      `Subscribed to ${gameName}! ${
        role ? roleMention(role.id) : "Users"
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
