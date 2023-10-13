import {
  channelMention,
  ChatInputCommandInteraction,
  userMention,
} from "discord.js";
import { logtail } from "@utils/logtail";
import { confirmChannelAccess } from "@utils";
import { BirthdayApi } from "@apis/birthday";

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

    const month = interaction.options.getString("month", true);
    const day = interaction.options.getNumber("day", true);
    const year = interaction.options.getNumber("year");
    const date = new Date(
      `${month} ${day} ${year || new Date().getFullYear()}`,
    );
    const formattedDate = new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: year ? "numeric" : undefined,
    }).format(date);

    const birthday = new BirthdayApi(interaction);
    const subscription = await birthday.getSubscription();

    if (subscription) {
      return await interaction.reply({
        content: `${channelMention(
          interaction.channelId,
        )} is already subscribed to your birthday.`,
        ephemeral: true,
      });
    } else {
      await birthday.createSubscription({
        birthday: date.toISOString(),
        hasYear: !!year,
      });
    }

    await interaction.reply(
      `Subscribed to ${userMention(
        interaction.user.id,
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
