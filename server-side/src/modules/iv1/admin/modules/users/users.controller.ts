import {
    Body,
    Controller,
    Delete,
    Get,
    HttpStatus,
    Param,
    Patch,
    Query,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ResponseService } from "@/common/interceptors/response";
import { Roles } from "@/common/decorators/roles.decorator";
import { UpdateUserDto, UpdateUserStatusDto } from "./dto/body.dto";
import { AdminUsersService } from "./users.service";

@ApiTags("Admin - Users")
@Controller("users")
@Roles("ADMIN")
export class AdminUsersController {
    constructor(private svc: AdminUsersService) {}

    @Get()
    @ApiOperation({ summary: "List users (admin)" })
    async fetchAllUsers(@Query() query: Record<string, string>) {
        const result = await this.svc.fetchAllUsers(query);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Get("bin")
    @ApiOperation({ summary: "List soft-deleted users in bin (admin)" })
    async fetchDeletedUsers(@Query() query: Record<string, string>) {
        const result = await this.svc.fetchDeletedUsers(query);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
            pagination: result.pagination,
        });
    }

    @Get(":id")
    @ApiOperation({ summary: "Get user details (admin)" })
    async fetchSingleUser(@Param("id") id: string) {
        const result = await this.svc.fetchSingleUser(id);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id")
    @ApiOperation({ summary: "Update user (admin)" })
    async updateUser(@Param("id") id: string, @Body() payload: UpdateUserDto) {
        const result = await this.svc.updateUser({ ...payload, id });
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/status")
    @ApiOperation({ summary: "Update user status (admin)" })
    async updateUserStatus(
        @Param("id") id: string,
        @Body() payload: UpdateUserStatusDto,
    ) {
        const result = await this.svc.updateUserStatus({ ...payload, id });
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id")
    @ApiOperation({ summary: "Soft delete user to bin, or permanently delete when permanent=true (admin)" })
    async deleteUser(
        @Param("id") id: string,
        @Query("permanent") permanent?: string,
    ) {
        const result =
            permanent === "true"
                ? await this.svc.permanentDeleteUser(id)
                : await this.svc.deleteUser(id);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Patch(":id/restore")
    @ApiOperation({ summary: "Restore user from bin (admin)" })
    async restoreUser(@Param("id") id: string) {
        const result = await this.svc.restoreUser(id);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }

    @Delete(":id/permanent")
    @ApiOperation({ summary: "Permanently delete user and all owned data (admin)" })
    async permanentDeleteUser(@Param("id") id: string) {
        const result = await this.svc.permanentDeleteUser(id);
        return ResponseService.formatResponse({
            statusCode: HttpStatus.OK,
            message: result.message,
            data: result.data,
        });
    }
}
