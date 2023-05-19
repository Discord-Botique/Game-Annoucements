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
        "**How to Use the Game Announcements Bot**\n" +
        "\n" +
        "> * Indicates a required option\n" +
        "\n" +
        "- `/subscribe steam [id-or-url]* [role-mention]` - Subscribe to a game on Steam by either the ID of the game or by pasting in the URL. You can also choose a role in your server to be notified of updates when a new announcement is made for the game. Announcements will be made on the channel the command was run on.\n" +
        "- `/unsubscribe steam [id-or-url]*` - Unsubscribe to a game from Steam that was previously subscribed to in the channel the command was run on.\n" +
        "- `/list` - Display all current subscriptions for the server, with the channels they are active on along with the roles that will be tagged.\n" +
        "- `/help` - Outputs this message for reference if you ever need to look up a command! \n" +
        "Hope you enjoy Game Announcements and happy gaming!",
      ephemeral: true,
    });
  },
};
