import { createParamDecorator, ExecutionContext } from "@nestjs/common";

export const ReqField = createParamDecorator(
    (field: string, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return field ? request[field] : request;
    },
);
