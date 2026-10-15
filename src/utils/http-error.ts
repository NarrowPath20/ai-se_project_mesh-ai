export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const requiredText = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
