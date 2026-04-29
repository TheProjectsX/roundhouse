import {
    Body,
    Controller,
    Delete,
    HttpStatus,
    Param,
    Patch,
    Post,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { ReqField } from "@/common/decorators/request.decorator";
import { UserPayload } from "@/common/guards/auth.guard";
import {
    CreateProviderApiKeyDto,
    UpdateProviderApiKeyDto,
    UpdateProviderApiKeyStatusDto,
} from "@/modules/iv1/apikeys/dto/body.dto";
import { ProviderSelectionsService } from "./selections.service";

@ApiTags("Provider Selections")
@Controller("")
export class ProviderSelectionsController {
    constructor(private providerSelectionsService: ProviderSelectionsService) {}

    @Post("selections/:providerSelectionId/keys")
    @ApiOperation({ summary: "Create provider API key by provider selection" })
    async createProviderApiKeyByProviderSelection(
        @Param("providerSelectionId") providerSelectionId: string,
        @Body() payload: CreateProviderApiKeyDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.providerSelectionsService.createProviderApiKeyByProviderSelection(
                providerSelectionId,
                payload,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.CREATED,
            message: result.message,
            data: result.data,
        });
    }

    @Delete("selections/:providerSelectionId")
    @ApiOperation({ summary: "Deselect provider by selection id" })
    async deleteProviderSelectionById(
        @Param("providerSelectionId") providerSelectionId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.providerSelectionsService.deleteProviderSelectionById(
                providerSelectionId,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch("selections/:providerSelectionId/status")
    @ApiOperation({ summary: "Toggle provider selection status by id" })
    async updateProviderSelectionStatusById(
        @Param("providerSelectionId") providerSelectionId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.providerSelectionsService.updateProviderSelectionStatusById(
                providerSelectionId,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch("keys/:providerApiKeyId")
    @ApiOperation({ summary: "Update provider API key by id" })
    async updateProviderApiKeyById(
        @Param("providerApiKeyId") providerApiKeyId: string,
        @Body() payload: UpdateProviderApiKeyDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.providerSelectionsService.updateProviderApiKeyById(
                providerApiKeyId,
                payload,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch("keys/:providerApiKeyId/status")
    @ApiOperation({ summary: "Update provider API key status by id" })
    async updateProviderApiKeyStatusById(
        @Param("providerApiKeyId") providerApiKeyId: string,
        @Body() payload: UpdateProviderApiKeyStatusDto,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.providerSelectionsService.updateProviderApiKeyStatusById(
                providerApiKeyId,
                payload,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete("keys/:providerApiKeyId")
    @ApiOperation({ summary: "Delete provider API key by id" })
    async deleteProviderApiKeyById(
        @Param("providerApiKeyId") providerApiKeyId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.providerSelectionsService.deleteProviderApiKeyById(
                providerApiKeyId,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
