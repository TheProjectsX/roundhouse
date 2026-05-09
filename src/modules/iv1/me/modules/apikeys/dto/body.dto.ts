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
    @IsBoolean()
    active?: boolean;
}
