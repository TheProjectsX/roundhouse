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
    CreateApiKeyProviderDto,
    UpdateApiKeyDto,
    UpdateApiKeyModelSelectionPriorityDto,
    UpdateApiKeyProviderModelsDto,
    UpdateApiKeyProviderModelsStatusDto,
    UpdateApiKeySettingsDto,
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

    @Patch(":id")
    @ApiOperation({ summary: "Update API key" })
    async updateApiKey(
        @Param("id") id: string,
        @Body() payload: UpdateApiKeyDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKey(
            id,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Get(":id/models")
    @ApiOperation({ summary: "Get all model selections for an API key" })
    async fetchApiKeyModelSelections(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.fetchApiKeyModelSelections(
            id,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/models/priority")
    @ApiOperation({
        summary: "Update model selection priorities for an API key",
    })
    async reorderApiKeyModelSelections(
        @Param("id") id: string,
        @Body() payload: UpdateApiKeyModelSelectionPriorityDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.reorderApiKeyModelSelections(
            id,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/settings")
    @ApiOperation({ summary: "Update API key settings" })
    async updateApiKeySettings(
        @Param("id") id: string,
        @Body() payload: UpdateApiKeySettingsDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKeySettings(
            id,
            payload,
            user,
        );

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
            id,
            payload,
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
        @Body() payload: CreateApiKeyProviderDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.createApiKeyProvider(
            id,
            providerId,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id/selections/:selectionId")
    @ApiOperation({ summary: "Remove provider selection from API key" })
    async deleteApiKeySelection(
        @Param("id") id: string,
        @Param("selectionId") selectionId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.deleteApiKeySelection(
            id,
            selectionId,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/providers/:providerId/models")
    @ApiOperation({ summary: "Select models for provider under API key" })
    async selectApiKeyProviderModels(
        @Param("id") id: string,
        @Param("providerId") providerId: string,
        @Body() payload: UpdateApiKeyProviderModelsDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.selectApiKeyProviderModels(
            id,
            providerId,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id/providers/:providerId/models")
    @ApiOperation({ summary: "Deselect models for provider under API key" })
    async deselectApiKeyProviderModels(
        @Param("id") id: string,
        @Param("providerId") providerId: string,
        @Body() payload: UpdateApiKeyProviderModelsDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.deselectApiKeyProviderModels(
            id,
            providerId,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/providers/:providerId/status")
    @ApiOperation({ summary: "Update provider selection status under API key" })
    async updateApiKeyProviderStatus(
        @Param("id") id: string,
        @Param("providerId") providerId: string,
        @Body() payload: UpdateApiKeyProviderModelsStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKeyProviderStatus(
            id,
            providerId,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/models/:modelId/status")
    @ApiOperation({ summary: "Update model selection status under API key" })
    async updateApiKeyModelStatus(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @Body() payload: UpdateApiKeyProviderModelsStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.apikeysService.updateApiKeyModelStatus(
            id,
            modelId,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
