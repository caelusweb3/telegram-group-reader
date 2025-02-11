import { Telegraf } from "telegraf";
import { CONFIG } from "./config/config";
import { AuthHandler } from "./handlers/auth.handler";
import { MessageHandler } from "./handlers/message.handler";
import { Logger } from "./utils/logger";
import { SessionService } from "./services/session.service";
import { SummaryHandler } from "./handlers/summary.handler";

const bot = new Telegraf(CONFIG.BOT_TOKEN);
const logger = new Logger();

// Available commands helper function
export async function showAvailableCommands(ctx: any, isLoggedIn: boolean) {
    const baseMessage = "Available Commands:";
    
    const keyboard = isLoggedIn 
        ? [
            [{ text: "📩 Get 10 Messages", callback_data: "get_messages" }],
            [{ text: "📝 Get 10 Messages Summary", callback_data: "get_summary" }],
            [{ text: "🚪 Logout", callback_data: "logout" }]
          ]
        : [
            [{ text: "🔑 Login", callback_data: "login" }]
          ];

    await ctx.reply(baseMessage, {
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
}

// Shortcuts for commands
bot.telegram.setMyCommands([
    { command: 'start', description: 'Start the bot' },
    { command: 'login', description: 'Login to your Telegram account' },
    { command: 'logout', description: 'Logout from your account' },
    { command: 'messages', description: 'Get last 10 messages from a group' },
    { command: 'summary', description: 'Get AI summary of last 10 messages' },
    { command: 'menu', description: 'Show interactive menu' }
]);

// Start command
bot.start(async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) {
        return ctx.reply("❌ Unable to identify you.");
    }

    try {
        const isLoggedIn = await SessionService.load(userId);
        await showAvailableCommands(ctx, !!isLoggedIn);
    } catch (error) {
        logger.error("Error in start command", { error, userId });
        await ctx.reply("❌ An error occurred. Please try again.");
    }
});

// Command handlers
bot.command("login", AuthHandler.handleLogin);
bot.command("logout", AuthHandler.handleLogout);
bot.command("messages", MessageHandler.handleMessages);
bot.command("summary", SummaryHandler.handleSummary);
bot.command('menu', async (ctx) => {
    const userId = ctx.from?.id.toString();
    if (!userId) {
        return ctx.reply("❌ Unable to identify you.");
    }
    const isLoggedIn = await SessionService.load(userId);
    await showAvailableCommands(ctx, !!isLoggedIn);
});

// Handle text messages
bot.on("text", AuthHandler.handleText);

// Callback query handlers
bot.action("get_messages", async (ctx) => {
    await ctx.reply("Please send the group ID in format: /messages <groupId>");
});

bot.action("get_summary", async (ctx) => {
    await ctx.reply("Please send the group ID in format: /summary <groupId>");
});

bot.action("login", async (ctx) => {
    await AuthHandler.handleLogin(ctx);
});

bot.action("logout", async (ctx) => {
    await AuthHandler.handleLogout(ctx);
});

bot.action(/.+/, (ctx) => {
    ctx.answerCbQuery();
});

// Start bot
bot.launch().then(() => logger.info("Bot is running!"));