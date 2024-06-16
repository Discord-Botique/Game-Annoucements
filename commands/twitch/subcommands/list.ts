import { channelMention, ChatInputCommandInteraction } from "discord.js";
import { TwitchApi } from "@apis/twitch";
import { mentionRole } from "@utils";

export const list = async (
  interaction: ChatInputCommandInteraction,
): Promise<unknown> => {
  if (!interaction.guildId) return;

  const twitch = new TwitchApi();
  await twitch.isReady();

  const subscriptions = await twitch.getAllSubscriptions(interaction.guildId);

  if (!subscriptions || subscriptions.length === 0)
    return interaction.reply(
      "There are no subscriptions for this server! Create some with the `/twitch subscribe` application command.",
    );

  const userIds = [
    ...new Set(subscriptions.map((subscription) => subscription.user_id)),
  ];
  const users = await twitch.findUsers(userIds);

  let message =
    "Here are the Twitch streamers this server is currently subscribed to:\n";

  const updateMessage = async (index: number) => {
    const subscription = subscriptions[index];
    const twitchUser = users.find((user) => user.id === subscription.user_id);

    if (
      index === 0 ||
      subscription.channel_id !== subscriptions[index - 1].channel_id
    ) {
      message += `\n${channelMention(subscription.channel_id)}\n`;
    }

    message += `• ${twitchUser?.display_name || "Unknown"} ${
      twitchUser ? ` (http://twitch.tv/${twitchUser.login})` : ""
    }${
      subscription.role_id
        ? ` - ${mentionRole(subscription.role_id, interaction.guild)}`
        : ""
    }\n`;

    if (index < subscriptions.length - 1) await updateMessage(index + 1);
  };

  await updateMessage(0);

  await interaction.reply({
    content: message,
    ephemeral: true,
  });
};
