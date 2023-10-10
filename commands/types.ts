import type {
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "@discordjs/builders";
import type {
  CommandInteraction,
  ContextMenuCommandInteraction,
} from "discord.js";

// To learn about message commands, visit
// https://discord.com/developers/docs/interactions/application-commands#message-commands

interface MessageApplicationData {
  name: string;
  type: 3;
}

interface MessageApplication extends MessageApplicationData {
  toJSON(): MessageApplicationData;
}

export interface Command {
  data:
    | Omit<SlashCommandBuilder, "addSubcommandGroup" | "addSubcommand">
    | MessageApplication
    | SlashCommandSubcommandsOnlyBuilder;
  execute(
    interaction: CommandInteraction | ContextMenuCommandInteraction,
  ): Promise<unknown>;
}
