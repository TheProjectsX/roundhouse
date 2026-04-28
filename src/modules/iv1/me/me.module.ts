import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";
import { MeProvidersController } from "./providers/providers.controller";
import { MeProvidersService } from "./providers/providers.service";

@Module({
    controllers: [MeController, MeProvidersController],
    providers: [MeService, MeProvidersService],
})
export class MeModule {}
