import { Context } from "telegraf";
import { TelegramService } from "../services/telegram.service";
import { Logger } from "../utils/logger";
import { Api } from "telegram";
import { group } from "console";
import { SessionService } from "../services/session.service";
import { showAvailableCommands } from "../bot";

const logger = new Logger();

export class MessageHandler {
    static async handleMessages(ctx: any) {
        try {
            const userId = ctx.from?.id.toString();
            if (!userId) {
                return ctx.reply("❌ Unable to identify you.");
            }

            const groupId = ctx.message?.text?.split(" ")[1];
            if (!groupId) {
                return ctx.reply("❌ Please provide a group ID: /messages <groupId>");
            }

            const client = await TelegramService.initializeClient(userId);
            if (!client) {
                return ctx.reply("❌ Please login first using /login");
            }

            try {
                await client.connect();

                // Check if user is a participant
                try {
                    await client.invoke(new Api.channels.GetParticipant({
                        channel: groupId,
                        participant: userId
                    }));
                } catch (error) {
                    logger.info('Group participation check failed:', { error, userId, groupId });
                    return ctx.reply("❌ You are not a member of this group. Please join the group first.");
                }

                // If we get here, user has access
                const messages = await client.getMessages(groupId, { 
                    limit: 10,
                    reverse: false  // Get messages in chronological order
                });
                
                if (!messages || messages.length === 0) {
                    return ctx.reply("ℹ️ No messages found in this group.");
                }

                let response = "📩 Last 10 messages:\n\n";
                messages.forEach((msg: any, i) => {
                    const sender = msg.fromId?.userId || msg.peerId?.userId || "Unknown";
                    const content = msg.message || "[Media Message]";
                    response += `${i + 1}. User${sender}: ${content}\n`;
                });

                await ctx.reply(response);
                const isLoggedIn = await SessionService.load(userId);
                await showAvailableCommands(ctx, !!isLoggedIn);

            } catch (error: any) {
                logger.error("Group access error", { 
                    error: error.message, 
                    userId, 
                    groupId 
                });
            }
        } catch (error: any) {
            logger.error("Failed to fetch messages", { 
                error: error.message,
                stack: error.stack,
                userId: ctx.from?.id.toString(),
                messageText: ctx.message?.text
            });
            await ctx.reply("❌ Failed to fetch messages. Please check the group ID and your permissions.");
        }
    }
} 