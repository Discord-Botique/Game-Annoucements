import { getSteamGameName, getSteamSubscriptions } from "../api";
import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { getGameData } from "../utils";

export const list = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const subscriptions = await getSteamSubscriptions(interaction.guildId);

  if (!subscriptions || subscriptions.length === 0)
    return interaction.reply(
      "There are no subscriptions for this server! Create some with the `/steam subscribe` application command.",
    );

  let message = "Here are the games this server is currently subscribed to:\n";

  const updateMessage = async (index: number) => {
    const subscription = subscriptions[index];
    const gameName =
      subscription.steam_games !== null
        ? getGameData(subscription.steam_games).name
        : await getSteamGameName(subscription.game_id);

    if (
      index === 0 ||
      subscription.channel_id !== subscriptions[index - 1].channel_id
    ) {
      message += `\n${channelMention(subscription.channel_id)}\n`;
    }

    message += `• ${gameName || "Unknown"} (ID: ${subscription.game_id})${
      subscription.role_id ? ` - ${roleMention(subscription.role_id)}` : ""
    }\n`;

    if (index < subscriptions.length - 1) await updateMessage(index + 1);
  };

  await updateMessage(0);

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
};
