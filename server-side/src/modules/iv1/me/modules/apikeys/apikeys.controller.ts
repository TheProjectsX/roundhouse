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
import { ApikeysManagerService } from "./apikeys.service";
import {
    CreateApiKeysManagerDto,
    UnlockApiKeysDto,
    UpdateApiKeysManagerDto,
} from "./dto/body.dto";

@ApiTags("ApiKeysManager")
@Controller("apikeys")
export class ApikeysManagerController {
    constructor(private service: ApikeysManagerService) {}

    @Get()
    @ApiOperation({ summary: "List API keys" })
    async fetchAllApiKeys(
        @Query() query: Record<string, string>,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.service.fetchAllApiKeys(query, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Post("unlock")
    @ApiOperation({ summary: "Unlock API keys" })
    async unlockApiKeys(
        @Body() payload: UnlockApiKeysDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.service.unlockApiKeys(payload, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Post()
    @ApiOperation({ summary: "Create API key" })
    async createApiKey(
        @Body() payload: CreateApiKeysManagerDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.service.createApiKey(payload, user);

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
        @Body() payload: UpdateApiKeysManagerDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result = await this.service.updateApiKey(id, payload, user);

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
        const result = await this.service.deleteApiKey(id, user);

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
