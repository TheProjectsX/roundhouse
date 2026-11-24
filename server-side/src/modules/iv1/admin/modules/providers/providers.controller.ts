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
import { CatalogSyncService } from "@/modules/iv1/providers/catalog-sync.service";

@ApiTags("Admin - Providers")
@Controller("providers")
@UseGuards()
export class AdminProvidersController {
    constructor(
        private adminProvidersService: AdminProvidersService,
        private catalogSyncService: CatalogSyncService,
    ) {}

    @Roles("ADMIN")
    @Get("sync-status")
    @ApiOperation({ summary: "Get global catalog auto-sync status (admin)" })
    getCatalogSyncStatus() {
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: "Catalog sync status fetched",
            data: this.catalogSyncService.getStatus(),
        });
    }

    @Roles("ADMIN")
    @Post("sync-all")
    @ApiOperation({ summary: "Trigger full global catalog sync (admin)" })
    async syncAllCatalogs() {
        const status = await this.catalogSyncService.syncAllCatalogs();
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: "Global catalog synced",
            data: status,
        });
    }

    @Roles("ADMIN")
    @Get()
    @ApiOperation({ summary: "List providers (admin)" })
    async fetchAllProviders(@Query() query: Record<string, string>) {
        const result = await this.adminProvidersService.fetchAllProviders(query);
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
        const result = await this.adminProvidersService.fetchSingleProvider(id);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Post()
    @ApiOperation({ summary: "Create provider (admin)" })
    async createProvider(@Body() payload: CreateProviderDto) {
        const result = await this.adminProvidersService.createProvider(payload);
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
    ) {
        const result = await this.adminProvidersService.updateProvider(id, payload);
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
    ) {
        const result = await this.adminProvidersService.updateProviderStatus(id, payload);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Delete(":id")
    @ApiOperation({ summary: "Delete provider (admin)" })
    async deleteProvider(@Param("id") id: string) {
        const result = await this.adminProvidersService.deleteProvider(id);
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
        const result = await this.adminProvidersService.fetchAllProviderModels(id, query);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Roles("ADMIN")
    @Post(":id/sync-models")
    @ApiOperation({ summary: "Sync global provider models from upstream (admin)" })
    async syncProviderModels(
        @Param("id") id: string,
        @Body() payload?: { apiKey?: string; freeOnly?: boolean },
    ) {
        const result = await this.adminProvidersService.syncProviderModels(
            id,
            payload,
        );
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Post(":id/models")
    @ApiOperation({ summary: "Create model for provider (admin)" })
    async createProviderModel(
        @Param("id") id: string,
        @Body() payload: CreateProviderModelDto,
    ) {
        const result = await this.adminProvidersService.createProviderModel(id, payload);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Patch("models/:modelId")
    @ApiOperation({ summary: "Update model (admin)" })
    async updateProviderModel(
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelDto,
    ) {
        const result = await this.adminProvidersService.updateProviderModel(modelId, payload);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Patch("models/:modelId/status")
    @ApiOperation({ summary: "Update model status (admin)" })
    async updateProviderModelStatus(
        @Param("modelId") modelId: string,
        @Body() payload: UpdateProviderModelStatusDto,
    ) {
        const result = await this.adminProvidersService.updateProviderModelStatus(
            modelId,
            payload,
        );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Roles("ADMIN")
    @Delete("models/:modelId")
    @ApiOperation({ summary: "Delete model (admin)" })
    async deleteProviderModel(@Param("modelId") modelId: string) {
        const result = await this.adminProvidersService.deleteProviderModel(modelId);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
        });
    }
}
