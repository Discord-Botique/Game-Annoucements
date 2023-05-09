import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { logtail } from "./utils/logtailConfig";
import { Command } from "./commands/command";
import { subscribe } from "./commands/subscribe";

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
const commands: Command[] = [subscribe];

const guildCommandsRoute = Routes.applicationGuildCommands(
  process.env.CLIENT_ID,
  process.env.TEST_SERVER_ID
);

const commandsRoute = Routes.applicationCommands(process.env.CLIENT_ID);

rest
  .put(process.env.TEST ? guildCommandsRoute : commandsRoute, {
    body: commands.map((command) => command.data.toJSON()),
  })
  .then(() => logtail.debug("Successfully registered application commands."))
  .catch((err) =>
    logtail.error(
      "Error registering application commands.",
      JSON.parse(JSON.stringify(err))
    )
  );
