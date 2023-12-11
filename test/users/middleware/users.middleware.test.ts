import express from 'express';
import mocha from 'mocha';
import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';

import usersService from '../../../src/users/services/users.service';
import usersMiddleware from '../../../src/users/middleware/users.middleware';
import AppError from '../../../src/common/types/appError';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';

describe('UsersMiddelware', () => {
  describe('validateSameEmailDoesntExist', () => {
    let mockRequest: Partial<express.Request>;
    let mockResponse: Partial<express.Response>;
    let mockNext: sinon.SinonSpy;

    beforeEach(() => {
      mockRequest = {
        body: {
          email: 'test@test.com',
        },
      };
      mockResponse = {};
      mockNext = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() if getUserByEmail returns RessourceNotFoundError', async () => {
      const appError = new AppError(
        true,
        'RessourceNotFoundError',
        HttpStatusCode.NotFound,
        'User not found'
      );

      sinon.stub(usersService, 'getUserByEmail').throws(appError);

      await usersMiddleware.validateSameEmailDoesntExist(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );

      expect(mockNext.calledOnceWithExactly()).to.be.true;
    });

    it('should call next() with an EmailValidationError if getUserByEmail returns a user', async () => {
      const user = { _id: '123', email: 'test@test.com' };
      sinon.stub(usersService, 'getUserByEmail').returns(Promise.resolve(user));
      await usersMiddleware.validateSameEmailDoesntExist(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );
      expect(mockNext.calledOnceWith(sinon.match.instanceOf(AppError))).to.be
        .true;
      expect((mockNext.getCall(0).args[0] as AppError).name).to.equal(
        'EmailValidationError'
      );
    });

    it('should call next() with the error if getUserByEmail throws an error', async () => {
      const error = new Error('Database error');
      sinon.stub(usersService, 'getUserByEmail').throws(error);
      await usersMiddleware.validateSameEmailDoesntExist(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );
      expect(mockNext.calledOnceWith(error)).to.be.true;
    });
  });

  describe('validatePatchEmail', () => {
    let mockRequest: Partial<express.Request>;
    let mockResponse: Partial<express.Response>;
    let mockNext: sinon.SinonSpy;
    let validateSameEmailDoesntExistStub: sinon.SinonStub;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {};
      mockNext = sinon.spy();
      validateSameEmailDoesntExistStub = sinon.stub(
        usersMiddleware,
        'validateSameEmailDoesntExist'
      );
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call validateSameEmailDoesntExist if email is in request body', async () => {
      mockRequest.body.email = 'test@test.com';

      await usersMiddleware.validatePatchEmail(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );

      expect(
        validateSameEmailDoesntExistStub.calledOnceWithExactly(
          mockRequest as express.Request,
          mockResponse as express.Response,
          mockNext
        )
      ).to.be.true;
    });

    it('should call next() if email is not in request body', async () => {
      await usersMiddleware.validatePatchEmail(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );
      expect(mockNext.calledOnceWithExactly()).to.be.true;
    });
  });

  describe('extractUserId', () => {
    let mockRequest: Partial<express.Request>;
    let mockResponse: Partial<express.Response>;
    let mockNext: sinon.SinonSpy;

    beforeEach(() => {
      mockRequest = {
        params: {
          userId: '123',
        },
        body: {},
      };
      mockResponse = {};
      mockNext = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should set req.body.id to the user ID in the request parameters and call next()', async () => {
      await usersMiddleware.extractUserId(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );
      expect(mockRequest.body.id).to.equal('123');
      expect(mockNext.calledOnceWithExactly()).to.be.true;
    });
  });

  describe('userCannotChangePermission', () => {
    let mockRequest: Partial<express.Request>;
    let mockResponse: Partial<express.Response>;
    let mockNext: sinon.SinonSpy;

    beforeEach(() => {
      mockRequest = {
        body: {
          permissionFlags: '123',
        },
      };
      mockResponse = {
        locals: {
          jwt: {
            permissionFlags: '456',
          },
        },
      };
      mockNext = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() with an error if permissionFlags in request body is different from res.locals.jwt.permissionFlags', async () => {
      await usersMiddleware.userCannotChangePermission(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );
      expect(mockNext.calledOnceWith(sinon.match.instanceOf(AppError))).to.be
        .true;
    });

    it('should call next() if permissionFlags is not in request body or is the same as res.locals.jwt.permissionFlags', async () => {
      mockRequest.body.permissionFlags = '456';
      await usersMiddleware.userCannotChangePermission(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext
      );
      expect(mockNext.calledOnceWithExactly()).to.be.true;
    });
  });
});
