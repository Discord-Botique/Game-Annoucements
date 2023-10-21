import { createClient } from "supabase";
import type { Database } from "../_shared/supabase.types.ts";
import { TwitchApi } from "../../../apis/twitch/index.ts";
import { TwitchStream } from "../../../apis/twitch/types.ts";

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

  const sbURL = Deno.env.get("SUPABASE_URL");
  const sbKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!sbURL || !sbKey) {
    return new Response("Missing secrets", {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createClient<Database>(sbURL, sbKey, {
    auth: { persistSession: false },
  });

  const body = (await req.json()) as Body;

  if (body.subscription.type !== "stream.online") {
    return new Response("Ignoring non-stream.online event", {
      headers: { "Content-Type": "application/json" },
    });
  }

  const livestream = (await TwitchApi.getStream(
    // body.event.broadcaster_user_id,
    "133220545",
  )) as TwitchStream | undefined;

  const subscriptions = await supabase
    .from("twitch_subscriptions")
    .select()
    .match({
      user_id: body.event.broadcaster_user_id,
    });

  subscriptions.data?.map(async (subscription) => {
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
          }${body.event.broadcaster_user_name} is now live on Twitch!`,
          embeds: livestream
            ? [
                {
                  title: livestream.title,
                  url: `https://twitch.tv/${body.event.broadcaster_user_login}`,
                  description: livestream.game_name,
                  image: {
                    url: livestream.thumbnail_url,
                  },
                  timestamp: new Date(livestream.started_at).toISOString(),
                },
              ]
            : undefined,
        }),
      },
    );

    console.info(res);
  });

  return new Response(JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
});
