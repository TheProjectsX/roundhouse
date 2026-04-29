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
} from "./dto/body.dto";
import { ProvidersService } from "./providers.service";

@ApiTags("Providers")
@Controller("")
export class ProvidersController {
    constructor(private providersService: ProvidersService) {}

    @Get()
    @ApiOperation({ summary: "List providers (with filters)" })
    async fetchAllProviders(@Query() query: Record<string, string>) {
        const result = await this.providersService.fetchAllProviders(query);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Get(":id")
    @ApiOperation({ summary: "Get provider details" })
    async fetchSingleProvider(@Param("id") id: string) {
        const result = await this.providersService.fetchSingleProvider(id);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Post("custom")
    @ApiOperation({ summary: "Create custom provider for user" })
    async createProvider(
        @Body() payload: CreateProviderDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.createProvider(
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
        const result = await this.providersService.updateProvider(
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
    @ApiOperation({ summary: "Update custom provider status" })
    async updateProviderStatus(
        @Param("id") id: string,
        @Body() payload: UpdateProviderStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.updateProviderStatus(
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
    @ApiOperation({ summary: "Delete provider (custom only)" })
    async deleteProvider(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.deleteProvider(id, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }

    @Get(":id/models")
    @ApiOperation({ summary: "List models for a provider" })
    async fetchAllProviderModels(
        @Param("id") id: string,
        @Query() query: Record<string, string>,
    ) {
        const result = await this.providersService.fetchAllProviderModels(
            id,
            query,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Post(":id/models")
    @ApiOperation({ summary: "Add model to provider (custom only)" })
    async createProviderModel(
        @Param("id") id: string,
        @Body() payload: CreateProviderModelDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.createProviderModel(
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

    @Patch("models/:modelId")
    @ApiOperation({ summary: "Update provider model" })
    async updateProviderModel(
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.updateProviderModel(
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

    @Patch("models/:modelId/status")
    @ApiOperation({ summary: "Update provider model status" })
    async updateProviderModelStatus(
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.updateProviderModelStatus(
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

    @Delete("models/:modelId")
    @ApiOperation({ summary: "Delete provider model" })
    async deleteProviderModel(
        @Param("modelId") modelId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.deleteProviderModel(
            modelId,
            user,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }
}
