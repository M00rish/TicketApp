import 'mocha';
import sinon from 'sinon';
import express from 'express';

import { ErrorHandler } from '../../../src/common/middleware/error.handler.middleware';
import AppError from '../../../src/common/types/appError';
import { expect } from 'chai';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';

describe('ErrorHandler', () => {
  let errorHandler: ErrorHandler;

  beforeEach(() => {
    errorHandler = new ErrorHandler();
  });

  describe('handle', () => {
    type ResponseWithSpies = express.Response & {
      status: sinon.SinonStub;
      json: sinon.SinonStub;
    };

    it('should call the correct error handler and return a JSON response with the error details', () => {
      const req = {} as express.Request;
      const res: ResponseWithSpies = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      } as ResponseWithSpies;
      const next = sinon.stub();

      const validationError = new AppError(
        true,
        'InputValidationError',
        HttpStatusCode.BadRequest,
        '["Error message 1", "Error message 2"]'
      );

      errorHandler.handle(validationError, req, res, next);

      sinon.assert.calledWith(res.status, HttpStatusCode.BadRequest);
      sinon.assert.calledWith(res.json, {
        error: {
          id: sinon.match.string,
          status: HttpStatusCode.BadRequest,
          name: 'InputValidationError',
          message: ['Error message 1', 'Error message 2'],
        },
      });
    });

    it('should use the generic error handler and return a 500 status code for unknown errors', () => {
      type ResponseWithSpies = express.Response & {
        status: sinon.SinonStub;
        json: sinon.SinonStub;
      };

      const req = {} as express.Request;
      const res: ResponseWithSpies = {
        status: sinon.stub().returnsThis(),
        json: sinon.stub().returnsThis(),
      } as ResponseWithSpies;

      const next = sinon.stub();

      const unknownError = new AppError(
        true,
        'UnknownError',
        HttpStatusCode.InternalServerError,
        'An unknown error occurred'
      );

      errorHandler.handle(unknownError, req, res, next);

      sinon.assert.calledWith(res.status, HttpStatusCode.InternalServerError);

      sinon.assert.calledWith(res.json, {
        error: {
          id: sinon.match.string,
          status: HttpStatusCode.InternalServerError,
          name: 'UnknownError',
          message: 'An unknown error occurred',
        },
      });
    });
  });
});
