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

export const twitch: Command = {
  data: new SlashCommandBuilder()
    .setName("twitch")
    .setDescription(`Subscribe to a Twitch channel's live streams`)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.SUBSCRIBE)
        .setDescription(`Add a subscription to a Twitch channel's live streams`)
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("The streamer's username on Twitch")
            .setRequired(true),
        )
        .addRoleOption((option) =>
          option
            .setName("role-mention")
            .setDescription("The role to ping when a new stream goes live")
            .setRequired(false),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.UNSUBSCRIBE)
        .setDescription(`Add a subscription to a Twitch channel's live streams`)
        .addStringOption((option) =>
          option
            .setName("username")
            .setDescription("The streamer's username on Twitch")
            .setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.LIST)
        .setDescription(`List all Twitch streams your server is subscribed to`),
    ),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await actions[subCommand](interaction);
  },
};
