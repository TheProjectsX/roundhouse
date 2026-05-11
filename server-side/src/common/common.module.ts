import { Global, Module } from "@nestjs/common";
import { BcryptService } from "./utils/bcrypt.service";
import { PrismaService } from "@/common/services/prisma/prisma.service";
import { ModelSelectionService } from "@/common/services/modelSelection/model-selection.service";

@Global()
@Module({
    providers: [BcryptService, PrismaService, ModelSelectionService],
    exports: [BcryptService, PrismaService, ModelSelectionService],
})
export class CommonModule {}
