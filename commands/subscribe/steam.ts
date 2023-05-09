import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { logtail } from "../../utils/logtailConfig";
import { getSteamGameName, steamSubscriptions } from "./api";

// https://store.steampowered.com/api/appdetails?appids=945360
// http://api.steampowered.com/ISteamNews/GetNewsForApp/v0002/?appid=440&count=1&maxlength=300&format=json

export const steam = async (
  interaction: ChatInputCommandInteraction
): Promise<unknown> => {
  if (!interaction.guildId)
    return interaction.reply({
      content: "This is not a server.",
      ephemeral: true,
    });

  const idOrUrl = interaction.options.getString("id-or-url", true);
  const gameId = idOrUrl.split("/").map(Number).find(Boolean);

  if (!gameId)
    return interaction.reply({
      content: "Could not find a game ID in the provided URL.",
      ephemeral: true,
    });

  try {
    const gameName = await getSteamGameName(gameId);

    if (!gameName)
      return interaction.reply({
        content: "Could not find the game in the Steam Database.",
        ephemeral: true,
      });

    const { data } = await steamSubscriptions
      .select("*")
      .eq("game_id", String(gameId))
      .eq("channel_id", interaction.channelId)
      .single();

    if (data && !data.disabled_at) {
      return await interaction.reply({
        content: `You are already subscribed to ${gameName} on this channel.`,
        ephemeral: true,
      });
    }

    if (data?.disabled_at) {
      await steamSubscriptions
        .update({ disabled_at: null, updated_at: new Date().toISOString() })
        .eq("id", data.id);
    } else {
      await steamSubscriptions.insert([
        {
          game_id: String(gameId),
          channel_id: interaction.channelId,
          server_id: interaction.guildId,
        },
      ]);
    }

    await interaction.reply(
      `Subscribed to ${gameName}! You will now receive announcements for this game in ${channelMention(
        interaction.channelId
      )}.`
    );
  } catch (e) {
    await logtail.error(
      "Error subscribing to Steam game.",
      JSON.parse(JSON.stringify(e))
    );
    await interaction.reply(
      `There was a problem subscribing to ${idOrUrl} on Steam.`
    );
  }
};
