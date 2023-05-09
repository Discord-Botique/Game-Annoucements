import { SlashCommandBuilder } from "@discordjs/builders";
import { PermissionFlagsBits } from "discord.js";

export enum SubCommand {
  STEAM = "steam",
}

export enum Type {
  SUBSCRIBE = "Subscribe",
  UNSUBSCRIBE = "Unsubscribe",
}

export const createSubscriptionCommand = ({ type }: { type: Type }) =>
  new SlashCommandBuilder()
    .setName(type.toLowerCase())
    .setDescription(
      `${type} to game announcements on Steam or free games on supported platforms`
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false)
    .addSubcommand((subcommand) =>
      subcommand
        .setName(SubCommand.STEAM)
        .setDescription(`${type} to a game's announcements on steam`)
        .addStringOption((option) =>
          option
            .setName("id-or-url")
            .setDescription("The game's ID or URL on Steam")
            .setRequired(true)
        )
    );
