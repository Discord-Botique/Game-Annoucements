import { Command } from "./command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getSteamGameName, getSteamSubscriptions } from "../utils/api";
import { channelMention, roleMention } from "discord.js";
import { getGameData } from "../utils/utils";

export const list: Command = {
  data: new SlashCommandBuilder()
    .setName("list")
    .setDescription(
      `List all the games and services the server is subscribed to for announcements`
    )
    .setDMPermission(false),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;
    if (!interaction.guildId) return;

    const subscriptions = await getSteamSubscriptions(interaction.guildId);

    if (!subscriptions)
      return interaction.reply(
        "There are no subscriptions for this server! Channel managers can create some with the `/subscribe` application command."
      );

    let message = "Here are the games this server is currently subscribed to:";

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
  },
};
