import { Module } from "@nestjs/common";
import { ApikeysManagerController } from "./apikeys.controller";
import { ApikeysManagerService } from "./apikeys.service";

@Module({
    controllers: [ApikeysManagerController],
    providers: [ApikeysManagerService],
})
export class ApikeysManagerModule {}
