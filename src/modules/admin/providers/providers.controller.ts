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
    UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { ReqField } from "@/common/decorators/request.decorator";
import { UserPayload } from "@/common/guards/auth.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import {
    CreateProviderDto,
    CreateProviderModelDto,
    UpdateProviderDto,
    UpdateProviderModelDto,
    UpdateProviderModelStatusDto,
    UpdateProviderStatusDto,
} from "./dto/body.dto";
import { AdminProvidersService } from "./providers.service";

@ApiTags("Admin - Providers")
@Controller("admin/providers")
@UseGuards()
export class ProvidersController {
    constructor(private svc: AdminProvidersService) {}

    @Roles("ADMIN")
    @Get()
    @ApiOperation({ summary: "List providers (admin)" })
    async fetchAllProviders(@Query() query: Record<string, string>) {
        const result = await this.svc.fetchAllProviders(query);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Roles("ADMIN")
    @Get(":id")
    @ApiOperation({ summary: "Get provider details (admin)" })
    async fetchSingleProvider(@Param("id") id: string) {
        const result = await this.svc.fetchSingleProvider(id);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Post()
    @ApiOperation({ summary: "Create provider (admin)" })
    async createProvider(
        @Body() payload: CreateProviderDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.createProvider(payload, user);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Patch(":id")
    @ApiOperation({ summary: "Update provider (admin)" })
    async updateProvider(
        @Param("id") id: string,
        @Body() payload: UpdateProviderDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.updateProvider({ ...payload, id }, user);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Patch(":id/status")
    @ApiOperation({ summary: "Update provider status (admin)" })
    async updateProviderStatus(
        @Param("id") id: string,
        @Body() payload: UpdateProviderStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.updateProviderStatus(
            { ...payload, id },
            user,
        );
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Delete(":id")
    @ApiOperation({ summary: "Delete provider (admin)" })
    async deleteProvider(
        @Param("id") id: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.deleteProvider(id, user);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }

    @Roles("ADMIN")
    @Get(":id/models")
    @ApiOperation({ summary: "List models of provider (admin)" })
    async fetchAllProviderModels(
        @Param("id") id: string,
        @Query() query: Record<string, string>,
    ) {
        const result = await this.svc.fetchAllProviderModels(id, query);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Roles("ADMIN")
    @Post(":id/models")
    @ApiOperation({ summary: "Create model for provider (admin)" })
    async createProviderModel(
        @Param("id") id: string,
        @Body() payload: CreateProviderModelDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.createProviderModel(id, payload, user);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Patch(":id/models/:modelId")
    @ApiOperation({ summary: "Update model (admin)" })
    async updateProviderModel(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.updateProviderModel(
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

    @Roles("ADMIN")
    @Patch(":id/models/:modelId/status")
    @ApiOperation({ summary: "Update model status (admin)" })
    async updateProviderModelStatus(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.updateProviderModelStatus(
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

    @Roles("ADMIN")
    @Delete(":id/models/:modelId")
    @ApiOperation({ summary: "Delete model (admin)" })
    async deleteProviderModel(
        @Param("id") id: string,
        @Param("modelId") modelId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.svc.deleteProviderModel(id, modelId, user);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }
}
