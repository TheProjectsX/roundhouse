export const InternalResponses = {
    API_KEY_NOTFOUND: {
        code: "RH101",
        status_code: 404,
        message: "API Key not found!",
    },
    API_KEY_INACTIVE: {
        code: "RH102",
        status_code: 400,
        message: "API Key is inactive!",
    },
};

export type InternalResponseCodes = keyof typeof InternalResponses;
