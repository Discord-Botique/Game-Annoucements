import { Command } from "../command";
import { steam } from "./steam";
import { ChatInputCommandInteraction } from "discord.js";
import { createSubscriptionCommand, Type, SubCommand } from "../utils";

const subCommands: Record<
  SubCommand,
  (interaction: ChatInputCommandInteraction) => Promise<unknown>
> = {
  steam,
};

export const subscribe: Command = {
  data: createSubscriptionCommand({
    type: Type.SUBSCRIBE,
    addRoleMention: true,
  }),
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const subCommand = interaction.options.getSubcommand(true) as SubCommand;
    await subCommands[subCommand](interaction);
  },
};
