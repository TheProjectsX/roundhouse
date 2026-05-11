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
    NO_AVAILABLE_MODELS: {
        code: "RH201",
        status_code: 400,
        message: "No available models found for this API Key.",
    },
    MODEL_NOT_FOUND: {
        code: "RH202",
        status_code: 404,
        message: "Requested model/provider filters did not match any model.",
    },
    MAX_ITERATIONS: {
        code: "RH301",
        status_code: 409,
        message: "Maximum roundhouse iterations reached.",
    },
};

export type InternalResponseCodes = keyof typeof InternalResponses;
