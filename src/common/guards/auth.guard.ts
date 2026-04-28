import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { Reflector } from "@nestjs/core";
import { IS_PUBLIC_KEY } from "@/common/decorators/auth.decorator";
import config from "@/config";
import { PrismaService } from "@/common/services/prisma/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private reflector: Reflector,
        private prisma: PrismaService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );

        if (isPublic) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException("Invalid Token");
        }
        try {
            const payload = await this.jwtService.verifyAsync(token, {
                secret: config.jwt.jwt_secret,
            });

            const user = await this.prisma.user.findUnique({
                where: {
                    id: payload.id,
                },
                select: {
                    id: true,
                    email: true,
                    status: true,
                },
            });

            if (!user) {
                throw new UnauthorizedException("Unauthorized Request");
            }

            if (user.status === "INACTIVE") {
                throw new UnauthorizedException("User is inactive");
            }

            request["user"] = {
                id: user.id,
                email: user.email,
            };
        } catch {
            throw new UnauthorizedException("Invalid token");
        }
        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        const token = request.headers.authorization?.split(" ")[1];
        return token;
    }
}

export type UserPayload = {
    id: string;
    email: string;
};
