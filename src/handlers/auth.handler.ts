import { Context } from "telegraf";
import { TelegramService } from "../services/telegram.service";
import { SessionService } from "../services/session.service";
import { Logger } from "../utils/logger";
import { Api } from "telegram";
import { showAvailableCommands } from "../bot";

const logger = new Logger();
const userState = new Map<string, {
    step: 'phoneNumber' | 'phoneCode' | 'password',
    client: any,
    phoneNumber?: string,
    phoneCodeHash?: string
}>();

export class AuthHandler {
    static async handleLogin(ctx: any) {
        const userId = ctx.from?.id.toString();
        if (!userId) {
            return ctx.reply("❌ Unable to retrieve your ID.");
        }

        const existingSession = await SessionService.load(userId);
        if (existingSession) {
            return ctx.reply("✅ You are already logged in.");
        }

        const client = await TelegramService.createNewClient();
        userState.set(userId, { step: "phoneNumber", client });

        await ctx.reply("📱 Please enter your phone number (e.g., +1234567890):", {
            reply_markup: { force_reply: true }
        });
        await showAvailableCommands(ctx, false);
    }

    static async handleText(ctx: any) {
        const userId = ctx.from?.id.toString();
        if (!userId || !userState.has(userId)) return;

        const state = userState.get(userId)!;
        const input = ctx.message?.text?.trim();
        if (!input) return;

        try {
            switch (state.step) {
                case "phoneNumber":
                    if (!/^\+\d{10,14}$/.test(input)) {
                        return ctx.reply("❌ Invalid phone number. Please try again:");
                    }

                    await state.client.connect();
                    const { phoneCodeHash } = await state.client.sendCode({
                        apiId: state.client.apiId,
                        apiHash: state.client.apiHash
                    }, input);

                    userState.set(userId, {
                        ...state,
                        step: "phoneCode",
                        phoneNumber: input,
                        phoneCodeHash
                    });

                    await ctx.reply("📨 Enter the code you received (add a letter prefix, e.g., a12345):", {
                        reply_markup: { force_reply: true }
                    });
                    break;

                case "phoneCode":
                    if (!input.match(/^[a-zA-Z]\d+$/)) {
                        return ctx.reply("❌ Invalid format. Please enter with a letter prefix (e.g., a12345)");
                    }

                    const phoneCode = input.slice(1);
                    try {
                        await state.client.invoke(
                            new Api.auth.SignIn({
                                phoneNumber: state.phoneNumber!,
                                phoneCodeHash: state.phoneCodeHash!,
                                phoneCode
                            })
                        );

                        const sessionString = state.client.session.save();
                        await SessionService.save(userId, sessionString);
                        userState.delete(userId);
                        await ctx.reply("✅ Successfully logged in!");
                        await showAvailableCommands(ctx, true);
                    } catch (error: any) {
                        if (error.message.includes('PASSWORD_REQUIRED')) {
                            userState.set(userId, { ...state, step: "password" });
                            await ctx.reply("🔒 2FA is enabled. Please enter your password:");
                        } else {
                            throw error;
                        }
                    }
                    break;

                case "password":
                    try {
                        await state.client.checkPassword(input);
                        const sessionString = state.client.session.save();
                        await SessionService.save(userId, sessionString);
                        userState.delete(userId);
                        await ctx.reply("✅ Successfully logged in with 2FA!");
                        await showAvailableCommands(ctx, true);
                    } catch (error) {
                        await ctx.reply("❌ Invalid password. Please try again:");
                    }
                    break;
            }
        } catch (error) {
            logger.error("Login error", { error, userId });
            await ctx.reply("❌ An error occurred. Please try again with /login");
            userState.delete(userId);
        }
    }

    static async handleLogout(ctx: Context) {
        const userId = ctx.from?.id.toString();
        if (!userId) {
            return ctx.reply("❌ Unable to identify you.");
        }

        await SessionService.delete(userId);
        await ctx.reply("✅ Logged out successfully!");
        await showAvailableCommands(ctx, false);
    }
} 