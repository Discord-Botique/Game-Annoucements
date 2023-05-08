import { Logtail } from "@logtail/node";
import { config } from "dotenv";
config();

export const logtail = new Logtail(process.env.LOGTAIL_KEY);
