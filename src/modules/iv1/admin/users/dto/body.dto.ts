import { UserStatus } from "@prisma/client";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString } from "class-validator";

export class UpdateUserDto {
    @IsString()
    id: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    avatar?: string;
}

export class UpdateUserStatusDto {
    @IsString()
    id: string;

    @ApiProperty({ enum: UserStatus, enumName: "UserStatus" })
    @IsEnum(UserStatus)
    status: UserStatus;
}
