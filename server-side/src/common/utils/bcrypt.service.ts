import config from "@/config";
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

@Injectable()
export class BcryptService {
    private readonly saltRounds: number;
    constructor() {
        this.saltRounds = config.password.salt ?? 10;
    }

    async generateSalt(rounds: number = this.saltRounds): Promise<string> {
        return bcrypt.genSalt(rounds);
    }

    async hash(password: string, rounds?: number): Promise<string> {
        const salt = await this.generateSalt(rounds);
        return bcrypt.hash(password, salt);
    }

    async compare(plainText: string, hash: string): Promise<boolean> {
        return bcrypt.compare(plainText, hash);
    }
}
