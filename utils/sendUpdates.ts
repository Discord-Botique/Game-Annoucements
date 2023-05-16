import differenceInMilliseconds from "date-fns/differenceInMilliseconds";
import endOfHour from "date-fns/endOfHour";
import { Client, MessageCreateOptions, roleMention } from "discord.js";
import { logtail } from "./logtailConfig";
import { getSteamGameNews, getSteamSubscriptions, NewsItem } from "./api";
import { getGameData } from "./utils";
import { supabase } from "./supabase";

const messageOptions = (
  newsItem: NewsItem,
  name: string,
  roleId: string | null
): MessageCreateOptions => {
  const content = newsItem.contents.replace(
    "{STEAM_CLAN_IMAGE}",
    "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/clans"
  );

  const url = content.match(
    /(http)?s?:?(\/\/[^"']*\.(?:png|jpg|jpeg|gif|svg))/gi
  )?.[0];

  return {
    content: `${roleId ? `${roleMention(roleId)} ` : ""}A new ${
      newsItem.feedlabel
    } post for ${name} has been published!`,
    embeds: [
      {
        title: newsItem.title,
        url: newsItem.url,
        description: url ? content.replace(url, "") : content,
        image: url
          ? {
              url,
            }
          : undefined,
        timestamp: new Date(newsItem.date * 1000).toISOString(),
      },
    ],
  };
};

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
              await logtail.info("Error fetching channel", {
                error: String(err),
              });
              return null;
            });

          if (!channel?.isTextBased()) return null;
          const { newsItem, pushNewsItem } = await getNewsItem(
            subscription.game_id
          );

          if (!newsItem || !subscription.steam_games) return null;
          if (pushNewsItem) fetchedNewsItems.push(newsItem);
          if (newsItem.feedlabel === "Gamemag.ru") return null;

          const gameData = getGameData(subscription.steam_games);

          // check if the news item is the same as the last one we sent
          if (newsItem.gid === gameData.last_announcement_id) return null;

          await logtail.debug("Sending announcement message", {
            item: JSON.stringify(newsItem),
          });

          const message = messageOptions(
            newsItem,
            gameData.name,
            subscription.role_id
          );
          await channel.send(message).catch(() => {
            throw new Error(JSON.stringify(message));
          });
          await supabase.from("steam_games").upsert([
            {
              id: subscription.game_id,
              name: gameData.name,
              last_announcement_id: newsItem.gid,
              updated_at: new Date().toISOString(),
            },
          ]);
        } catch (e) {
          await logtail.error("Error sending message", {
            error: String(e),
            newsItem: JSON.stringify(fetchedNewsItems.at(-1)),
          });
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
