import crypto from "crypto";

export const generateApiKey = (totalLength: number = 32): string => {
    const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";
    const PREFIX = "rh_prod_";
    const segCount = 3;
    const dots = segCount - 1;
    const available = totalLength - PREFIX.length - dots;

    if (available < segCount)
        throw new Error(`totalLength ${totalLength} too short`);

    const base = Math.floor(available / segCount);
    const remainder = available % segCount;

    const randSeg = (len: number): string =>
        Array.from(crypto.getRandomValues(new Uint8Array(len)))
            .map((b) => ALPHABET[b % ALPHABET.length])
            .join("");

    const segments = Array.from({ length: segCount }, (_, i) =>
        randSeg(i < remainder ? base + 1 : base),
    );

    return `${PREFIX}${segments.join(".")}`;
};
