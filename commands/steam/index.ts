import { Command } from "../command";
import { SlashCommandBuilder } from "@discordjs/builders";
import { subscribe } from "./subcommands/subscribe";
import { unsubscribe } from "./subcommands/unsubscribe";
import { list } from "./subcommands/list";
import { ActionInterface, SubCommand } from "../utils";

const actions: ActionInterface = {
  subscribe,
  unsubscribe,
  list,
};

export const steam: Command = {
  data: new SlashCommandBuilder()
    .setName("steam")
    .setDescription(`Manage game announcements on Steam`)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.SUBSCRIBE)
        .setDescription(`Subscribe to a game's announcements on Steam`)
        .addStringOption((option) =>
          option
            .setName("id-or-url")
            .setDescription("The game's ID or URL on Steam")
            .setRequired(true)
        )
        .addRoleOption((option) =>
          option
            .setName("role-mention")
            .setDescription("The role to ping when a new announcement is made")
            .setRequired(false)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.UNSUBSCRIBE)
        .setDescription(`Unsubscribe to a game's announcements on Steam`)
        .addStringOption((option) =>
          option
            .setName("id-or-url")
            .setDescription("The game's ID or URL on Steam")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.LIST)
        .setDescription(`List all games your server is subscribed to on Steam`)
    ),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await actions[subCommand](interaction);
  },
};
