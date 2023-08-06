import express from 'express';
import { validationResult, ValidationError } from 'express-validator';
import debug from 'debug';

import HttpStatusCode from '../enums/HttpStatusCode.enum';
import AppError from '../types/appError';

const log: debug.IDebugger = debug('app:bodyValidationMiddleware');

class bodyValidationMiddleware {
  verifyBodyFieldsError =
    (fieldNames: string[]) =>
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const errors = validationResult(req).array();
      const requestBodyKeys = Object.keys(req.body || {});

      const incorrectfieldNames = requestBodyKeys.filter((field) => {
        if (!fieldNames.includes(field)) return field;
      });

      const incorrectfieldNamesErrors = incorrectfieldNames.map((field) => {
        const error: ValidationError = {
          value: req.body[field],
          msg: `${field} is not allowed`,
          param: field,
          location: 'body',
        };

        return error;
      });

      errors.push(...incorrectfieldNamesErrors);

      if (errors.length) {
        const error = new AppError(
          true,
          'VALIDATION_ERROR',
          HttpStatusCode.BadRequest,
          JSON.stringify(errors)
        );

        return next(error);
      }

      next(); // TODO: to be improved -> should do the body validation here as well as fieldnames validation?
    };
}

export default new bodyValidationMiddleware();
