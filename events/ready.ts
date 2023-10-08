import type { Event } from "./event";
import { ActivityType } from "discord-api-types/v10";
import { logtail } from "../utils/logtailConfig";
import { sendUpdates } from "../commands/steam/sendUpdates";
import checkBirthdays from "../commands/birthday/checkBirthdays";

export const ready: Event<"ready"> = {
  name: "ready",
  once: true,
  async execute(client) {
    await logtail.debug(`Logged in as ${client.user.tag}!`);
    console.log(`Logged in as ${client.user.tag}!`);
    await sendUpdates(client);
    await checkBirthdays(client);
    client.user.setPresence({
      activities: [
        {
          type: ActivityType.Streaming,
          name: "v1.4.0",
        },
      ],
    });
  },
};
