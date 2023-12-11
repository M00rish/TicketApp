import 'mocha';
import { expect } from 'chai';
import sinon, { SinonSpy } from 'sinon';
import express from 'express';
import bcrypt from 'bcryptjs';
import { UsersService } from '../../../src/users/services/users.service';
import { AuthMiddlware } from '../../../src/auth/middleware/auth.middleware';
import { UsersDao } from '../../../src/users/daos/users.dao';
import AppError from '../../../src/common/types/appError';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';

describe('AuthMiddleware', () => {
  describe('constructor', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let usersDao = new UsersDao(commonService);
    let usersService = new UsersService(usersDao);
    let authMiddleware: AuthMiddlware;

    beforeEach(() => {});

    it('should create a new instance of AuthMiddlware', () => {
      authMiddleware = new AuthMiddlware(usersService);
      expect(authMiddleware).to.be.instanceOf(AuthMiddlware);
    });

    it('should have usersService initialized', () => {
      authMiddleware = new AuthMiddlware(usersService);
      expect(authMiddleware['usersService']).to.equal(usersService);
    });

    it('should bind verifyUserPassword method', () => {
      authMiddleware = new AuthMiddlware(usersService);
      const originalMethod = authMiddleware.verifyUserPassword;
      authMiddleware.verifyUserPassword = (req, res, next) => Promise.resolve();
      expect(authMiddleware.verifyUserPassword).to.not.equal(originalMethod);
    });
  });

  describe('verifyUserPassword', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let usersDao = new UsersDao(commonService);
    let usersService = new UsersService(usersDao);
    let authMiddleware = new AuthMiddlware(usersService);
    let req: express.Request;
    let res: express.Response;
    let next: express.NextFunction;
    let user: any;

    beforeEach(() => {
      req = {
        body: {
          email: 'test@test.com',
          password: 'password',
        },
      } as express.Request;
      res = {} as express.Response;
      next = sinon.spy();
      user = {
        _id: '123',
        password: bcrypt.hashSync('password', 10),
        permissionFlags: 'user',
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() if the password is correct', async () => {
      sinon.stub(usersService, 'getUserByEmailWithPassword').returns(user);
      await authMiddleware.verifyUserPassword(req, res, next);
      expect(req.body).to.have.property('userId');
      expect(req.body).to.have.property('permissionFlags');
      expect((next as SinonSpy).calledOnce).to.be.true;
    });

    it('should call next() with an error if the password is incorrect', async () => {
      user.password = bcrypt.hashSync('wrongpassword', 10);
      sinon.stub(usersService, 'getUserByEmailWithPassword').returns(user);
      await authMiddleware.verifyUserPassword(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.instanceOf(AppError);
      expect((next as SinonSpy).getCall(0).args[0].message).to.equal(
        'Invalid email or password'
      );
    });

    it('should call next() with an error if the user does not exist', async () => {
      sinon.stub(usersService, 'getUserByEmailWithPassword').resolves(null);
      await authMiddleware.verifyUserPassword(req, res, next);
      expect((next as SinonSpy).calledOnce).to.be.true;
      expect((next as SinonSpy).getCall(0).args[0]).to.be.instanceOf(AppError);
      expect((next as SinonSpy).getCall(0).args[0].message).to.equal(
        'Invalid email or password'
      );
    });
  });
});
