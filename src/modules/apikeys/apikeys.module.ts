import { Module } from "@nestjs/common";
import { ApikeysController } from "./apikeys.controller";
import { ApikeysService } from "./apikeys.service";

@Module({
    controllers: [ApikeysController],
    providers: [ApikeysService],
})
export class ApikeysModule {}
