import 'mocha';
import { expect, use } from 'chai';
import sinon from 'sinon';
import express from 'express';
import { AuthService } from '../../../src/auth/services/auth.service';
import { AuthController } from '../../../src/auth/controllers/auth.controller';
import { UsersService } from '../../../src/users/services/users.service';
import { UsersDao } from '../../../src/users/daos/users.dao';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';

describe('AuthController', () => {
  describe('logIn', () => {
    let mockRequest: Partial<express.Request>;
    let mockResponse: Partial<express.Response>;
    let mockNext: Partial<express.NextFunction>;

    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let usersDao = new UsersDao(commonService);
    let usersService = new UsersService(usersDao);
    let authService = new AuthService(usersService);
    let authController = new AuthController(authService);

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      };
      mockNext = sinon.stub();

      sinon
        .stub(authService, 'createJWT')
        .returns(Promise.resolve('mockToken'));
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should log in user', async () => {
      await authController.logIn(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext as express.NextFunction
      );

      sinon.assert.calledOnce(authService.createJWT as sinon.SinonStub);
      sinon.assert.calledWith(mockResponse.status as sinon.SinonStub, 200);
      sinon.assert.calledWith(mockResponse.send as sinon.SinonStub, {
        accessToken: 'mockToken',
      });
    });
  });

  describe('logOut', () => {
    let mockRequest: Partial<express.Request>;
    let mockResponse: Partial<express.Response>;
    let mockNext: Partial<express.NextFunction>;

    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let usersDao = new UsersDao(commonService);
    let usersService = new UsersService(usersDao);
    let authService = new AuthService(usersService);
    let authController = new AuthController(authService);

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: sinon.stub().returnsThis(),
        send: sinon.stub().returnsThis(),
      };
      mockNext = sinon.stub();

      sinon.stub(authService, 'clearJWT').resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should log out user', async () => {
      await authController.logOut(
        mockRequest as express.Request,
        mockResponse as express.Response,
        mockNext as express.NextFunction
      );

      sinon.assert.calledOnce(authService.clearJWT as sinon.SinonStub);
      sinon.assert.calledWith(mockResponse.status as sinon.SinonStub, 200);
      sinon.assert.calledWith(mockResponse.send as sinon.SinonStub);
    });
  });
});
