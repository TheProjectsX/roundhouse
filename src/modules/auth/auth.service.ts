import { PrismaService } from "@/common/services/prisma/prisma.service";
import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ApiError } from "@/common/errors/api_error";
import { BcryptService } from "@/common/utils/bcrypt.service";
import { generateOTP } from "./auth.utils";
import config from "@/config";
import {
    generateForgetPasswordTemplate,
    generateForgotPasswordOTPTemplate,
    generateVerifyOTPTemplate,
} from "./auth.template";
import {
    ChangePasswordDto,
    ForgotPasswordDto,
    LoginUserDto,
    RefreshTokenDto,
    RegisterUserDto,
    ResendOtpDto,
    ResetPasswordDto,
    SendForgotPasswordOtpDto,
    VerifyForgotPasswordOtpDto,
    VerifyOtpDto,
} from "./dto/body.dto";
import { UserPayload } from "@/common/guards/auth.guard";
import { sendEmail } from "@/common/services/email";

@Injectable()
export class AuthService {
    constructor(
        private jwtService: JwtService,
        private bcryptService: BcryptService,
        private prisma: PrismaService,
    ) {}

    async register(payload: RegisterUserDto) {
        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: { email: payload.email },
        });

        if (userData) {
            throw new ApiError(
                HttpStatus.CONFLICT,
                "User with this Email already exists!",
            );
        }

        const hashedPassword: string = await this.bcryptService.hash(
            payload.password,
            config.password.salt,
        );
        const response = await prisma.user.create({
            data: {
                email: payload.email,
                password: hashedPassword,
                name: payload.name,
            },
        });

        return {
            message: "Registration successful",
            data: { id: response.id, email: response.email },
        };
    }

    async loginWithEmail(payload: LoginUserDto) {
        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: {
                email: payload.email,
            },
        });
        if (!userData) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid Credentials");
        }

        if (!payload.password || !userData?.password) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid Credentials");
        }

        const passwordMatched = await this.bcryptService.compare(
            payload.password,
            userData.password,
        );

        if (!passwordMatched) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Invalid Credentials");
        }

        if (userData.status === "INACTIVE")
            throw new ApiError(
                HttpStatus.FORBIDDEN,
                "This account is Inactive",
            );
        const jwtPayload = {
            id: userData.id,
            email: userData.email,
        } satisfies UserPayload;

        const accessToken = this.jwtService.sign(jwtPayload, {
            secret: config.jwt.jwt_secret,
            expiresIn: config.jwt.jwt_secret_expires_in,
        });
        const refreshToken = this.jwtService.sign(jwtPayload, {
            secret: config.jwt.refresh_token_secret,
            expiresIn: config.jwt.refresh_token_expires_in,
        });

        return {
            message: "Login successful",
            data: {
                refreshToken,
                accessToken,
            },
        };
    }

    async sendOTP(payload: ResendOtpDto) {
        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: {
                email: payload.email,
            },
        });

        if (!userData) {
            throw new ApiError(404, "User not found");
        }

        return {
            message: "OTP flow is not available with the migrated schema",
        };
    }

    async verifyOTP(payload: VerifyOtpDto) {
        void payload;

        return {
            message: "OTP flow is not available with the migrated schema",
        };
    }

    async sendForgotPasswordOtp(payload: SendForgotPasswordOtpDto) {
        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: {
                email: payload.email,
            },
        });

        if (!userData) {
            throw new ApiError(404, "User not found");
        }

        return {
            message: "Forgot-password OTP flow is not available with the migrated schema",
        };
    }

    async verifyForgotPasswordOTP(payload: VerifyForgotPasswordOtpDto) {
        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: {
                email: payload.email,
            },
        });

        if (!userData) {
            throw new ApiError(404, "User not found");
        }

        const jwtPayload = { email: userData.email };

        const resetPassToken = this.jwtService.sign(jwtPayload, {
            secret: config.jwt.reset_token_secret,
            expiresIn: config.jwt.reset_token_expires_in,
        });

        return {
            message: "OTP Verification successful",
            data: { token: resetPassToken },
        };
    }

    async changePassword(payload: ChangePasswordDto, user: UserPayload) {
        if (!payload.oldPassword || !payload.newPassword) {
            throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid Body Provided");
        }

        const prisma = this.prisma as any;
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userData) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found!");
        }

        if (!userData?.password) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                "Unauthenticated Request!",
            );
        }

        const passwordValid = await this.bcryptService.compare(
            payload.oldPassword,
            userData?.password,
        );

        if (!passwordValid) {
            throw new ApiError(HttpStatus.UNAUTHORIZED, "Incorrect Password");
        }

        const hashedPassword = await this.bcryptService.hash(
            payload.newPassword,
            config.password.salt,
        );

        await prisma.user.update({
            where: {
                id: user.id,
            },
            data: {
                password: hashedPassword,
            },
        });
        return { message: "Password Changed successfully" };
    }

    async forgotPassword(payload: ForgotPasswordDto) {
        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: {
                email: payload.email,
            },
        });
        if (!userData) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
        }

        const jwtPayload = { email: userData.email };
        const resetPassToken = this.jwtService.sign(jwtPayload, {
            secret: config.jwt.reset_token_secret,
            expiresIn: config.jwt.reset_token_expires_in,
        });

        const resetPassLink =
            config.url.reset_pass +
            `?userId=${userData.id}&token=${resetPassToken}`;

        const html = generateForgetPasswordTemplate(resetPassLink);
        await sendEmail({
            email: userData.email,
            subject: `Password Reset Request - ${config.company_name}`,
            html,
        });

        return {
            message: "Password Reset Instructions sent to Email",
        };
    }

    async refreshToken(payload: RefreshTokenDto) {
        if (!payload.refreshToken) {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "refreshToken is required",
            );
        }

        let decrypted: UserPayload | undefined;
        try {
            decrypted = this.jwtService.verify(payload.refreshToken, {
                secret: config.jwt.refresh_token_secret,
            });
        } catch {
            throw new ApiError(
                HttpStatus.BAD_REQUEST,
                "Refresh Token is Invalid or Expired",
            );
        }

        const prisma = this.prisma as any;
        const userData = await prisma.user.findUnique({
            where: { id: decrypted.id },
        });

        if (!userData) {
            throw new ApiError(
                HttpStatus.UNAUTHORIZED,
                "Unauthenticated Request",
            );
        }

        const jwtPayload = {
            id: userData.id,
            email: userData.email,
        };

        const accessToken = this.jwtService.sign(jwtPayload, {
            secret: config.jwt.jwt_secret,
            expiresIn: config.jwt.jwt_secret_expires_in,
        });

        return {
            data: { accessToken },
            message: "Access Token generated",
        };
    }

    async resetPassword(payload: ResetPasswordDto) {
        let decrypted: UserPayload | undefined;

        try {
            decrypted = this.jwtService.verify(payload.token, {
                secret: config.jwt.reset_token_secret,
            });
        } catch {
            throw new ApiError(HttpStatus.BAD_REQUEST, "Invalid Token");
        }

        const prisma = this.prisma as any;
        const userData = await prisma.user.findFirst({
            where: {
                email: decrypted.email,
            },
        });

        if (!userData) {
            throw new ApiError(HttpStatus.NOT_FOUND, "User not found");
        }

        const password = await this.bcryptService.hash(
            payload.password,
            config.password.salt,
        );

        await prisma.user.update({
            where: {
                id: userData.id,
            },
            data: {
                password,
            },
        });
        return { message: "Password Reset successful" };
    }
}
