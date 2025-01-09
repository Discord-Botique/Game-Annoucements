import { ready } from "@events/ready";
import { Client, ClientEvents, GatewayIntentBits, Partials } from "discord.js";
import type { Event } from "@events/types";
import { logtail } from "@utils/logtail";
import { interactionCreate } from "@events/interactionCreate";
import { voiceStateUpdate } from "@events/voiceStateUpdate";

const client = new Client({
  allowedMentions: {
    parse: ["everyone", "roles", "users"],
  },
  // https://discord.com/developers/docs/topics/gateway#list-of-intents
  intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.Guilds],
  // https://discordjs.guide/popular-topics/partials.html#enabling-partials
  partials: [],
});

const events: Event<keyof ClientEvents>[] = [
  ready,
  interactionCreate,
  voiceStateUpdate,
];

events.forEach((event) => {
  // The ready event should only run once, when the app is ready
  if (event.once) client.once(event.name, (...args) => event.execute(...args));
  else client.on(event.name, (...args) => event.execute(...args));
});

client.login(process.env.TOKEN).catch((err) =>
  logtail.error("Could not login to Discord.", {
    error: JSON.stringify(err),
  }),
);
