import { Command } from "../types";
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

export const fortnite: Command = {
  data: new SlashCommandBuilder()
    .setName("fortnite")
    .setDescription(`Manage game announcements for Fortnite`)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.SUBSCRIBE)
        .setDescription(`Subscribe to Fortnite news on this channel`)
        .addRoleOption((option) =>
          option
            .setName("role-mention")
            .setDescription("The role to ping when a new announcement is made")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.UNSUBSCRIBE)
        .setDescription(`Unsubscribe to Fortnite news on this channel`),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.LIST)
        .setDescription(
          `List all the channels that are subscribed to Fortnite news`,
        ),
    ),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await actions[subCommand](interaction);
  },
};
