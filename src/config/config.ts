import { config } from "dotenv";
import * as crypto from "crypto";

config();

export const CONFIG = {
    BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN!,
    API_ID: Number(process.env.TELEGRAM_API_ID),
    API_HASH: process.env.TELEGRAM_API_HASH!,
    SESSION_SECRET: process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex"),
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!
}; 