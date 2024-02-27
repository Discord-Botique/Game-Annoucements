import { getLiveStream, findTwitchUser } from "./twitchApi.ts";
import { getSubscriptions } from "./supabaseApi.ts";
import { Logtail } from "logtail";

interface Body {
  subscription: {
    id: string;
    type: string;
  };
  event: {
    id: string;
    broadcaster_user_id: string;
    broadcaster_user_login: string;
    broadcaster_user_name: string;
  };
}

const logtail = new Logtail(Deno.env.get("LOGTAIL_KEY") || "");

Deno.serve(async (req) => {
  // @todo - verify the event - https://dev.twitch.tv/docs/eventsub/handling-webhook-events/#verifying-the-event-message
  if (
    req.headers.get("twitch-eventsub-message-type") ===
    "webhook_callback_verification"
  ) {
    const { challenge } = await req.json();
    return new Response(challenge, {
      headers: { "Content-Type": "text/plain" },
    });
  }

  const body = (await req.json()) as Body;

  if (body.subscription.type !== "stream.online") {
    return new Response("Ignoring non-stream.online event", {
      headers: { "Content-Type": "application/json" },
    });
  }

  let title = "";
  let description = "";
  let url = "";
  let timestamp = "";

  try {
    const stream = await getLiveStream(body.event.broadcaster_user_id);

    if (!stream) {
      const user = await findTwitchUser(body.event.broadcaster_user_id);

      if (!user) {
        const error = JSON.stringify({
          error: "No stream or user found.",
          req,
        });

        await logtail.error("No stream or user found.", {
          error,
        });

        return new Response(error, {
          headers: { "Content-Type": "application/json" },
          status: 400,
        });
      } else {
        title = user.display_name;
        description = user.description;
        url = user.profile_image_url;
        timestamp = new Date().toISOString();
      }
    } else {
      title = stream.title;
      description = stream.game_name;
      url = stream.thumbnail_url.replace("-{width}x{height}", "");
      timestamp = new Date(stream.started_at).toISOString();
    }

    const subscriptions = await getSubscriptions(
      body.event.broadcaster_user_id,
    );

    const mentionRole = (roldId: string, serverId: string) => {
      return roldId === serverId ? "@everyone" : `<@&${roldId}>`;
    };

    subscriptions.map(async (subscription) => {
      await fetch(
        `https://discord.com/api/v10/channels/${subscription.channel_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${Deno.env.get("TOKEN")}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            content: `${
              subscription.role_id
                ? `${mentionRole(subscription.role_id, subscription.server_id)} `
                : ""
            }${body.event.broadcaster_user_name} is now live on Twitch!`,
            allowedMentions: { parse: ["everyone", "roles"] },
            embeds: [
              {
                title,
                url: `https://twitch.tv/${body.event.broadcaster_user_login}`,
                description,
                image: { url },
                timestamp,
              },
            ],
          }),
        },
      );
    });

    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    const error = JSON.stringify({
      error: "An error occured.",
      e,
      req,
      body,
    });

    await logtail.error("An error occured.", {
      error,
    });
    return new Response(error, {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
