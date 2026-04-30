import { ContentStatus, ProviderType } from "@prisma/client";
import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
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
    @ApiPropertyOptional({
        enum: ProviderType,
        enumName: "ProviderType",
        default: ProviderType.CUSTOM,
    })
    @IsEnum(ProviderType)
    type?: ProviderType;

    @IsOptional()
    @ApiPropertyOptional({
        enum: ContentStatus,
        enumName: "ContentStatus",
        default: ContentStatus.ACTIVE,
    })
    @IsEnum(ContentStatus)
    status?: ContentStatus;
}

export class UpdateProviderDto extends PartialType(CreateProviderDto) {}

export class UpdateProviderStatusDto {
    @ApiProperty({ enum: ContentStatus, enumName: "ContentStatus" })
    @IsEnum(ContentStatus)
    status: ContentStatus;
}

export class CreateProviderModelDto {
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
    @ApiPropertyOptional({
        enum: ContentStatus,
        enumName: "ContentStatus",
        default: ContentStatus.ACTIVE,
    })
    @IsEnum(ContentStatus)
    status?: ContentStatus;
}

export class UpdateProviderModelDto extends PartialType(
    CreateProviderModelDto,
) {}

export class UpdateProviderModelStatusDto {
    @ApiProperty({
        enum: ContentStatus,
        enumName: "ContentStatus",
        default: ContentStatus.ACTIVE,
    })
    @IsEnum(ContentStatus)
    status: ContentStatus;
}
