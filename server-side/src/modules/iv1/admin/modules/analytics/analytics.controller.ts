import { Controller, Get, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { Roles } from "@/common/decorators/roles.decorator";
import { AdminAnalyticsService } from "./analytics.service";

@ApiTags("Admin - Analytics")
@Controller("analytics")
@Roles("ADMIN")
export class AdminAnalyticsController {
    constructor(private svc: AdminAnalyticsService) {}

    @Get()
    @ApiOperation({ summary: "Fetch admin analytics" })
    async fetchAdminAnalytics() {
        const result = await this.svc.fetchAdminAnalytics();
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
