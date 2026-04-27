import { Global, Module } from "@nestjs/common";
import { BcryptService } from "./utils/bcrypt.service";
import { PrismaService } from "@/common/services/prisma/prisma.service";

@Global()
@Module({
    providers: [BcryptService, PrismaService],
    exports: [BcryptService, PrismaService],
})
export class CommonModule {}
