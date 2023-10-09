import { createClient } from "supabase";
import type { Database } from "../_shared/supabase.types.ts";

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
  console.log(req);

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

  console.log("Creating supabase client", sbURL, sbKey);
  const supabase = createClient<Database>(sbURL, sbKey, {
    auth: { persistSession: false },
  });

  const body = (await req.json()) as Body;

  if (body.subscription.type !== "stream.online") {
    return new Response("Ignoring non-stream.online event", {
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(body);
  const subscriptions = await supabase
    .from("twitch_subscriptions")
    .select()
    .match({
      user_id: body.event.broadcaster_user_id,
    });

  console.log(subscriptions);

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
          }${
            body.event.broadcaster_user_name
          } is now live on Twitch! https://twitch.tv/${
            body.event.broadcaster_user_login
          }`,
        }),
      },
    );

    console.info(res);
  });

  return new Response(JSON.stringify({}), {
    headers: { "Content-Type": "application/json" },
  });
});
