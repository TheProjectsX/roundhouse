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
    CreateProviderDto,
    CreateProviderModelDto,
    UpdateProviderDto,
    UpdateProviderModelDto,
    UpdateProviderModelStatusDto,
    UpdateProviderStatusDto,
} from "@/modules/iv1/providers/dto/body.dto";
import { MeProvidersService } from "./providers.service";

@ApiTags("Me - Custom Providers")
@Controller("providers")
export class MeProvidersController {
    constructor(private meProvidersService: MeProvidersService) {}

    @Get()
    @ApiOperation({ summary: "List user's custom providers" })
    async fetchAllProviders(
        @Query() query: Record<string, string>,
        @ReqField("user") user: UserPayload,
    ) {
        void user; // Use context
        const result = await this.meProvidersService.fetchAllProviders(query);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Get(":id")
    @ApiOperation({ summary: "Get user's custom provider details" })
    async fetchSingleProvider(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.fetchSingleProvider(
            id,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Post()
    @ApiOperation({ summary: "Create custom provider" })
    async createProvider(
        @Body() payload: CreateProviderDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.createProvider(
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id")
    @ApiOperation({ summary: "Update custom provider" })
    async updateProvider(
        @Param("id") id: string,
        @Body() payload: UpdateProviderDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.updateProvider(
            { ...payload, id },
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/status")
    @ApiOperation({ summary: "Update custom provider status" })
    async updateProviderStatus(
        @Param("id") id: string,
        @Body() payload: UpdateProviderStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.updateProviderStatus(
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
    @ApiOperation({ summary: "Delete custom provider" })
    async deleteProvider(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.deleteProvider(id, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Get(":id/models")
    @ApiOperation({ summary: "List models for custom provider" })
    async fetchAllProviderModels(
        @Param("id") id: string,
        @Query() query: Record<string, string>,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.fetchAllProviderModels(
            id,
            query,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Post(":id/models")
    @ApiOperation({ summary: "Add model to custom provider" })
    async createProviderModel(
        @Param("id") id: string,
        @Body() payload: CreateProviderModelDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.createProviderModel(
            id,
            payload,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/models/:modelId")
    @ApiOperation({ summary: "Update custom provider model" })
    async updateProviderModel(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.updateProviderModel(
            id,
            modelId,
            { ...payload, modelId },
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/models/:modelId/status")
    @ApiOperation({ summary: "Update custom provider model status" })
    async updateProviderModelStatus(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.updateProviderModelStatus(
            id,
            { ...payload, modelId },
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id/models/:modelId")
    @ApiOperation({ summary: "Delete custom provider model" })
    async deleteProviderModel(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.meProvidersService.deleteProviderModel(
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
