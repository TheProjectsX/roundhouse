import { InternalResponses } from "../constants/response";

export type ApiKeyError = {
    code: string;
    status_code: number;
    message: string;
};

export const checkApiKeyError = (
    data: (Record<string, any> & { active: boolean }) | null,
): ApiKeyError | undefined => {
    if (!data) {
        return InternalResponses.API_KEY_NOTFOUND;
    }

    if (!data.active) {
        return InternalResponses.API_KEY_INACTIVE;
    }
};
