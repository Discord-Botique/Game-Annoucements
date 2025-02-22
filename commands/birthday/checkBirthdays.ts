import { Client, Guild } from "discord.js";
import { differenceInMilliseconds } from "date-fns/differenceInMilliseconds";
import { differenceInYears } from "date-fns/differenceInYears";
import { startOfTomorrow } from "date-fns/startOfTomorrow";
import { userMention } from "@discordjs/builders";
import { logtail } from "@utils/logtail";
import { Database } from "../../supabase/db.types";
import { addHours } from "date-fns/addHours";
import { getMonth } from "date-fns/getMonth";
import { getDate } from "date-fns/getDate";
import { BirthdayApi } from "@apis/birthday";

type User = Database["public"]["Tables"]["birthdays"]["Row"];

const getUsersWithAnniversaries = async (guild: Guild): Promise<User[]> => {
  const subscriptions = await BirthdayApi.getActiveSubscriptions(guild);

  const currentMonth = getMonth(new Date());
  const currentDate = getDate(new Date());

  return subscriptions.filter((user) => {
    const birthday = new Date(user.birthday);
    const joinMonth = getMonth(birthday);
    const joinDate = getDate(birthday);
    return joinMonth === currentMonth && joinDate === currentDate;
  });
};

const removeBirthdayRoles = async (guild: Guild) => {
  try {
    const roles = await guild.roles.fetch();
    const birthdayRole = roles.find((role) => role.name === "BIRTHDAY LEGEND");

    let roleId: string;
    if (!birthdayRole) {
      const newRole = await guild.roles.create({
        name: "BIRTHDAY LEGEND",
        mentionable: true,
        color: "Yellow",
      });
      roleId = newRole.id;
    } else {
      roleId = birthdayRole.id;
    }

    const members = guild.members.cache;

    await Promise.all(
      members.map(async (member) => member.roles.remove(roleId)),
    );

    return roleId;
  } catch (e) {
    await logtail.info("Failed to remove birthday role", {
      e: String(e),
    });
  }
};

const sendMessageForUsers = async (
  users: User[],
  guild: Guild,
  roleId?: string,
) => {
  return Promise.all(
    users.map(async ({ user_id, channel_id, has_year, birthday }) => {
      const channel = await guild.channels.fetch(channel_id);
      if (!channel || !channel.isTextBased()) return;
      await logtail.debug("Sending birthday message", { user_id, channel_id });
      const difference = differenceInYears(new Date(), new Date(birthday));

      const member = await guild.members.fetch(user_id);
      if (roleId)
        await member.roles.add(roleId).catch(async (e) => {
          await logtail.info("Failed to add birthday role", { e: String(e) });
        });

      return channel.send(
        `Happy birthday to ${userMention(user_id)}${
          has_year ? ` (${difference})` : ""
        }! :birthday: Please wish them a very happy birthday.`,
      );
    }),
  );
};

const triggerMessages = async (client: Client<true>, once?: boolean) => {
  const guilds = await client.guilds.fetch();

  await Promise.all(
    guilds.map(async (oathGuild) => {
      const guild = await oathGuild.fetch();
      const users = await getUsersWithAnniversaries(guild);
      await logtail.debug(`Found ${users.length} users with anniversaries.`);
      const roleId = await removeBirthdayRoles(guild);

      if (users.length > 0) await sendMessageForUsers(users, guild, roleId);
    }),
  );

  if (once) return;
  await checkBirthdays(client);
};

const checkBirthdays = async (client: Client<true>) => {
  const timeUntilNextDay = differenceInMilliseconds(
    addHours(startOfTomorrow(), 8),
    new Date(),
  );
  await logtail.debug(`Next birthday check in ${timeUntilNextDay}ms`);

  setTimeout(() => {
    triggerMessages(client).catch(async (err) => {
      await logtail.error("There was an error sending birthday messages", {
        error: String(err),
      });
    });
  }, timeUntilNextDay);
};

export default checkBirthdays;
