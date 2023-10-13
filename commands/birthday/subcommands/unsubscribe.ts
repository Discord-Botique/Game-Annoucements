import { ChatInputCommandInteraction, userMention } from "discord.js";
import { logtail } from "@utils/logtail";
import { BirthdayApi } from "@apis/birthday";

export const unsubscribe = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  const guildId = interaction.guildId;
  if (!guildId)
    return interaction.reply({
      content: "This is not a server.",
      ephemeral: true,
    });

  try {
    const birthday = new BirthdayApi(interaction);
    const subscription = await birthday.getSubscription();

    if (!subscription)
      return interaction.reply({
        content: `Error: Your birthday is not set up to be announced on this channel.`,
        ephemeral: true,
      });

    await birthday.deleteSubscription(subscription.id);
    await interaction.reply(
      `Unsubscribed to birthday announcements for ${userMention(
        interaction.user.id,
      )} on this channel.`,
    );
  } catch (error) {
    await logtail.error(String(error));
    await interaction.reply({
      content: String(error),
      ephemeral: true,
    });
  }
};
