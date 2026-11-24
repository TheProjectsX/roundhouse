import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    private isDisconnected = false;

    async onModuleInit() {
        await this.$connect();
        console.log("✅ Database connected successfully");
    }

    async onModuleDestroy() {
        await this.disconnectSafely();
    }

    async onApplicationShutdown(signal?: string) {
        await this.disconnectSafely(signal);
    }

    private async disconnectSafely(signal?: string) {
        if (this.isDisconnected) {
            return;
        }
        this.isDisconnected = true;
        await this.$disconnect();
        console.log(
            "👋 Database disconnected gracefully.",
            signal ? `Signal: ${signal}` : "",
        );
    }
}
