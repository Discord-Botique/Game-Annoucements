import { createClient } from "supabase";
import type { Database } from "../_shared/supabase.types.ts";
import { StreamResponse, OauthResponse } from "../../../apis/twitch/types.ts";

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

  const authParams = new URLSearchParams({
    client_id: Deno.env.get("TWITCH_CLIENT_ID") || "",
    client_secret: Deno.env.get("TWITCH_CLIENT_SECRET") || "",
    grant_type: "client_credentials",
  });

  const twitchAuth = await fetch(
    `https://id.twitch.tv/oauth2/token?${authParams}`,
    {
      method: "POST",
    },
  );
  const { access_token } = (await twitchAuth.json()) as OauthResponse;

  const streamParams = new URLSearchParams({
    user_id: body.event.broadcaster_user_id,
    type: "live",
  });

  const streams = await fetch(
    `https://api.twitch.tv/helix/streams?${streamParams}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Client-Id": Deno.env.get("TWITCH_CLIENT_ID") || "",
      },
    },
  );
  const streamsResponse = (await streams.json()) as StreamResponse | undefined;
  const stream = streamsResponse?.data[0];

  if (!stream) {
    console.error("No stream found.");
    return new Response(JSON.stringify({}), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
  const subscriptions = await supabase
    .from("twitch_subscriptions")
    .select()
    .match({
      user_id: stream.user_id,
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

    console.info(res);
  });

  return new Response(JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
});
