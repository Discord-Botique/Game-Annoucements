/// <reference types="./module" />
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { logtail } from "@utils/logtailConfig";
import { Command } from "./commands/command";
import { steam } from "./commands/steam";
import { help } from "./commands/help";
import axios from "axios";
import { birthday } from "./commands/birthday";
import { twitch } from "./commands/twitch";

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
const commands: Command[] = [steam, help, birthday, twitch];

const commandsJSON = commands.map((command) => command.data.toJSON());

const commandsRoute = process.env.TEST_SERVER_ID
  ? Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.TEST_SERVER_ID,
    )
  : Routes.applicationCommands(process.env.CLIENT_ID);

(async () =>
  axios.post(
    `https://discordbotlist.com/api/v1/bots/${process.env.CLIENT_ID}/commands`,
    commandsJSON,
    {
      headers: {
        Authorization: process.env.DBL_TOKEN,
      },
    },
  ))().catch((err) =>
  logtail.error("Error updating commands in DiscordBotList", {
    error: JSON.stringify(err),
  }),
);

rest
  .put(commandsRoute, {
    body: commandsJSON,
  })
  .then(() => logtail.debug("Successfully registered application commands."))
  .catch((err) =>
    logtail.error("Error registering application commands.", {
      error: JSON.stringify(err),
    }),
  );
