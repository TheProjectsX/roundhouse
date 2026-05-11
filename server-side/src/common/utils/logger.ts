import config from "@/config";

type LogContext = Record<string, unknown> | undefined;

const isDevelopment = () => config.env === "development";

const writeLog = (
    level: "log" | "warn" | "error",
    scope: string,
    message: string,
    context?: LogContext,
) => {
    if (!isDevelopment()) {
        return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${scope}] ${message}`;

    if (context && Object.keys(context).length > 0) {
        console[level](prefix, context);
        return;
    }

    console[level](prefix);
};

export const createDevLogger = (scope: string) => ({
    log: (message: string, context?: LogContext) =>
        writeLog("log", scope, message, context),
    warn: (message: string, context?: LogContext) =>
        writeLog("warn", scope, message, context),
    error: (message: string, context?: LogContext) =>
        writeLog("error", scope, message, context),
});
