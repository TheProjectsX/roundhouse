import { Controller, Delete, HttpStatus, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { ReqField } from "@/common/decorators/request.decorator";
import { UserPayload } from "@/common/guards/auth.guard";
import { ProviderSelectionsService } from "./selections.service";

@ApiTags("Provider Selections")
@Controller("")
export class ProviderSelectionsController {
    constructor(private providerSelectionsService: ProviderSelectionsService) {}

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
}
