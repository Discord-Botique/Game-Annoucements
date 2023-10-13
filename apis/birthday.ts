import { ChatInputCommandInteraction, Guild } from "discord.js";
import { supabase } from "@utils/supabase";

export class BirthdayApi {
  private interaction: ChatInputCommandInteraction;

  constructor(interaction: ChatInputCommandInteraction) {
    this.interaction = interaction;
  }

  static async getActiveSubscriptions(guild: Guild) {
    const { data: allSubscriptions } = await supabase
      .from("birthdays")
      .select("*")
      .match({
        server_id: guild.id,
      })
      .order("channel_id", { ascending: true });

    if (!allSubscriptions || allSubscriptions.length === 0) return [];

    const users = await guild.members.fetch({
      user: allSubscriptions.map(({ user_id }) => user_id),
    });

    return allSubscriptions.filter((subscription) =>
      users.has(subscription.user_id),
    );
  }

  async getSubscription() {
    const { data, error } = await supabase
      .from("birthdays")
      .select("*")
      .eq("user_id", this.interaction.user.id)
      .eq("channel_id", this.interaction.channelId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  }

  async deleteSubscription(id: number) {
    const { error } = await supabase.from("birthdays").delete().match({ id });
    if (error) throw new Error(error.message);
  }

  async createSubscription({
    birthday,
    hasYear,
  }: {
    birthday: string;
    hasYear: boolean;
  }) {
    if (!this.interaction.guildId) throw new Error("This is not a server.");
    const { error } = await supabase.from("birthdays").insert([
      {
        user_id: this.interaction.user.id,
        channel_id: this.interaction.channelId,
        server_id: this.interaction.guildId,
        birthday,
        has_year: hasYear,
      },
    ]);

    if (error) throw new Error(error.message);
  }
}
