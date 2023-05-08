import {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import { CommandInteraction, ContextMenuCommandInteraction } from "discord.js";

// To learn about message commands, visit
// https://discord.com/developers/docs/interactions/application-commands#message-commands

interface MessageApplicationData {
  name: string;
  type: 3;
}

interface MessageApplication extends MessageApplicationData {
  toJSON(): MessageApplicationData;
}

export const createMessageApplication = (name: string): MessageApplication => ({
  name,
  type: 3,
  toJSON: () => ({
    name,
    type: 3,
  }),
});

export interface Command {
  data:
    | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
    | MessageApplication
    | SlashCommandSubcommandsOnlyBuilder;
  execute(
    interaction: CommandInteraction | ContextMenuCommandInteraction
  ): Promise<void>;
}
