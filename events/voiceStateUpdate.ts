import type { Event } from "./types";
import { getLoggingChannel } from "@utils/getLoggingChannel";
import { userMention, channelMention } from "discord.js";

export const voiceStateUpdate: Event<"voiceStateUpdate"> = {
  name: "voiceStateUpdate",
  async execute(oldState, newState) {
    const channel = await getLoggingChannel(oldState.guild.channels);
    if (!channel) return;

    if (newState.channelId === oldState.channelId) return;

    // https://stackoverflow.com/questions/71344815/how-would-i-detect-when-a-user-is-speaking-in-a-voice-channel-discord-js-v13
    if (newState.channelId && newState.member) {
      if (oldState.channelId) {
        await channel.send(
          `${userMention(newState.member.id)} has left ${channelMention(
            oldState.channelId,
          )} and joined ${channelMention(newState.channelId)}.`,
        );
      } else {
        await channel.send(
          `${userMention(newState.member.id)} has joined ${channelMention(
            newState.channelId,
          )}.`,
        );
      }
    } else {
      const memberId = oldState.member?.id;
      const channelId = oldState.channelId;
      if (!channelId || !memberId) return;
      await channel.send(
        `${userMention(memberId)} has left ${channelMention(channelId)}.`,
      );
    }
  },
};
