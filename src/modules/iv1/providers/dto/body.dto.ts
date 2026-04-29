import { ContentStatus, ProviderType } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUrl,
    Max,
    Min,
} from "class-validator";

const toBoolean = () =>
    Transform(({ value }) => {
        if (value === true || value === "true") return true;
        if (value === false || value === "false") return false;
        return value;
    });

export class ProviderModelBodyDto {
    @IsString()
    name: string;

    @IsString()
    code: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    maxTokens?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    tokenResetInterval?: number;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    @Max(1)
    efficiencyScore?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    bestFor?: string[];

    @IsOptional()
    @IsEnum(ContentStatus)
    status?: ContentStatus;
}

export class CreateProviderDto {
    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsUrl()
    baseApi: string;

    @IsOptional()
    @IsBoolean()
    @toBoolean()
    free?: boolean;

    @IsOptional()
    @IsEnum(ProviderType)
    type?: ProviderType;

    @IsOptional()
    @IsEnum(ContentStatus)
    status?: ContentStatus;

    @IsOptional()
    @Type(() => ProviderModelBodyDto)
    model?: ProviderModelBodyDto;
}

export class UpdateProviderDto {
    @IsString()
    id: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsUrl()
    baseApi?: string;

    @IsOptional()
    @IsBoolean()
    @toBoolean()
    free?: boolean;

    @IsOptional()
    @IsEnum(ProviderType)
    type?: ProviderType;

    @IsOptional()
    @IsEnum(ContentStatus)
    status?: ContentStatus;
}

export class UpdateProviderStatusDto {
    @IsString()
    id: string;

    @IsEnum(ContentStatus)
    status: ContentStatus;
}

export class UpdateProviderModelDto extends ProviderModelBodyDto {
    @IsString()
    modelId: string;
}

export class UpdateProviderModelStatusDto {
    @IsString()
    modelId: string;

    @IsEnum(ContentStatus)
    status: ContentStatus;
}

export class CreateProviderModelDto extends ProviderModelBodyDto {}
