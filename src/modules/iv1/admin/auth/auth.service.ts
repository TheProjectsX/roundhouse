import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import { BcryptService } from "@/common/utils/bcrypt.service";
import config from "@/config";
import { ApiError } from "@/common/errors/api_error";
import { AdminLoginDto } from "./dto/body.dto";

@Injectable()
export class AdminAuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
        private bcrypt: BcryptService,
    ) {}

    async createAdminSession(payload: AdminLoginDto) {
        const user = await this.prisma.user.findFirst({
            where: { email: payload.email, role: "ADMIN" },
            select: { id: true, email: true, password: true },
        });

        if (!user || !user.password) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid Credentials");
        }

        const passwordMatched = await this.bcrypt.compare(
            payload.password,
            user.password,
        );

        if (!passwordMatched) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid Credentials");
        }

        const accessToken = this.jwt.sign(
            { id: user.id, email: user.email },
            {
                secret: config.jwt.jwt_secret,
                expiresIn: config.jwt.jwt_secret_expires_in,
            },
        );

        return { message: "Admin login successful", data: { accessToken } };
    }
}
