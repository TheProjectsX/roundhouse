import { Transform } from "class-transformer";
import {
    ArrayNotEmpty,
    IsArray,
    IsBoolean,
    IsOptional,
    IsString,
} from "class-validator";

const toBoolean = () =>
    Transform(({ value }) => {
        if (value === true || value === "true") return true;
        if (value === false || value === "false") return false;
        return value;
    });

export class CreateApiKeyDto {
    @IsString()
    name: string;
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

export class CreateApiKeyProviderDto {
    @IsArray()
    @ArrayNotEmpty()
    @IsString({ each: true })
    apiKeysManagerIds: string[];
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
