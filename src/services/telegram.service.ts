import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { CONFIG } from "../config/config";
import { SessionService } from "./session.service";
import { Logger } from "../utils/logger";

const logger = new Logger();

export class TelegramService {
    static createNewClient(): TelegramClient {
        return new TelegramClient(
            new StringSession(""), 
            CONFIG.API_ID, 
            CONFIG.API_HASH, 
            { connectionRetries: 5 }
        );
    }

    static async initializeClient(userId: string): Promise<TelegramClient> {
        const savedSession = await SessionService.load(userId);
        
        if (!savedSession) return this.createNewClient();

        const client = new TelegramClient(
            new StringSession(savedSession),
            CONFIG.API_ID, 
            CONFIG.API_HASH, 
            { connectionRetries: 5 }
        );

        try {
            await client.connect();
            if (!await client.checkAuthorization()) {
                await SessionService.delete(userId);
                return this.createNewClient();
            }
            return client;
        } catch (error) {
            logger.error('Client initialization error:', { error, userId });
            await SessionService.delete(userId);
            return this.createNewClient();
        }
    }
} 