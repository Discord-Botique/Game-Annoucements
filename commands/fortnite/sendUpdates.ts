import { differenceInMilliseconds } from "date-fns/differenceInMilliseconds";
import { endOfHour } from "date-fns/endOfHour";
import { Client, Guild, MessageCreateOptions } from "discord.js";
import { logtail } from "@utils/logtail";
import { mentionRole } from "@utils";
import { FortniteApi } from "@apis/fortnite";
import { BlogItem } from "@apis/fortnite/types";
import { endOfMinute } from "date-fns/endOfMinute";

export const blogUrl = "https://www.fortnite.com/news/";

const messageOptions = (
  newsItem: BlogItem,
  roleId: string | null,
  guild: Guild,
): MessageCreateOptions => {
  return {
    content: `${
      roleId ? `${mentionRole(roleId, guild)} ` : ""
    }A new announcement for Fortnite has been published!`,
    embeds: [
      {
        title: newsItem.title,
        url: blogUrl + newsItem.slug,
        image: { url: newsItem.shareImage },
        timestamp: newsItem.date,
      },
    ],
  };
};

const triggerMessages = async (client: Client<true>) => {
  await logtail.debug("Checking for new announcements...");
  const latestNews = await FortniteApi.getNews();

  if (latestNews) {
    const guilds = await client.guilds.fetch();

    await Promise.all(
      guilds.map(async (oathGuild) => {
        const guild = await oathGuild.fetch();
        const subscriptions = await FortniteApi.getSubscriptions(guild.id);

        await Promise.all(
          (subscriptions ?? []).map(async (subscription) => {
            try {
              const channel = await guild.channels
                .fetch(subscription.channel_id)
                .catch(async (err) => {
                  await logtail.info("Error fetching channel", {
                    error: String(err),
                    guildId: subscription.server_id,
                    channelId: subscription.channel_id,
                  });
                  return null;
                });

              if (!channel?.isTextBased()) return null;

              // check if the news item is the same as the last one we sent
              if (latestNews._id === subscription.last_announcement_id)
                return null;

              await logtail.debug("Sending announcement message", {
                item: JSON.stringify(latestNews),
              });

              const message = messageOptions(
                latestNews,
                subscription.role_id,
                guild,
              );
              await channel.send(message).catch((error: unknown) => {
                throw new Error(JSON.stringify({ message, error }));
              });

              FortniteApi.updateGameDetails({
                id: subscription.id,
                blogItem: latestNews,
              });
            } catch (e) {
              await logtail.error("Error sending message", {
                error: String(e),
              });
            }
          }),
        );
      }),
    );
  }

  await sendUpdates(client);
};

export const sendUpdates = async (client: Client<true>) => {
  const timeUntilNextHour = differenceInMilliseconds(
    endOfMinute(new Date()),
    new Date(),
  );
  await logtail.debug(`Next update check in ${timeUntilNextHour}ms`);

  setTimeout(() => {
    triggerMessages(client).catch(async (err) => {
      console.error(err);
      await logtail.error("There was an error sending announcement messages");
    });
  }, timeUntilNextHour);
};
