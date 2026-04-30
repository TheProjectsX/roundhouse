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
import { ProvidersService } from "./providers.service";

@ApiTags("Providers")
@Controller("")
export class ProvidersController {
    constructor(private providersService: ProvidersService) {}

    @Get()
    @ApiOperation({ summary: "List providers (with filters)" })
    async fetchAllProviders(
        @Query() query: Record<string, string>,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.providersService.fetchAllProviders(
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

    @Get(":id/models")
    @ApiOperation({ summary: "Get provider's models" })
    async fetchProviderModels(@Param("id") id: string) {
        const result = await this.providersService.fetchProviderModels(id);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
