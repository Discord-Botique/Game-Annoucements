import type { Command } from "@commands/types";
import type { Event } from "./types";
import { steam } from "@commands/steam";
import { help } from "@commands/help";
import { birthday } from "@commands/birthday";
import { twitch } from "@commands/twitch";

const commands: Command[] = [steam, help, birthday, twitch];

export const interactionCreate: Event<"interactionCreate"> = {
  name: "interactionCreate",
  async execute(interaction) {
    if (
      !interaction.isContextMenuCommand() &&
      !interaction.isChatInputCommand()
    )
      return;
    const { commandName } = interaction;

    const command = commands.find(({ data }) => data.name === commandName);
    await command?.execute(interaction);
  },
};
