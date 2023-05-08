import type { Event } from "./event";
import { ActivityType } from "discord-api-types/v10";
import { logtail } from "../utils/logtailConfig";

export const ready: Event<"ready"> = {
  name: "ready",
  once: true,
  async execute(client) {
    await logtail.debug(`Logged in as ${client.user.tag}!`);
    client.user.setPresence({
      activities: [
        {
          type: ActivityType.Streaming,
          name: "v1.0.0",
        },
      ],
    });
  },
};
