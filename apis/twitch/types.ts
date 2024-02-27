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
