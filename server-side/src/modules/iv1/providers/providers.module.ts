import { Module } from "@nestjs/common";
import { ProvidersController } from "./providers.controller";
import { ProvidersService } from "./providers.service";
import { ProviderSelectionsController } from "./_selections/selections.controller";
import { ProviderSelectionsService } from "./_selections/selections.service";

@Module({
    controllers: [ProvidersController, ProviderSelectionsController],
    providers: [ProvidersService, ProviderSelectionsService],
})
export class ProvidersModule {}
