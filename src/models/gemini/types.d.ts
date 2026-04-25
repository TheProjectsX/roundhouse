export type RequestPayload = {
    role: "user" | "model";
    parts: Record<"text", string>[];
};
