import 'mocha';
import express from 'express';
import { expect } from 'chai';
import sinon from 'sinon';
import * as validation from 'express-validator';
import { validationResult, Location } from 'express-validator';

import AppError from '../../../src/common/types/appError';
import { BodyValidationMiddleware } from '../../../src/common/middlewares/body.validation.middleware';

describe('BodyValidationMiddleware', () => {
  let bodyValidationMiddleware: BodyValidationMiddleware;
  let req: Partial<express.Request>;
  let res: Partial<express.Response>;
  let next: sinon.SinonSpy;

  beforeEach(() => {
    bodyValidationMiddleware = new BodyValidationMiddleware();
    req = {
      body: {},
    };
    res = {};
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('verifyBodyFieldsError', () => {
    it('should call next() if there are no errors', () => {
      const verifyBodyFieldsError =
        bodyValidationMiddleware.verifyBodyFieldsError(['testField']);
      sinon.stub(validationResult(req as express.Request), 'array').returns([]);
      req.body = { testField: 'testValue' };

      verifyBodyFieldsError(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnce).to.be.true;
    });

    // TODO: Fix this test
    // it('should throw an error if there are validation errors', () => {
    //   const verifyBodyFieldsError =
    //     bodyValidationMiddleware.verifyBodyFieldsError(['email', 'password']);

    //   req.body = {
    //     email: 'aa',
    //     password: '1',
    //   };

    //   // expect(() =>
    //   verifyBodyFieldsError(
    //     req as express.Request,
    //     res as express.Response,
    //     next
    //   );

    //   // ).to.throw(AppError);
    // });

    it('should throw an error if there are incorrect field names', () => {
      const verifyBodyFieldsError =
        bodyValidationMiddleware.verifyBodyFieldsError(['testField']);

      req.body = { incorrectField: 'testValue' };

      expect(() =>
        verifyBodyFieldsError(
          req as express.Request,
          res as express.Response,
          next
        )
      ).to.throw(AppError);
    });
  });

  describe('getIncorrectFieldNames', () => {
    it('should return an empty array if all field names are correct', () => {
      const requestBodyKeys = ['field1', 'field2'];
      const fieldNames = ['field1', 'field2'];

      const result = bodyValidationMiddleware.getIncorrectFieldNames(
        requestBodyKeys,
        fieldNames
      );

      expect(result).to.be.an('array').that.is.empty;
    });

    it('should return an array of incorrect field names', () => {
      const requestBodyKeys = ['field1', 'field2', 'field3'];
      const fieldNames = ['field1', 'field2'];

      const result = bodyValidationMiddleware.getIncorrectFieldNames(
        requestBodyKeys,
        fieldNames
      );

      expect(result).to.be.an('array').that.includes('field3');
    });

    it('should return an array of all field names if none are correct', () => {
      const requestBodyKeys = ['field1', 'field2', 'field3'];
      const fieldNames = ['field4', 'field5'];

      const result = bodyValidationMiddleware.getIncorrectFieldNames(
        requestBodyKeys,
        fieldNames
      );

      expect(result).to.include('field1');
      expect(result).to.include('field2');
      expect(result).to.include('field3');
    });
  });

  describe('generateFieldErrors', () => {
    it('should return an array of ValidationError objects for each incorrect field name', () => {
      const incorrectFieldNames = ['field1', 'field2'];
      const requestBody = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      };

      const result = bodyValidationMiddleware.generateFieldErrors(
        incorrectFieldNames,
        requestBody
      );

      expect(result).to.be.an('array').that.has.length(2);

      result.forEach((error, index) => {
        expect(error).to.have.property(
          'value',
          requestBody[incorrectFieldNames[index]]
        );
        expect(error).to.have.property(
          'msg',
          `${incorrectFieldNames[index]} is not allowed`
        );
        expect(error).to.have.property('param', incorrectFieldNames[index]);
        expect(error).to.have.property('location', 'body');
      });
    });

    it('should return an empty array if there are no incorrect field names', () => {
      const incorrectFieldNames: string[] = [];
      const requestBody = {
        field1: 'value1',
        field2: 'value2',
        field3: 'value3',
      };

      const result = bodyValidationMiddleware.generateFieldErrors(
        incorrectFieldNames,
        requestBody
      );

      expect(result).to.be.an('array').that.is.empty;
    });
  });

  describe('validateCoordinates', () => {
    it('should return true for valid coordinates', () => {
      const validCoordinates = [45, 90];
      const result =
        bodyValidationMiddleware.validateCoordiantes(validCoordinates);
      expect(result).to.be.true;
    });

    it('should return false for longitude less than -180', () => {
      const invalidCoordinates = [-181, 45];
      const result =
        bodyValidationMiddleware.validateCoordiantes(invalidCoordinates);
      expect(result).to.be.false;
    });

    it('should return false for longitude greater than 180', () => {
      const invalidCoordinates = [181, 45];
      const result =
        bodyValidationMiddleware.validateCoordiantes(invalidCoordinates);
      expect(result).to.be.false;
    });

    it('should return false for latitude less than -90', () => {
      const invalidCoordinates = [45, -91];
      const result =
        bodyValidationMiddleware.validateCoordiantes(invalidCoordinates);
      expect(result).to.be.false;
    });

    it('should return false for latitude greater than 90', () => {
      const invalidCoordinates = [45, 91];
      const result =
        bodyValidationMiddleware.validateCoordiantes(invalidCoordinates);
      expect(result).to.be.false;
    });

    it('should return false for non-numeric longitude', () => {
      const invalidCoordinates = ['invalid', 45];
      const result =
        bodyValidationMiddleware.validateCoordiantes(invalidCoordinates);
      expect(result).to.be.false;
    });

    it('should return false for non-numeric latitude', () => {
      const invalidCoordinates = [45, 'invalid'];
      const result =
        bodyValidationMiddleware.validateCoordiantes(invalidCoordinates);
      expect(result).to.be.false;
    });
  });
});
