import * as crypto from "crypto";
import { CONFIG } from "../config/config";

export class EncryptionService {
    static encrypt(session: string): string {
        const key = Buffer.from(CONFIG.SESSION_SECRET, "hex");
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
        let encrypted = cipher.update(session, "utf8", "hex");
        encrypted += cipher.final("hex");
        return `${iv.toString("hex")}:${encrypted}`;
    }

    static decrypt(encryptedSession: string): string {
        const [ivHex, contentHex] = encryptedSession.split(":");
        const key = Buffer.from(CONFIG.SESSION_SECRET, "hex");
        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
        let decrypted = decipher.update(contentHex, "hex", "utf8");
        decrypted += decipher.final("utf8");
        return decrypted;
    }
} 