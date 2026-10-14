/**
 * An error that maps directly to an HTTP response:
 *   { "error": { "code", "message", "details"? }, ...data }
 */
export class HttpError extends Error {
  constructor(status, code, message, { details, data } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.data = data;
  }

  toResponseBody() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details }),
      },
      ...this.data,
    };
  }
}

export const badRequest = (code, message, options) => new HttpError(400, code, message, options);
export const notFound = (code, message) => new HttpError(404, code, message);
export const conflict = (code, message, options) => new HttpError(409, code, message, options);
