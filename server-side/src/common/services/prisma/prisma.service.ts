import { Injectable, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    async onModuleInit() {
        await this.$connect();
        console.log("✅ Database connected successfully");
    }

    async onApplicationShutdown(signal?: string) {
        await this.$disconnect();
        console.log("👋 Database disconnected gracefully. Signal:", signal);
    }
}
