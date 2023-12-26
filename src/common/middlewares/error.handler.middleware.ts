import AppError from '../types/appError';

import debug from 'debug';
import express from 'express';
import { injectable } from 'inversify';
import { generate } from 'shortid';

const log: debug.IDebugger = debug('app:errorHandler');

class ErrorHandler {
  /**
   * Handles validation errors and returns a formatted error object.
   * @param validationError - The validation error object.
   * @returns The formatted error object containing the name and error message.
   */
  private handleValidationErrors(validationError: AppError) {
    log('handleValidationErrors: %O', validationError);
    const errorMsgs = JSON.parse(validationError.message);

    return {
      name: 'InputValidationError',
      message: errorMsgs,
    };
  }

  /**
   * Handles MongoDB validation errors.
   * @param MongovalidationError - The MongoDB validation error.
   * @returns An object containing the name and message of the error.
   */
  private handleMongoValidationErrors(MongovalidationError: AppError) {
    log('handleMongoValidationErrors: %O', MongovalidationError);
    //@ts-ignore
    const errorMsgs = Object.keys(MongovalidationError.errors).map((key) => {
      return (
        //@ts-ignore
        MongovalidationError.errors[key].path +
        ': ' +
        //@ts-ignore
        MongovalidationError.errors[key].message
      );
    });

    return {
      name: 'MongoValidationError',
      message: errorMsgs,
    };
  }

  /**
   * Handles a generic error and returns an object with the error name and message.
   * @param error The error to be handled.
   * @returns An object with the error name and message.
   */
  private genericErrorHandler(error: AppError) {
    log(`handle${error.name}: %O`, error);
    return {
      name: error.name,
      message: error.message,
    };
  }

  /**
   * Object containing error handlers for different types of errors.
   * The keys are the error types and the values are the corresponding error handler functions.
   */
  private errorHandlers: { [key: string]: (error: AppError) => any } = {
    InputValidationError: this.handleValidationErrors,
    ValidationError: this.handleMongoValidationErrors,
  };

  /**
   * Handles the error and sends an appropriate response.
   * @param err - The error object.
   * @param req - The request object.
   * @param res - The response object.
   * @param next - The next function.
   * @returns The response with the error details.
   */
  public handle = (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    log('handle: %O', err);

    const handler = this.errorHandlers[err.name] || this.genericErrorHandler;
    const error = handler.call(this, err);

    return res.status(err.statusCode || 500).json({
      error: {
        id: generate(),
        status: err.statusCode || 500,
        name: error.name,
        message: error.message,
      },
    });
  };
}

export default new ErrorHandler();
export { ErrorHandler };
