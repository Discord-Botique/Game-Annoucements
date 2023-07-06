import { ChatInputCommandInteraction } from "discord.js";

export enum SubCommand {
  SUBSCRIBE = "subscribe",
  UNSUBSCRIBE = "unsubscribe",
  LIST = "list",
}

export type ActionInterface = Record<
  SubCommand,
  (interaction: ChatInputCommandInteraction) => Promise<unknown>
>;
