import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { logtail } from "./utils/logtailConfig";
import { Command } from "./commands/command";
import { subscribe } from "./commands/subscribe";
import { unsubscribe } from "./commands/unsubscribe";
import { list } from "./commands/list";
import { help } from "./commands/help";

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
const commands: Command[] = [subscribe, unsubscribe, list, help];

const commandsRoute = process.env.TEST_SERVER_ID
  ? Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.TEST_SERVER_ID
    )
  : Routes.applicationCommands(process.env.CLIENT_ID);

rest
  .put(commandsRoute, {
    body: commands.map((command) => command.data.toJSON()),
  })
  .then(() => logtail.debug("Successfully registered application commands."))
  .catch((err) =>
    logtail.error("Error registering application commands.", {
      error: JSON.stringify(err),
    })
  );
