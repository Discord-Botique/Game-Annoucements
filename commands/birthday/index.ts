import { ActionInterface, SubCommand } from "../utils";
import { subscribe } from "./subcommands/subscribe";
import { unsubscribe } from "./subcommands/unsubscribe";
import { list } from "./subcommands/list";
import { Command } from "../command";
import { SlashCommandBuilder } from "@discordjs/builders";

const actions: ActionInterface = {
  subscribe,
  unsubscribe,
  list,
};

export const birthday: Command = {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription(`Manage birthday announcements on the server`)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.SUBSCRIBE)
        .setDescription(`Add your birthday to be announced on this channel`)
        .addStringOption((option) =>
          option
            .setName("month")
            .setDescription("The month of your birthday")
            .setRequired(true)
            .addChoices(
              { name: "January", value: "January" },
              { name: "February", value: "February" },
              { name: "March", value: "March" },
              { name: "April", value: "April" },
              { name: "May", value: "May" },
              { name: "June", value: "June" },
              { name: "July", value: "July" },
              { name: "August", value: "August" },
              { name: "September", value: "September" },
              { name: "October", value: "October" },
              { name: "November", value: "November" },
              { name: "December", value: "December" },
            ),
        )
        .addNumberOption((option) =>
          option
            .setName("day")
            .setDescription("The day of your birthday")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(31),
        )
        .addNumberOption((option) =>
          option
            .setName("year")
            .setDescription("The year of your birthday (optional)")
            .setMinValue(1950)
            .setMaxValue(new Date().getFullYear() - 13),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.UNSUBSCRIBE)
        .setDescription(`Remove your birthday announcement from this channel`),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.LIST)
        .setDescription(`List all birthdays set up on on the server`),
    ),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await actions[subCommand](interaction);
  },
};
