import OpenAI from "openai";
import { Logger } from "../utils/logger";
import { CONFIG } from "../config/config";

const logger = new Logger();

export class LLMService {
    private static openai = new OpenAI({
        apiKey: CONFIG.OPENAI_API_KEY
    });

    static async summarizeMessages(messages: any[]): Promise<string> {
        try {
            const formattedMessages = messages.map((msg: any) => {
                const sender = msg.fromId?.userId || msg.peerId?.userId || "Unknown";
                const content = msg.message || "[Media Message]";
                return `User${sender}: ${content}`;
            }).join("\n");

            const response = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [{
                    role: "user",
                    content: `Summarize these Telegram group messages in a concise way:\n\n${formattedMessages}\n\nSummary:`
                }],
                temperature: 0.7,
                max_tokens: 150
            });

            return response.choices[0].message.content || "Unable to generate summary.";
        } catch (error) {
            logger.error("LLM summarization failed", { error });
            throw new Error("Failed to generate summary");
        }
    }
} 