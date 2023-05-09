import { Command } from "../command";
import { steam } from "./steam";
import { ChatInputCommandInteraction } from "discord.js";
import { createSubscriptionCommand, SubCommand, Type } from "../utils";

const subCommands: Record<
  SubCommand,
  (interaction: ChatInputCommandInteraction) => Promise<unknown>
> = {
  steam,
};

export const unsubscribe: Command = {
  data: createSubscriptionCommand({ type: Type.UNSUBSCRIBE }),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await subCommands[subCommand](interaction);
  },
};
