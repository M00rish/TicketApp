import mocha from 'mocha';
import sinon, { SinonStub, SinonSpy } from 'sinon';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import chai from 'chai';
import sinonChai from 'sinon-chai'; // to be removed

import { AuthService } from '../../../src/auth/services/auth.service';
import { UsersService } from '../../../src/users/services/users.service';
import AppError from '../../../src/common/types/appError';
import { UsersDao } from '../../../src/users/daos/users.dao';

dotenv.config();

describe('AuthService', () => {
  describe('Constructor', () => {
    let usersService: UsersService;
    let authService: AuthService;
    let usersDao: UsersDao;

    beforeEach(() => {
      usersDao = new UsersDao();
      usersService = new UsersService(usersDao);
    });

    it('should create a new instance of AuthService', () => {
      authService = new AuthService(usersService);
      expect(authService).to.be.instanceOf(AuthService);
    });

    it('should have usersService initialized', () => {
      authService = new AuthService(usersService);
      expect(authService['usersService']).to.equal(usersService);
    });
  });

  describe('createJWT', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: NextFunction;
    let authService: AuthService;
    let usersService: UsersService;
    let usersDao: UsersDao;

    beforeEach(() => {
      req = {
        body: {
          userId: 'testUserId',
          permissionFlags: 'testPermissionFlags',
        },
      };
      res = {
        cookie: sinon.stub(),
      };
      next = sinon.spy();
      usersDao = new UsersDao();
      usersService = new UsersService(usersDao);
      authService = new AuthService(usersService);

      sinon.stub(usersService, 'updateUserRefreshTokenById').resolves();
      sinon.stub(authService, 'createToken').returns('testToken');
      sinon.stub(authService, 'setCookie');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should throw an error if userId or permissionFlags are not provided', async () => {
      req.body = {};
      try {
        await authService.createJWT(req as Request, res as Response, next);
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.equal(
          'User ID and PermissionFlags are required'
        );
      }
    });

    it('should create and return an access token', async () => {
      const result = await authService.createJWT(
        req as Request,
        res as Response,
        next
      );

      expect(result).to.equal('testToken');
    });

    it('should set a cookie with the refresh token', async () => {
      await authService.createJWT(req as Request, res as Response, next);

      expect((authService.setCookie as SinonSpy).calledOnce).to.be.true;
    });

    it('should throw an error if there is a problem creating the JWT', async () => {
      sinon.stub(authService.createToken as SinonStub).throws(new Error());
      try {
        await authService.createJWT(req as Request, res as Response, next);
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.message).to.equal('Failed to create JWT');
      }
    });
  });

  describe('setCookie', () => {
    let res: Partial<Response>;
    let authService: AuthService;
    let usersService: UsersService;
    let usersDao: UsersDao;

    beforeEach(() => {
      usersDao = new UsersDao();
      usersService = new UsersService(usersDao);
      authService = new AuthService(usersService);
      res = {
        cookie: sinon.stub(),
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should set a cookie with the provided name and value', () => {
      authService.setCookie(res as Response, 'testName', 'testValue');

      expect((res.cookie as SinonStub).calledOnceWith('testName', 'testValue'))
        .to.be.true;
    });

    it('should set a cookie with the correct options', () => {
      authService.setCookie(res as Response, 'testName', 'testValue');

      expect(
        (res.cookie as SinonStub).calledOnceWith('testName', 'testValue', {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 15 * 24 * 60 * 60 * 1000,
        })
      );
    });

    it('should throw an error if the response object does not have a cookie method', () => {
      delete res.cookie;

      expect(() =>
        authService.setCookie(res as Response, 'testName', 'testValue')
      ).to.throw();
    });
  });

  describe('clearJWT', () => {
    let req: Partial<Request>;
    let res: Partial<Response & { locals: any }>;
    let next: SinonSpy;
    let authService: AuthService;
    let usersService: UsersService;
    let usersDao: UsersDao;

    beforeEach(() => {
      req = {};
      res = {
        locals: {
          jwt: {
            payload: { userId: 'testUserId' },
          },
        },
        clearCookie: sinon.stub(),
        status: sinon.stub().returnsThis(),
        send: sinon.stub(),
      };
      next = sinon.spy();
      usersDao = new UsersDao();
      usersService = new UsersService(usersDao);
      authService = new AuthService(usersService);

      sinon.stub(usersService, 'updateUserRefreshTokenById').resolves();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should throw an error if userId is not provided', async () => {
      delete res.locals.jwt.payload.userId;

      await authService.clearJWT(req as Request, res as Response, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(AppError);
      expect(next.firstCall.args[0].message).to.equal('User ID is required');
    });

    it('should clear the JWT cookie', async () => {
      await authService.clearJWT(req as Request, res as Response, next);

      expect((res.clearCookie as SinonStub).calledOnceWith('jwt')).to.be.true;
    });

    it('should throw an error if there is a problem clearing the JWT', async () => {
      (usersService.updateUserRefreshTokenById as SinonStub).throws(
        new Error()
      );
      await authService.clearJWT(req as Request, res as Response, next);

      expect(next.calledOnce).to.be.true;
      expect(next.firstCall.args[0]).to.be.instanceOf(AppError);
      expect(next.firstCall.args[0].message).to.equal('Failed to clear JWT');
    });
  });

  describe('createToken', () => {
    let authService: AuthService;
    let usersService: UsersService;
    let usersDao: UsersDao;
    let payload: string;
    let secret: string;
    let expiresIn: string;

    beforeEach(() => {
      usersDao = new UsersDao();
      usersService = new UsersService(usersDao);
      authService = new AuthService(usersService);
      payload = 'testPayload';
      secret = 'testSecret';
      expiresIn = '1h';
    });

    it('should return a JWT when provided with a payload, secret, and expiration time', () => {
      const token = authService.createToken(payload, secret, expiresIn);

      expect(token).to.be.a('string');
    });
  });
});
