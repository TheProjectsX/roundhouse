import { SetMetadata } from "@nestjs/common";

export const SkipRateLimit = () => SetMetadata("skipRateLimit", true);
