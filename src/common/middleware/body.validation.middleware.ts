import express from 'express';
import { validationResult } from 'express-validator';
import debug from 'debug';

import HttpStatusCode from '../enums/HttpStatusCode.enum';
import AppError from '../types/appError';

const log: debug.IDebugger = debug('app:bodyValidationMiddleware');

class bodyValidationMiddleware {
  verifyBodyFieldsError(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const errors = validationResult(req).array();
    let error;
    if (errors.length) {
      error = new AppError(
        true,
        'VALIDATION_ERROR',
        HttpStatusCode.BadRequest,
        JSON.stringify(errors)
      );

      next(error);
    }

    next();
  }
}

export default new bodyValidationMiddleware();
