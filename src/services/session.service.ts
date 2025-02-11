import { PrismaClient } from "@prisma/client";
import { EncryptionService } from "./encryption.service";
import { Logger } from "../utils/logger";

const prisma = new PrismaClient();
const logger = new Logger();

export interface SessionData {
    session: string;
    expiresAt: number;
}

export class SessionService {
    static async load(userId: string): Promise<string | null> {
        try {
            const sessionRecord = await prisma.session.findUnique({ where: { userId } });
            
            if (!sessionRecord || new Date(sessionRecord.expiresAt) < new Date()) return null;
            return EncryptionService.decrypt(sessionRecord.session);
        } catch (error) {
            logger.error(`Failed to load session for user ${userId}`, { error });
            return null;
        }
    }

    static async save(userId: string, session: string): Promise<void> {
        const encryptedSession = EncryptionService.encrypt(session);
        const sessionData: SessionData = {
            session: encryptedSession,
            expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };

        await prisma.session.upsert({
            where: { userId },
            update: { session: sessionData.session, expiresAt: new Date(sessionData.expiresAt) },
            create: { userId, session: sessionData.session, expiresAt: new Date(sessionData.expiresAt) },
        });

        logger.info(`Session saved for user ${userId}.`);
    }

    static async delete(userId: string): Promise<void> {
        await prisma.session.deleteMany({ where: { userId } });
        logger.info(`Session deleted for user ${userId}.`);
    }
} 