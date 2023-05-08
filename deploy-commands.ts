import { config } from "dotenv";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
import { logtail } from "./utils/logtailConfig";
import { Command } from "./commands/command";

config();

const rest = new REST({ version: "9" }).setToken(process.env.TOKEN);
const commands: Command[] = [];

rest
  .put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: commands.map((command) => command.data.toJSON()),
  })
  .then(() => logtail.debug("Successfully registered application commands."))
  .catch((err) =>
    logtail.error(
      "Error registering application commands.",
      JSON.parse(JSON.stringify(err))
    )
  );
