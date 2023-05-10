import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import differenceInHours from "date-fns/differenceInHours";
import endOfHour from "date-fns/endOfHour";
import { Client } from "discord.js";
import { logtail } from "./logtailConfig";
import {
  getSteamGameName,
  getSteamGameNews,
  getSteamSubscriptions,
  NewsItem,
} from "./api";

const triggerMessages = async (client: Client<true>) => {
  await logtail.debug("Checking for new announcements...");
  const guilds = await client.guilds.fetch();

  const fetchedNewsItems: NewsItem[] = [];
  const getNewsItem = async (id: number) => {
    const fetchedItem = fetchedNewsItems.find((item) => item.appid === id);
    return {
      newsItem: fetchedItem || (await getSteamGameNews(id)),
      pushNewsItem: Boolean(!fetchedItem),
    };
  };

  await Promise.all(
    guilds.map(async (oathGuild) => {
      const guild = await oathGuild.fetch();

      const subscriptions = await getSteamSubscriptions(guild.id);

      subscriptions?.map(async (subscription) => {
        try {
          const channel = await guild.channels
            .fetch(subscription.channel_id)
            .catch(async (err) => {
              await logtail.error("Error fetching channel", {
                error: String(err),
              });
              return null;
            });

          if (!channel?.isTextBased()) return null;
          const { newsItem, pushNewsItem } = await getNewsItem(
            subscription.game_id
          );

          if (!newsItem) return null;
          if (pushNewsItem) fetchedNewsItems.push(newsItem);

          const date = new Date(newsItem.date * 1000);

          // check if date is longer than an hour ago
          if (differenceInHours(new Date(), date) > 1) return null;

          await logtail.debug("Sending announcement message", {
            item: JSON.stringify(newsItem),
            difference: differenceInHours(new Date(), date),
          });
          const gameName = await getSteamGameName(subscription.game_id);

          const content = newsItem.contents.replace(
            "{STEAM_CLAN_IMAGE}",
            "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/clans"
          );

          const url = content.match(/(https?:\/\/[^\s]+)/g)?.[0] ?? "";

          await channel.send({
            content: `A new ${newsItem.feedlabel} news item${
              gameName ? ` for ${gameName}` : ""
            } has been posted!`,
            embeds: [
              {
                title: newsItem.title,
                url: newsItem.url,
                description: content.replace(url, ""),
                image: {
                  url,
                },
                timestamp: new Date(newsItem.date * 1000).toISOString(),
              },
            ],
          });
        } catch (e) {
          await logtail.error("Error sending message", { error: String(e) });
        }
      });
    })
  );

  fetchedNewsItems.length = 0;
  await sendUpdates(client);
};

export const sendUpdates = async (client: Client<true>) => {
  const timeUntilNextHour = differenceInMilliseconds(
    endOfHour(new Date()),
    new Date()
  );
  await logtail.debug(`Next update check in ${timeUntilNextHour}ms`);

  setTimeout(() => {
    triggerMessages(client).catch(async (err) => {
      console.error(err);
      await logtail.error("There was an error sending announcement messages");
    });
  }, timeUntilNextHour);
};
