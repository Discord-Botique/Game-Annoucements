export interface GameData {
  name: string;
  steam_appid: number;
}

export interface AppDetails {
  [key: string]:
    | {
        success: true;
        data: GameData;
      }
    | { success: false }
    | undefined;
}

export interface NewsItem {
  gid: string;
  title: string;
  url: string;
  is_external_url: true;
  author: string;
  contents: string;
  feedlabel: string;
  date: number;
  feedname: string;
  appid: number;
  tags: string[];
}

export interface AppNews {
  appnews: {
    appid?: number;
    newsitems?: NewsItem[];
    count?: number;
  };
}
