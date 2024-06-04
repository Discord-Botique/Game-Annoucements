import { differenceInMilliseconds } from "date-fns/differenceInMilliseconds";
import { endOfHour } from "date-fns/endOfHour";
import { Client, Guild, MessageCreateOptions } from "discord.js";
import { logtail } from "@utils/logtail";
import type { NewsItem } from "@apis/steam/types";
import { getGameData } from "./utils";
import { supabase } from "@utils/supabase";
import { SteamApi } from "@apis/steam";
import { mentionRole } from "@utils";

const messageOptions = (
  newsItem: NewsItem,
  name: string,
  roleId: string | null,
  guild: Guild,
): MessageCreateOptions => {
  const content = newsItem.contents.replace(
    "{STEAM_CLAN_IMAGE}",
    "https://cdn.akamai.steamstatic.com/steamcommunity/public/images/clans",
  );

  const url = content.match(
    /(http)?s?:?(\/\/[^"']*?\.(?:png|jpg|jpeg|gif|svg))/gi,
  )?.[0];

  return {
    content: `${
      roleId ? `${mentionRole(roleId, guild)} ` : ""
    }A new community announcement for ${name} has been published!`,
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
    const steam = new SteamApi(id);
    return {
      newsItem: fetchedItem || (await steam.getNewsForGame()),
      pushNewsItem: Boolean(!fetchedItem),
    };
  };

  await Promise.all(
    guilds.map(async (oathGuild) => {
      const guild = await oathGuild.fetch();

      const subscriptions = await SteamApi.getSubscriptions(guild.id);

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
            const { newsItem, pushNewsItem } = await getNewsItem(
              subscription.game_id,
            );

            if (!newsItem || !subscription.steam_games) return null;
            if (pushNewsItem) fetchedNewsItems.push(newsItem);
            if (newsItem.feedlabel !== "Community Announcements") return null;

            const gameData = getGameData(subscription.steam_games);

            // check if the news item is the same as the last one we sent
            if (newsItem.gid === gameData.last_announcement_id) return null;

            await logtail.debug("Sending announcement message", {
              item: JSON.stringify(newsItem),
            });

            const message = messageOptions(
              newsItem,
              gameData.name,
              subscription.role_id,
              guild,
            );
            await channel.send(message).catch((error: unknown) => {
              throw new Error(JSON.stringify({ message, error }));
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
            });
          }
        }),
      );
    }),
  );

  fetchedNewsItems.length = 0;
  await sendUpdates(client);
};

export const sendUpdates = async (client: Client<true>) => {
  const timeUntilNextHour = differenceInMilliseconds(
    endOfHour(new Date()),
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
