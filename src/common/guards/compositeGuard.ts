import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AuthGuard } from "@/common/guards/auth.guard";
import { IS_PUBLIC_KEY } from "@/common/decorators/auth.decorator";

@Injectable()
export class CompositeGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly throttlerGuard: ThrottlerGuard,
        private readonly authGuard: AuthGuard,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()],
        );
        if (isPublic) {
            // Skip auth, roles and throttling
            return true;
        }

        const throttle = await this.throttlerGuard.canActivate(context);
        if (!throttle) return false;

        const auth = await this.authGuard.canActivate(context);
        if (!auth) return false;

        return true;
    }
}
