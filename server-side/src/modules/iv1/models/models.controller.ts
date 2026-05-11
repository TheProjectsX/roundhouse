import { Controller, HttpStatus, Param, Patch } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { ReqField } from "@/common/decorators/request.decorator";
import { UserPayload } from "@/common/guards/auth.guard";
import { ModelsService } from "./models.service";

@ApiTags("Model Selections")
@Controller("selections")
export class ModelsController {
    constructor(private modelsService: ModelsService) {}

    @Patch(":modelSelectionId/status")
    @ApiOperation({ summary: "Toggle model selection active by id" })
    async updateApiKeyModelSelectionStatus(
        @Param("modelSelectionId") modelSelectionId: string,
        @ReqField("user") user: UserPayload,
    ) {
        const result =
            await this.modelsService.updateApiKeyModelSelectionStatus(
                modelSelectionId,
                user,
            );

        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
