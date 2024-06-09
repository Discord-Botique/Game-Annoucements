export interface TwitchSubscription {
  id: string;
  status: string;
  type: string;
  version: string;
  condition: {
    broadcaster_user_id: string;
  };
  created_at: string;
  transport: {
    method: string;
    callback: string;
  };
  cost: number;
}

export interface TwitchSubscriptionResponse {
  total: number;
  data: TwitchSubscription[];
  total_cost: number;
  max_total_cost: number;
}

export interface OauthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
}

export interface TwitchStream {
  id: string;
  user_id: string;
  user_login: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: "live";
  title: string;
  tags: string[];
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: [];
  is_mature: boolean;
}

export interface StreamResponse {
  data: TwitchStream[];
  pagination: unknown;
}
