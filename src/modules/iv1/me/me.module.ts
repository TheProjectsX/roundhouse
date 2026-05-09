import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";
import { MeService } from "./me.service";
import { MeProvidersController } from "./modules/providers/providers.controller";
import { MeProvidersService } from "./modules/providers/providers.service";
import { ApikeysManagerController } from "./modules/apikeys/apikeys.controller";
import { ApikeysManagerService } from "./modules/apikeys/apikeys.service";

@Module({
    controllers: [
        MeController,
        MeProvidersController,
        ApikeysManagerController,
    ],
    providers: [MeService, MeProvidersService, ApikeysManagerService],
})
export class MeModule {}
