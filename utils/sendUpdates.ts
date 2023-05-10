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
  logtail.debug("Checking for new announcements");
  const guilds = await client.guilds.fetch();

  const fetchedNewsItems: NewsItem[] = [];

  await Promise.all(
    guilds.map(async (oathGuild) => {
      const guild = await oathGuild.fetch();

      const subscriptions = await getSteamSubscriptions(guild.id);

      subscriptions?.map(async (subscription) => {
        const channel = await guild.channels.fetch(subscription.channel_id);

        if (!channel?.isTextBased()) return null;
        const fetchedItem = fetchedNewsItems.find(
          (item) => item.appid === Number(subscription.game_id)
        );
        const newsItem =
          fetchedItem || (await getSteamGameNews(subscription.game_id));
        if (!fetchedItem) fetchedNewsItems.push(newsItem);

        const date = new Date(newsItem.date * 1000);

        // check if date is longer than an hour ago
        if (differenceInHours(new Date(), date) > 24) return null;

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

        await channel
          .send({
            content: `A new ${newsItem.feedlabel} news item for ${gameName} has been posted!`,
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
          })
          .catch((e) =>
            logtail.error("Error sending message", { error: String(e) })
          );
      });
    })
  );

  fetchedNewsItems.length = 0;
  await sendUpdates(client);
};

export const sendUpdates = async (client: Client<true>) => {
  const timeUntilNextDay = differenceInMilliseconds(
    endOfHour(new Date()),
    new Date()
  );
  await logtail.debug(`Next update check in ${timeUntilNextDay}ms`);

  setTimeout(() => {
    triggerMessages(client).catch(async (err) => {
      console.error(err);
      await logtail.error("There was an error sending announcement messages");
    });
  }, 60000);
};
