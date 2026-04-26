import { prisma } from "@/lib/prisma";
import { UserPayload } from "@/middlewares/auth.middleware";
import { checkApiKeyError } from "@/core/utils/errorChecker.util";

export type SelectProviderError = {
    success: false;
    code: string;
    status_code: number;
    message: string;
};

type SelectProviderResponse = SelectProviderError | {};

export const selectProvider = async (
    apiKey: string,
    user: UserPayload,
): Promise<SelectProviderResponse> => {
    const apiKeyData = await prisma.apiKey.findUnique({
        where: { key: apiKey, userId: user.id },
        include: {
            providerSelections: {
                where: { active: true },
                include: {
                    providers: true,
                    userProviders: true,
                    modelSelections: {
                        where: {
                            active: true,
                        },
                        include: {
                            models: true,
                            userModels: true,
                        },
                    },
                },
            },
        },
    });

    const apiKeyError = checkApiKeyError(apiKeyData);
    if (apiKeyData) {
        return { success: false, ...apiKeyError };
    }

    return {};
};
