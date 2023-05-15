import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { logtail } from "../../utils/logtailConfig";
import {
  getSteamSubscription,
  getSteamGameName,
  deleteSteamSubscription,
} from "../../utils/api";
import { parseGameId } from "../../utils/utils";

export const steam = async (
  interaction: ChatInputCommandInteraction
): Promise<unknown> => {
  const guildId = interaction.guildId;
  if (!guildId)
    return interaction.reply({
      content: "This is not a server.",
      ephemeral: true,
    });

  const idOrUrl = interaction.options.getString("id-or-url", true);
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

    const subscription = await getSteamSubscription({
      gameId,
      channelId,
    });

    if (!subscription)
      return interaction.reply({
        content: `Error: You are not subscribed to ${gameName} on this channel.`,
        ephemeral: true,
      });

    await deleteSteamSubscription(subscription.id);
    await interaction.reply(
      `Unsubscribed to ${gameName}! ${
        subscription.role_id ? roleMention(subscription.role_id) : "Users"
      } will no longer receive announcements for this game in the ${channelMention(
        interaction.channelId
      )} channel.`
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
