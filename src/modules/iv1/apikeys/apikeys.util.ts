import { nanoid } from "nanoid";

export const generateRandomApiKey = (length: number = 28): string => {
    const PREFIX = "rh_";
    const apiKey = nanoid(length);

    return PREFIX + apiKey;
};
