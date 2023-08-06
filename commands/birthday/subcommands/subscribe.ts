import {
  channelMention,
  ChatInputCommandInteraction,
  userMention,
} from "discord.js";
import { logtail } from "../../../utils/logtailConfig";
import { createBirthdaySubscription, getBirthdaySubscription } from "../api";
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

  const month = interaction.options.getString("month", true);
  const day = interaction.options.getNumber("day", true);
  const year = interaction.options.getNumber("year");
  const date = new Date(`${month} ${day} ${year || new Date().getFullYear()}`);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: year ? "numeric" : undefined,
  }).format(date);
  const channelId = interaction.channelId;
  const userId = interaction.user.id;

  try {
    const hasAccess = await confirmChannelAccess(interaction);
    if (!hasAccess) return;
    const subscription = await getBirthdaySubscription({
      userId,
      channelId,
    });

    if (subscription) {
      return await interaction.reply({
        content: `${channelMention(
          channelId,
        )} is already subscribed to your birthday.`,
        ephemeral: true,
      });
    } else {
      await createBirthdaySubscription({
        userId,
        guildId,
        channelId,
        birthday: date.toISOString(),
        hasYear: !!year,
      });
    }

    await interaction.reply(
      `Subscribed to ${userMention(
        userId,
      )}'s birthday on ${formattedDate}! The server will now receive announcements their birthday in the ${channelMention(
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
