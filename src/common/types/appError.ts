import HttpStatusCode from '../enums/HttpStatusCode.enum';

class AppError extends Error {
  public isOperational: boolean;
  public name: string;
  public message: string;
  public statusCode: HttpStatusCode;

  constructor(
    isOperational: boolean,
    name: string,
    statusCode: HttpStatusCode,
    message: string
  ) {
    super('message');
    Object.setPrototypeOf(this, new.target.prototype);

    this.isOperational = isOperational;
    this.name = name;
    this.message = message;
    this.statusCode = statusCode;
    Error.captureStackTrace(this);
  }
}

export default AppError;
