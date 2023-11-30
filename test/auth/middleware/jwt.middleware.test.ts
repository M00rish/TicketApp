import 'mocha';
import { expect } from 'chai';
import sinon, { SinonSpy, SinonStub } from 'sinon';
import express from 'express';
import jwt from 'jsonwebtoken';
import { JwtMiddleware } from '../../../src/auth/middleware/jwt.middleware';
import AppError from '../../../src/common/types/appError';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';

describe('JwtMiddleware', () => {
  describe('checkValidToken', () => {
    let jwtMiddleware: JwtMiddleware;
    let req: express.Request;
    let res: express.Response;
    let next: express.NextFunction;

    beforeEach(() => {
      jwtMiddleware = new JwtMiddleware();
      req = {
        headers: {
          authorization: 'Bearer token',
        },
      } as express.Request;
      res = {
        locals: {},
      } as express.Response;
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() with an error if the authorization header is missing', async () => {
      delete req.headers.authorization;
      await jwtMiddleware.checkValidToken(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.instanceOf(AppError);
      expect((next as SinonSpy).getCall(0).args[0].message).to.equal(
        'You are not logged in'
      );
    });

    it('should call next() with an error if the bearer is not "Bearer"', async () => {
      req.headers.authorization = 'NotBearer token';
      await jwtMiddleware.checkValidToken(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.instanceOf(AppError);
      expect((next as SinonSpy).getCall(0).args[0].message).to.equal(
        'You are not logged in'
      );
    });

    it('should call next() with an error if the token is invalid', async () => {
      const error = new Error();
      sinon.stub(jwt, 'verify').yields(error, null);
      await jwtMiddleware.checkValidToken(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.equal(error);
    });

    it('should call next() if the token is valid', async () => {
      const jwtPayload = {
        iss: 'issuer',
        sub: 'subject',
        aud: 'audience',
        exp: 1234567890,
        nbf: 1234567890,
        iat: 1234567890,
        jti: 'jti',
      };
      sinon.stub(jwt, 'verify').yields(null, jwtPayload);
      await jwtMiddleware.checkValidToken(req, res, next);

      expect(res.locals).to.have.property('jwt');
      expect((next as SinonSpy).calledOnce).to.be.true;
    });
  });

  describe('checkValidRefreshToken', () => {
    let req: express.Request;
    let res: express.Response;
    let next: express.NextFunction;
    let jwtMiddleware: JwtMiddleware;

    beforeEach(() => {
      req = {
        headers: {
          cookie: 'refreshToken=token',
        },
      } as express.Request;
      res = {} as express.Response;
      next = sinon.spy();

      jwtMiddleware = new JwtMiddleware();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() with an error if the cookie header is missing', async () => {
      delete req.headers.cookie;
      await jwtMiddleware.checkValidRefreshToken(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.instanceOf(AppError);
      expect((next as SinonSpy).getCall(0).args[0].message).to.equal(
        'No refresh token provided'
      );
    });

    it('should call next() with an error if the refresh token is invalid', async () => {
      const error = new AppError(
        true,
        'LoginError',
        HttpStatusCode.Unauthorized,
        'Invalid refresh token'
      );
      sinon.stub(jwt, 'verify').yields(error, null);
      await jwtMiddleware.checkValidRefreshToken(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0].message).to.be.equal(
        'Invalid refresh token'
      );
    });

    it('should call next() if the refresh token is valid', async () => {
      sinon.stub(jwt, 'verify').yields(null, {});
      await jwtMiddleware.checkValidRefreshToken(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.undefined;
    });
  });

  describe('prepareBody', () => {
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: SinonSpy;
    let jwtMiddleware: JwtMiddleware;

    beforeEach(() => {
      req = {
        body: {},
      };
      res = {
        locals: {
          jwt: {
            payload: {
              userId: 'userId',
              refreshToken: 'refreshToken',
              permissionFlags: 'permissionFlags',
            },
          },
        },
      };
      next = sinon.spy();

      jwtMiddleware = new JwtMiddleware();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should prepare body and call next() if req.body is truthy', () => {
      req.body = {
        payload: {
          refreshToken: 'refreshToken',
        },
      };

      jwtMiddleware.prepareBody(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(req.body).to.deep.equal({
        userId: 'userId',
        refreshToken: 'refreshToken',
        permissionFlags: 'permissionFlags',
      });
      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args[0]).to.be.undefined;
    });

    it('should call next() with an error if req.body is falsy', () => {
      req.body = null;

      jwtMiddleware.prepareBody(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args[0]).to.be.instanceOf(AppError);
      expect(next.getCall(0).args[0].message).to.equal(
        'Something went wrong...'
      );
    });
  });

  // describe('rateLimitRefreshTokenRequests', () => {
  //   let req: express.Request;
  //   let res: express.Response;
  //   let next: express.NextFunction;
  //   let jwtMiddleware: JwtMiddleware;

  //   beforeEach(() => {
  //     req = {} as express.Request;
  //     res = {
  //       status: sinon.stub().returnsThis(),
  //       send: sinon.spy(),
  //     } as unknown as express.Response;
  //     next = sinon.spy();

  //     jwtMiddleware = new JwtMiddleware();
  //   });

  //   afterEach(() => {
  //     sinon.restore();
  //   });

  //   it('should allow the first request', () => {
  //     jwtMiddleware.rateLimitRefreshTokenRequests(req, res, next);

  //     expect((next as SinonSpy).calledOnce).to.be.true;
  //   });

  //   it('should block subsequent requests within 15 days', () => {
  //     jwtMiddleware.rateLimitRefreshTokenRequests(req, res, next);
  //     jwtMiddleware.rateLimitRefreshTokenRequests(req, res, next);

  //     expect((res.status as SinonStub).calledOnceWith(429)).to.be.true;
  //     expect(
  //       (res.send as SinonSpy).calledOnceWith(
  //         'Too many requests, please try again after 15 days'
  //       )
  //     ).to.be.true;
  //   });
  // });
});
