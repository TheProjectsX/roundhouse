import { HttpException, HttpStatus } from "@nestjs/common";

export class ApiError extends HttpException {
    constructor(
        public readonly statusCode: number = HttpStatus.BAD_REQUEST,
        public readonly message: string = "Something went wrong!",
        public readonly stack?: string,
    ) {
        super(message, statusCode);

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}
