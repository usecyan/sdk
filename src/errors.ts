export class HttpError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class CyanError extends Error {}

export class NoWalletError extends CyanError {
    constructor() {
        super('User has no wallet');
    }
}
