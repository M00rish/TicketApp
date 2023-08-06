import AppError from '../types/appError';

import debug from 'debug';
import express from 'express';

const log: debug.IDebugger = debug('app:errorHandler');

class errorHandler {
  private handleValidationErrors(validationError: AppError) {
    log('handleValidationErrors: %O', validationError);
    return JSON.parse(validationError.message);
  }

  private handleErrors(Error: AppError) {
    log('handleErrors: %O', Error);
    return Error.message;
  }

  public errorHandler = (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (err.name === `VALIDATION_ERROR`) {
      const VALIDATION_ERROR = this.handleValidationErrors(err);
      res.status(err.statusCode).json({ error: VALIDATION_ERROR });
    } else {
      const ERROR_MESSAGE = this.handleErrors(err);
      res.status(err.statusCode).json({ error: ERROR_MESSAGE });
    }

    // const error = new AppError(
    //   false,
    //   'errorHandler_Error',
    //   500,
    //   err.message || 'Internal Server Error'
    // );

    // const ERROR = this.handleErrors(error);

    // res.status(error.statusCode).json({ error: ERROR });
  };
}

export default new errorHandler();
