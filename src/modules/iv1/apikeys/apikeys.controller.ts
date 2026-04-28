import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { ReqField } from "@/common/decorators/request.decorator";
import { UserPayload } from "@/common/guards/auth.guard";
import {
    CreateApiKeyDto,
    UpdateApiKeyDto,
    UpdateApiKeyStatusDto,
} from "./dto/body.dto";
import { ApikeysService } from "./apikeys.service";

@ApiTags("ApiKeys")
@Controller("")
export class ApikeysController {
    constructor(private apikeysService: ApikeysService) {}

    @Get()
    @ApiOperation({ summary: "List API keys" })
    async fetchAllApiKeys(
        @Query() query: Record<string, string>,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.fetchAllApiKeys(query, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Get(":id")
    @ApiOperation({ summary: "Get API key details" })
    async fetchSingleApiKey(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.fetchSingleApiKey(id, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Post()
    @ApiOperation({ summary: "Create API key" })
    async createApiKey(
        @Body() payload: CreateApiKeyDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.createApiKey(payload, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Patch()
    @ApiOperation({ summary: "Update API key" })
    async updateApiKey(
        @Body() payload: UpdateApiKeyDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKey(payload, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/status")
    @ApiOperation({ summary: "Update API key status" })
    async updateApiKeyStatus(
        @Param("id") id: string,
        @Body() payload: UpdateApiKeyStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKeyStatus(
            { ...payload, id },
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id")
    @ApiOperation({ summary: "Delete API key" })
    async deleteApiKey(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.deleteApiKey(id, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }

    @Post(":id/providers/:providerId")
    @ApiOperation({ summary: "Select provider for API key" })
    async createApiKeyProvider(
        @Param("id") id: string,
        @Param("providerId") providerId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.createApiKeyProvider(
            id,
            providerId,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id/providers/:providerId")
    @ApiOperation({ summary: "Deselect provider for API key" })
    async deleteApiKeyProvider(
        @Param("id") id: string,
        @Param("providerId") providerId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.deleteApiKeyProvider(
            id,
            providerId,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }

    @Patch(":id/providers/:providerId/status")
    @ApiOperation({ summary: "Toggle provider active for API key" })
    async updateApiKeyProviderStatus(
        @Param("id") id: string,
        @Param("providerId") providerId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKeyProviderStatus(
            id,
            providerId,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/models/:modelId/status")
    @ApiOperation({ summary: "Toggle model active for API key" })
    async updateApiKeyModelStatus(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKeyModelStatus(
            id,
            modelId,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
