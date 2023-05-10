import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "../../utils/logtailConfig";
import {
  getSteamSubscription,
  getSteamGameName,
  createSteamSubscription,
} from "../../utils/api";
import { getGameId } from "../../utils/utils";

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

  try {
    const gameId = getGameId(idOrUrl);
    const gameName = await getSteamGameName(gameId, true);
    const channelId = interaction.channelId;

    const subscription = await getSteamSubscription({
      gameId,
      channelId,
    });

    if (subscription) {
      return await interaction.reply(
        `${channelMention(
          interaction.channelId
        )} is already subscribed to ${gameName}.`
      );
    } else {
      await createSteamSubscription({
        gameId,
        guildId,
        channelId,
      });
    }

    await interaction.reply(
      `Subscribed to ${gameName}! ${channelMention(
        interaction.channelId
      )} will now receive announcements for this game.`
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
