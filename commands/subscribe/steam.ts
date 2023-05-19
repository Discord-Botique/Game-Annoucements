import {
  channelMention,
  ChatInputCommandInteraction,
  roleMention,
} from "discord.js";
import { logtail } from "../../utils/logtailConfig";
import {
  getSteamSubscription,
  getSteamGameName,
  createSteamSubscription,
  countSubscriptions,
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

  const count = await countSubscriptions(guildId);

  if (count > 5)
    return interaction.reply({
      content: "Servers are currently limited to 5 subscriptions at a time.",
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

    const guild = await interaction.guild?.fetch();
    const channel = await guild?.channels
      .fetch(channelId, {
        force: true,
        cache: false,
      })
      .catch(() => undefined);

    if (!channel)
      return interaction.reply({
        content:
          "Sorry! This bot does not have access to this channel. Please provide access and try again.",
        ephemeral: true,
      });

    const subscription = await getSteamSubscription({
      gameId,
      channelId,
    });

    if (subscription) {
      return await interaction.reply(
        `${channelMention(channelId)} is already subscribed to ${gameName}.`
      );
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
