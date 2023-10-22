import { getLiveStream } from "./twitchApi.ts";
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

export const logtail = new Logtail(Deno.env.get("LOGTAIL_KEY") || "");

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

  try {
    const stream = await getLiveStream(body.event.broadcaster_user_id);

    if (!stream) {
      const error = JSON.stringify({
        error: "No stream found.",
        req,
        body,
      });
      await logtail.error("No stream found.", {
        error,
      });
      return new Response(error, {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    const subscriptions = await getSubscriptions(stream.user_id);
    subscriptions.map(async (subscription) => {
      const res = await fetch(
        `https://discord.com/api/v10/channels/${subscription.channel_id}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bot ${Deno.env.get("TOKEN")}`,
            "Content-Type": "application/json; charset=UTF-8",
          },
          body: JSON.stringify({
            content: `${
              subscription.role_id ? `<@&${subscription.role_id}> ` : ""
            }${stream.user_name} is now live on Twitch!`,
            embeds: [
              {
                title: stream.title,
                url: `https://twitch.tv/${body.event.broadcaster_user_login}`,
                description: stream.game_name,
                image: {
                  url: stream.thumbnail_url.replace("-{width}x{height}", ""),
                },
                timestamp: new Date(stream.started_at).toISOString(),
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
