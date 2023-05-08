import { config } from "dotenv";
import { ready } from "./events/ready";
import { Client, ClientEvents } from "discord.js";
import type { Event } from "./events/event";
import { logtail } from "./utils/logtailConfig";
import { Command } from "./commands/command";

config();

const client = new Client({
  // https://discord.com/developers/docs/topics/gateway#list-of-intents
  intents: [],
  // https://discordjs.guide/popular-topics/partials.html#enabling-partials
  partials: [],
});

const events: Event<keyof ClientEvents>[] = [ready];

events.forEach((event) => {
  // The ready event should only run once, when the app is ready
  if (event.once) client.once(event.name, (...args) => event.execute(...args));
  else client.on(event.name, (...args) => event.execute(...args));
});

const commands: Command[] = [];

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isContextMenuCommand() && !interaction.isChatInputCommand())
    return;
  const { commandName } = interaction;

  const command = commands.find(({ data }) => data.name === commandName);
  await command?.execute(interaction);
});

(() => {
  client
    .login(process.env.TOKEN)
    .catch((err) =>
      logtail.error(
        "Could not login to Discord.",
        JSON.parse(JSON.stringify(err))
      )
    );
})();
