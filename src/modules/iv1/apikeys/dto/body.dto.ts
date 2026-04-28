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
    @IsString()
    id: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsBoolean()
    active?: boolean;
}

export class UpdateApiKeyStatusDto {
    @IsString()
    id: string;

    @toBoolean()
    @IsBoolean()
    active: boolean;
}
