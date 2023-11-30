import express from 'express';
import { validationResult, ValidationError } from 'express-validator';
import debug from 'debug';

import HttpStatusCode from '../enums/HttpStatusCode.enum';
import AppError from '../types/appError';

const log: debug.IDebugger = debug('app:bodyValidationMiddleware');

class bodyValidationMiddleware {
  /**
   * Middleware function to verify the presence of required fields in the request body.
   * @param fieldNames - An array of field names that should be present in the request body.
   * @returns A middleware function that checks for the presence of required fields and throws an error if any field is missing.
   */
  verifyBodyFieldsError = (fieldNames: string[]) => {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      const errors = validationResult(req).array();
      const requestBodyKeys = Object.keys(req.body || {});

      const incorrectFieldNames = this.getIncorrectFieldNames(
        requestBodyKeys,
        fieldNames
      );
      const incorrectFieldErrors = this.generateFieldErrors(
        incorrectFieldNames,
        req.body
      );

      errors.push(...incorrectFieldErrors);

      if (errors.length) {
        const error = new AppError(
          true,
          'InputValidationError',
          HttpStatusCode.BadRequest,
          JSON.stringify(errors)
        );

        throw error;
      }

      next();
    };
  };

  /**
   * Returns an array of incorrect field names in the request body.
   * @param requestBodyKeys - The keys of the request body.
   * @param fieldNames - The valid field names.
   * @returns An array of incorrect field names.
   */
  getIncorrectFieldNames = (
    requestBodyKeys: string[],
    fieldNames: string[]
  ): string[] => {
    return requestBodyKeys.filter((field) => !fieldNames.includes(field));
  };

  /**
   * Generates an array of ValidationError objects based on the incorrect field names and the request body.
   * @param incorrectFieldNames - The array of incorrect field names.
   * @param requestBody - The request body object.
   * @returns An array of ValidationError objects.
   */
  generateFieldErrors = (
    incorrectFieldNames: string[],
    requestBody: any
  ): ValidationError[] => {
    return incorrectFieldNames.map((field) => {
      const error: ValidationError = {
        value: requestBody[field],
        msg: `${field} is not allowed`,
        param: field,
        location: 'body',
      };

      return error;
    });
  };
}

export default new bodyValidationMiddleware();
