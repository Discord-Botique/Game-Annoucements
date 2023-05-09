import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { logtail } from "./utils/logtailConfig";
import { Command } from "./commands/command";
import { subscribe } from "./commands/subscribe";
import { unsubscribe } from "./commands/unsubscribe";
import { list } from "./commands/list";

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
const commands: Command[] = [subscribe, unsubscribe, list];

const commandsRoute = process.env.TEST_SERVER_ID
  ? Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.TEST_SERVER_ID
    )
  : Routes.applicationCommands(process.env.CLIENT_ID);

console.log(commandsRoute);

rest
  .put(commandsRoute, {
    body: commands.map((command) => command.data.toJSON()),
  })
  .then(async () => {
    console.log("Successful");
    await logtail.debug("Successfully registered application commands.");
  })
  .catch(async (err) => {
    console.log(err);
    await logtail.error(
      "Error registering application commands.",
      JSON.parse(JSON.stringify(err))
    );
  });
