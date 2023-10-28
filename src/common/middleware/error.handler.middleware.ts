import AppError from '../types/appError';

import debug from 'debug';
import express from 'express';
import HttpStatusCode from '../enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:errorHandler');

class ErrorHandler {
  private handleValidationErrors(validationError: AppError) {
    log('handleValidationErrors: %O', validationError);
    const errorMsgs = JSON.parse(validationError.message);

    return {
      name: 'InputValidationError',
      message: errorMsgs,
    };
  }

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

  private handlePermissionErrors(permissionError: AppError) {
    log('handlePermissionErrors: %O', permissionError);
    return {
      name: 'PermissionFlagsError',
      message: permissionError.message,
    };
  }

  private ressourceNotFoundError(notFoundError: AppError) {
    log('ressourceNotFoundError: %O', notFoundError);
    return {
      name: 'RessourceNotFoundError',
      message: notFoundError.message,
    };
  }

  private handleRateLimitErrors(rateLimitError: AppError) {
    log('handleRateLimitErrors: %O', rateLimitError);
    return {
      name: 'RateLimitError',
      message: rateLimitError.message,
    };
  }

  private handleErrors(error: AppError) {
    log('handleErrors: %O', error);
    return {
      name: error.name,
      message: error.message,
    };
  }

  public handle = (
    err: AppError,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    switch (err.name) {
      case 'InputValidationError': {
        const validationError = this.handleValidationErrors(err);
        return res.status(err.statusCode).json({ error: validationError });
      }
      case 'ValidationError': {
        const mongoValidationError = this.handleMongoValidationErrors(err);
        return res
          .status(HttpStatusCode.BadRequest)
          .json({ error: mongoValidationError });
      }
      case 'permissionFlagsError': {
        const permissionError = this.handlePermissionErrors(err);
        return res.status(err.statusCode).json({ error: permissionError });
      }
      case 'RessourceNotFoundError': {
        const ressourceNotFoundError = this.ressourceNotFoundError(err);
        return res
          .status(err.statusCode)
          .json({ error: ressourceNotFoundError });
      }
      case 'RateLimitError': {
        const rateLimitError = this.handleRateLimitErrors(err);
        return res.status(err.statusCode).json({ error: rateLimitError });
      }
      default: {
        const error = this.handleErrors(err);
        return res.status(err.statusCode || 500).json({ error: error });
      }
    }
  };
}

export default new ErrorHandler();
