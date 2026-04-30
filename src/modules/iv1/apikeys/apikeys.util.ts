import { nanoid } from "nanoid";
import crypto from "crypto";

type ApiKeyOptions = {
    length?: number;
    prefix?: string;
    env?: "dev" | "prod" | "test";
};

export const generateApiKey = ({
    length = 32,
    prefix = "rh",
    env = "prod",
}: ApiKeyOptions = {}): string => {
    const randomPart = nanoid(length);

    // timestamp (base36 = shorter)
    const timestamp = Date.now().toString(36);

    // small hash for integrity / uniqueness
    const hash = crypto
        .createHash("sha256")
        .update(randomPart + timestamp)
        .digest("hex")
        .slice(0, 8);

    return `${prefix}_${env}_${timestamp}_${randomPart}_${hash}`;
};
