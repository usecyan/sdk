export class HttpError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export const createHashSHA256 = async (message: string): Promise<string> => {
    const hashBuffer = await crypto.subtle.digest('sha-256', new TextEncoder().encode(message));
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
};
