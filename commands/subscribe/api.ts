import axios from "axios";
import { supabase } from "../../utils/supabase";

interface AppDetails {
  [key: string]:
    | {
        data: {
          name: string;
        };
      }
    | undefined;
}

export const getSteamGameName = async (gameId: string | number) => {
  const gameInfo = await axios.get<AppDetails>(
    "https://store.steampowered.com/api/appdetails",
    {
      params: {
        appids: gameId,
      },
    }
  );

  return gameInfo?.data[gameId]?.data.name;
};

export const steamSubscriptions = supabase.from("steam_subscriptions");
