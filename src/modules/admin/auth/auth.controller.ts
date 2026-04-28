import { Body, Controller, HttpStatus, Post } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { AdminLoginDto } from "./dto/body.dto";
import { AdminAuthService } from "./auth.service";

@ApiTags("Admin - Auth")
@Controller("admin")
export class AdminAuthController {
    constructor(private svc: AdminAuthService) {}

    @Post("login")
    @ApiOperation({ summary: "Admin login" })
    async createAdminSession(@Body() payload: AdminLoginDto) {
        const result = await this.svc.createAdminSession(payload);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
