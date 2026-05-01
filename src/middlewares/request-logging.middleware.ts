import { Injectable, NestMiddleware, Logger } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
    private logger = new Logger("HTTP");

    use(req: Request, res: Response, next: NextFunction) {
        const { method, originalUrl, ip } = req;
        const userAgent = req.get("user-agent") || "Unknown";
        const startTime = Date.now();
        const logger = this.logger;
        const [path, queryString] = originalUrl.split("?");

        // Intercept multiple response methods
        const originalSend = res.send;
        const originalJson = res.json;

        const logResponse = (data: any) => {
            const responseTime = Date.now() - startTime;
            const statusCode = res.statusCode;
            const contentLength = Buffer.byteLength(
                typeof data === "string" ? data : JSON.stringify(data)
            );

            const timestamp = new Date().toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });

            // Colored console output
            const statusColor =
                statusCode >= 500
                    ? "\x1b[91m"
                    : statusCode >= 400
                      ? "\x1b[93m"
                      : "\x1b[92m";
            const reset = "\x1b[0m";

            const fullPath = queryString ? `${path}?${queryString}` : path;
            const responseTimeFormatted = `${responseTime}ms`;

            console.log(
                `${reset}[${timestamp}] ${method.padEnd(6)} ${statusColor}${statusCode}${reset} ${responseTimeFormatted.padEnd(8)} ${fullPath}`
            );

            // Also log detailed metadata for debugging
            logger.debug({
                method,
                path,
                query: queryString || null,
                statusCode,
                responseTime,
                contentLength,
                ip,
            });
        };

        res.send = function (data: any) {
            logResponse(data);
            return originalSend.call(this, data);
        };

        res.json = function (data: any) {
            logResponse(data);
            return originalJson.call(this, data);
        };

        // Also log on response finish event as fallback
        res.on("finish", () => {
            if (!res.headersSent) return;
            const responseTime = Date.now() - startTime;
            const timestamp = new Date().toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
            });
            const statusColor =
                res.statusCode >= 500
                    ? "\x1b[91m"
                    : res.statusCode >= 400
                      ? "\x1b[93m"
                      : "\x1b[92m";
            const reset = "\x1b[0m";
            const fullPath = queryString ? `${path}?${queryString}` : path;

            console.log(
                `${reset}[${timestamp}] ${method.padEnd(6)} ${statusColor}${res.statusCode}${reset} ${responseTime.toString().padEnd(8)}ms ${fullPath}`
            );
        });

        next();
    }
}
