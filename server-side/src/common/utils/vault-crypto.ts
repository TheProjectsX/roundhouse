import * as crypto from "crypto";

const ENCRYPTED_PREFIX = "enc:v1:";

function getEncryptionKey(): Buffer {
    const secret =
        process.env.VAULT_ENCRYPTION_KEY ||
        process.env.JWT_SECRET ||
        "roundhouse-dev-vault-key";
    return crypto.createHash("sha256").update(secret).digest();
}

export function encryptVaultKey(value: string): string {
    if (!value || value.startsWith(ENCRYPTED_PREFIX)) {
        return value;
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
    const encrypted = Buffer.concat([
        cipher.update(value, "utf8"),
        cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return `${ENCRYPTED_PREFIX}${iv.toString("base64")}:${authTag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptVaultKey(value: string): string {
    if (!value || !value.startsWith(ENCRYPTED_PREFIX)) {
        return value;
    }

    const payload = value.slice(ENCRYPTED_PREFIX.length);
    const parts = payload.split(":");
    if (parts.length !== 3) {
        return value;
    }

    const [ivB64, tagB64, dataB64] = parts;
    const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        getEncryptionKey(),
        Buffer.from(ivB64, "base64"),
    );
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));

    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataB64, "base64")),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}
