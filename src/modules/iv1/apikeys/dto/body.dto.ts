import { Transform, Type } from "class-transformer";
import { RoundhouseMethod as PrismaRoundhouseMethod } from "@prisma/client";
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsEnum,
    IsInt,
    IsOptional,
    IsString,
    Min,
    ValidateNested,
} from "class-validator";

export enum RoundhouseMethod {
    RANDOM = "RANDOM",
    EFFICIENCY = "EFFICIENCY",
    PRIORITY = "PRIORITY",
}

const toBoolean = () =>
    Transform(({ value }) => {
        if (value === true || value === "true") return true;
        if (value === false || value === "false") return false;
        return value;
    });

const toNumber = () =>
    Transform(({ value }) => {
        if (value === undefined || value === null || value === "") {
            return value;
        }

        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : value;
    });

export class CreateApiKeyDto {
    @IsString()
    name: string;

    @IsOptional()
    @toNumber()
    @IsInt()
    @Min(1)
    maxIterations?: number;

    @IsOptional()
    @IsEnum(RoundhouseMethod)
    roundhouseMethod?: PrismaRoundhouseMethod;
}

export class UpdateApiKeyDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}

export class UpdateApiKeyStatusDto {
    @toBoolean()
    @IsBoolean()
    active: boolean;
}

export class UpdateApiKeySettingsDto {
    @IsOptional()
    @toNumber()
    @IsInt()
    @Min(1)
    maxIterations?: number;

    @IsOptional()
    @IsEnum(RoundhouseMethod)
    roundhouseMethod?: PrismaRoundhouseMethod;
}

export class ModelSelectionPriorityItemDto {
    @IsString()
    modelSelectionId: string;

    @toNumber()
    @IsInt()
    @Min(1)
    priority: number;
}

export class UpdateApiKeyModelSelectionPriorityDto {
    @IsArray()
    @ArrayNotEmpty()
    @ValidateNested({ each: true })
    @Type(() => ModelSelectionPriorityItemDto)
    items: ModelSelectionPriorityItemDto[];
}

export class CreateProviderApiKeyDto {
    @IsString()
    key: string;

    @IsOptional()
    @toBoolean()
    @IsBoolean()
    active?: boolean;
}

export class CreateApiKeyProviderDto extends CreateProviderApiKeyDto {}

export class UpdateProviderApiKeyDto {
    @IsOptional()
    @IsString()
    key?: string;

    @IsOptional()
    @toBoolean()
    @IsBoolean()
    active?: boolean;
}

export class UpdateProviderApiKeyStatusDto {
    @toBoolean()
    @IsBoolean()
    active: boolean;
}

export class UpdateApiKeyProviderModelsDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    modelIds: string[];
}

export class UpdateApiKeyProviderModelsStatusDto {
    @toBoolean()
    @IsBoolean()
    active: boolean;
}
