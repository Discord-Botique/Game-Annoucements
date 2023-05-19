import { Command } from "./command";
import { SlashCommandBuilder } from "@discordjs/builders";

export const help: Command = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription(
      `Read our short guide on how to use the Game Announcements bot!`
    )
    .setDMPermission(false),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    await interaction.reply({
      content:
        "Welcome to Game Announcements! \n\n" +
        "Game Announcements is a Discord bot designed to keep you updated on the latest game updates and news. With the `/subscribe steam` command, you can subscribe to up to 5 games and get notifications on new posts related to those games. You can also choose to set a role to be notified using the `role-mention` option, so that you and your team are alerted whenever a new post is made. Don't worry if you change your mind, you can always unsubscribe from games by using the `/unsubscribe steam` command. Additionally, you can check all your current subscriptions using the `/list` command. \n\n" +
        "Hope you enjoy Game Announcements and happy gaming!",
      ephemeral: true,
    });
  },
};
