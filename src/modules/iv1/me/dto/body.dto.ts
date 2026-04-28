import { IsOptional, IsString } from "class-validator";

export class UpdateProfileDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    avatar?: string;
}
