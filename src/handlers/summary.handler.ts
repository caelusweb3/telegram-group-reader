import { Logger } from "../utils/logger";
import { TelegramService } from "../services/telegram.service";
import { LLMService } from "../services/llm.service";
import { Api } from "telegram";
import { SessionService } from "../services/session.service";
import { showAvailableCommands } from "../bot";

const logger = new Logger();

export class SummaryHandler {
    static async handleSummary(ctx: any) {
        try {
            logger.info('Handling summary request:', { 
                userId: ctx.from?.id.toString(),
                messageText: ctx.message?.text
            });

            const userId = ctx.from?.id.toString();
            if (!userId) {
                return ctx.reply("❌ Unable to identify you.");
            }

            const groupId = ctx.message?.text?.split(" ")[1];
            if (!groupId) {
                return ctx.reply("❌ Please provide a group ID: /summary <groupId>");
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

                // Get messages
                const messages = await client.getMessages(groupId, { 
                    limit: 10,
                    reverse: false
                });
                
                if (!messages || messages.length === 0) {
                    return ctx.reply("ℹ️ No messages found in this group.");
                }

                // Generate summary
                await ctx.reply("🤔 Generating summary...");
                const summary = await LLMService.summarizeMessages(messages);
                
                const response = "📝 Summary of last 10 messages:\n\n" + summary;
                await ctx.reply(response);
                
                const isLoggedIn = await SessionService.load(userId);
                await showAvailableCommands(ctx, !!isLoggedIn);
            } catch (error: any) {
                logger.error("Summary generation failed", { error, userId, groupId });
                await ctx.reply("❌ Failed to generate summary. Please try again later.");
            }
        } catch (error: any) {
            logger.error("Summary handler failed", { 
                error: error.message,
                stack: error.stack,
                userId: ctx.from?.id.toString()
            });
            await ctx.reply("❌ An error occurred. Please try again.");
        }
    }
} 