import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { logtail } from "@utils/logtail";
import { parseGameId } from "../utils";
import { SteamApi } from "@apis/steam";

export const unsubscribe = async (
  interaction: ChatInputCommandInteraction,
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

  const steam = new SteamApi(gameId);
  const gameName = (await steam.getGameDetails())?.name;
  if (!gameName)
    return interaction.reply({
      content: `Could not find a game with ID ${gameId} on Steam.`,
      ephemeral: true,
    });

  try {
    const channelId = interaction.channelId;

    const subscription = await steam.getSubscription({
      channelId,
    });

    if (!subscription)
      return interaction.reply({
        content: `Error: You are not subscribed to ${gameName} on this channel.`,
        ephemeral: true,
      });

    await SteamApi.deleteSubscription(subscription.id);
    await interaction.reply(
      `Unsubscribed to ${gameName}! ${
        subscription.role_id ? roleMention(subscription.role_id) : "Members"
      } will no longer receive announcements for this game in the ${channelMention(
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
