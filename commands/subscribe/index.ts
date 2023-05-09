import { Command } from "../command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { steam } from "./steam";
import { ChatInputCommandInteraction } from "discord.js";

enum SubCommand {
  STEAM = "steam",
}

const subCommands: Record<
  SubCommand,
  (interaction: ChatInputCommandInteraction) => Promise<unknown>
> = {
  steam,
};

export const subscribe: Command = {
  data: new SlashCommandBuilder()
    .setName("subscribe")
    .setDescription(
      "Subscribe to game announcements on Steam or free games on supported platforms"
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.STEAM)
        .setDescription("Subscribe to a game's announcements on steam")
        .addStringOption((option) =>
          option
            .setName("id-or-url")
            .setDescription("The game's ID or URL on Steam")
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await subCommands[subCommand](interaction);
  },
};
