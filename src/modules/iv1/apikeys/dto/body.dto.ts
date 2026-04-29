import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

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

export class CreateProviderApiKeyDto {
    @IsString()
    key: string;

    @IsOptional()
    @toBoolean()
    @IsBoolean()
    active?: boolean;
}

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
