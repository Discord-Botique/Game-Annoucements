import { OauthResponse, StreamResponse } from "../../../apis/twitch/types.ts";

const getAccessToken = async () => {
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

  return access_token;
};

export const getLiveStream = async (user_id: string) => {
  const accessToken = await getAccessToken();
  const streamParams = new URLSearchParams({
    user_id,
    type: "live",
  });

  // https://dev.twitch.tv/docs/api/reference/#get-streams
  const streams = await fetch(
    `https://api.twitch.tv/helix/streams?${streamParams}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-Id": Deno.env.get("TWITCH_CLIENT_ID") || "",
      },
    },
  );
  const streamsResponse = (await streams.json()) as StreamResponse | undefined;
  return streamsResponse?.data[0];
};
