import { IsBoolean, IsOptional, IsString } from "class-validator";

export class CreateApiKeysManagerDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    provider?: string;

    @IsString()
    key: string;
}

export class UpdateApiKeysManagerDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    provider?: string;

    @IsOptional()
    @IsString()
    key?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}

export class UnlockApiKeysDto {
    @IsString()
    password: string;
}
