import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

export class RegisterUserDto {
    @IsString()
    name: string;

    @IsEmail()
    email: string;

    @IsPhoneNumber()
    phone: string;

    @IsString()
    password: string;
}

export class LoginUserDto {
    @IsEmail()
    email: string;

    @IsString()
    password: string;
}

export class ResetPasswordDto {
    @IsString()
    token: string;

    @IsString()
    password: string;
}

export class ChangePasswordDto {
    @IsString()
    oldPassword: string;

    @IsString()
    newPassword: string;
}

export class VerifyOtpDto {
    @IsString()
    otp: string;

    @IsEmail()
    email: string;
}

export class ResendOtpDto {
    @IsEmail()
    email: string;
}

export class SendForgotPasswordOtpDto {
    @IsEmail()
    email: string;
}

export class VerifyForgotPasswordOtpDto {
    @IsString()
    otp: string;

    @IsEmail()
    email: string;
}

export class ForgotPasswordDto {
    @IsEmail()
    email: string;
}

export class RefreshTokenDto {
    @IsString()
    refreshToken: string;
}
