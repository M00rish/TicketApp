import express from 'express';
import { expect } from 'chai';
import mocha from 'mocha';
import { UsersController } from '../../../src/users/controllers/users.controller';
import { UsersService } from '../../../src/users/services/users.service';
import { UsersDao } from '../../../src/users/daos/users.dao';
import sinon from 'sinon';

describe('UsersController', () => {
  describe('Constructor', () => {
    let usersService: UsersService;
    let usersController: UsersController;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;

      usersController = new UsersController(usersService);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should create an instance of UsersController', () => {
      expect(usersController).to.be.instanceOf(UsersController);
    });

    it('should have usersService initialized', () => {
      expect((usersController as any).usersService).to.equal(usersService);
    });
  });

  describe('listUsers', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = {};
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to list users and send the users with status 200', async () => {
      const expectedUsers = [
        {
          id: 'userId1',
          email: 'email1@gmail.com',
          password: 'pass123',
          firstName: 'mark',
          lastName: 'wasl',
        },
        {
          id: 'userId2',
          email: 'email2@gmail.com',
          password: 'pass123',
          firstName: 'mark',
          lastName: 'wasl',
        },
      ];

      usersService.list = sinon.stub().resolves(expectedUsers);

      await usersController.listUsers(
        req as express.Request,
        res as express.Response,
        next
      );

      expect((usersService.list as sinon.SinonStub).calledOnceWith(100, 0)).to
        .be.true;
      expect(status.calledOnceWith(200)).to.be.true;
      expect(json.calledOnceWith(expectedUsers)).to.be.true;
    });

    it('should call next with the error if listUsers fails', async () => {
      const error = new Error('Failed to list users');
      (usersService.list as sinon.SinonStub).rejects(error);

      await usersController.listUsers(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('getUserById', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = { body: { id: 'userId1' } };
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to get user by id and send the user with status 200', async () => {
      const expectedUser = {
        id: 'userId1',
        email: 'email1@gmail.com',
        password: 'pass123',
        firstName: 'mark',
        lastName: 'wasl',
      };

      (usersService.getById as sinon.SinonStub).resolves(expectedUser);

      await usersController.getUserById(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(
        (usersService.getById as sinon.SinonStub).calledOnceWith(req.body.id)
      ).to.be.true;
      expect(status.calledOnceWith(200)).to.be.true;
      expect(json.calledOnceWith(expectedUser)).to.be.true;
    });

    it('should call next with the error if getUserById fails', async () => {
      const error = new Error('Failed to get user');
      (usersService.getById as sinon.SinonStub).rejects(error);

      await usersController.getUserById(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('createUser', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = {
        body: {
          email: 'email1@gmail.com',
          password: 'pass123',
          firstName: 'mark',
          lastName: 'wasl',
        },
      };
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to create user and send the user id with status 201', async () => {
      const expectedUserId = 'userId1';

      (usersService.create as sinon.SinonStub).resolves(expectedUserId);

      await usersController.createUser(
        req as express.Request,
        res as express.Response,
        next
      );

      expect((usersService.create as sinon.SinonStub).calledOnceWith(req.body))
        .to.be.true;
      expect(status.calledOnceWith(201)).to.be.true;
      expect(json.calledOnceWith({ _id: expectedUserId })).to.be.true;
    });

    it('should call next with the error if createUser fails', async () => {
      const error = new Error('Failed to create user');
      (usersService.create as sinon.SinonStub).rejects(error);

      await usersController.createUser(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('patchUserById', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = {
        params: { userId: 'userId1' },
        body: {
          email: 'email1@gmail.com',
          password: 'pass123',
          firstName: 'mark',
          lastName: 'wasl',
        },
      } as Partial<express.Request>;
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to update user by id and send the user id with status 200', async () => {
      const expectedUserId = 'userId1';

      (usersService.updateById as sinon.SinonStub).resolves(expectedUserId);

      await usersController.patchUserById(
        req as express.Request,
        res as express.Response,
        next
      );

      if (req.params) {
        expect(
          (usersService.updateById as sinon.SinonStub).calledOnceWith(
            req.params.userId,
            req.body
          )
        ).to.be.true;
      } else {
        expect(false).to.be.true;
      }
      expect(status.calledOnceWith(200)).to.be.true;
      expect(json.calledOnceWith({ _id: expectedUserId })).to.be.true;
    });

    it('should call next with the error if patchUserById fails', async () => {
      const error = new Error('Failed to update user');
      (usersService.updateById as sinon.SinonStub).rejects(error);

      await usersController.patchUserById(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('deleteUser', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = { body: { id: 'userId1' } };
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to delete user and send status 204', async () => {
      (usersService.deleteById as sinon.SinonStub).resolves();

      await usersController.deleteUser(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(
        (usersService.deleteById as sinon.SinonStub).calledOnceWith(req.body.id)
      ).to.be.true;
      expect(status.calledOnceWith(204)).to.be.true;
      expect(json.calledOnce).to.be.true;
    });

    it('should call next with the error if deleteUser fails', async () => {
      const error = new Error('Failed to delete user');
      (usersService.deleteById as sinon.SinonStub).rejects(error);

      await usersController.deleteUser(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('patchPermissionFlags', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = {
        params: { permissionFlags: '1' },
        body: { id: 'userId1' },
      } as { params: { permissionFlags: string }; body: { id: string } };
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to update user permission flags and send the user id with status 200', async () => {
      const expectedUserId = 'userId1';

      (usersService.updateById as sinon.SinonStub).resolves(expectedUserId);

      await usersController.patchPermissionFlags(
        req as express.Request,
        res as express.Response,
        next
      );

      if (req.params) {
        expect(
          (usersService.updateById as sinon.SinonStub).calledOnceWith(
            req.body.id,
            {
              id: req.body.id, //@ts-ignore
              permissionFlags: parseInt(req.params.permissionFlags),
            }
          )
        ).to.be.true;
      } else {
        expect(false).to.be.true;
      }
      expect(status.calledOnceWith(200)).to.be.true;
      expect(json.calledOnceWith({ _id: expectedUserId })).to.be.true;
    });

    it('should call next with the error if patchPermissionFlags fails', async () => {
      const error = new Error('Failed to update user permission flags');
      (usersService.updateById as sinon.SinonStub).rejects(error);

      await usersController.patchPermissionFlags(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('deleteAllUsers', () => {
    let usersController: UsersController;
    let usersService: UsersService;
    let req: Partial<express.Request>;
    let res: Partial<express.Response>;
    let next: sinon.SinonSpy;
    let status: sinon.SinonSpy;
    let json: sinon.SinonSpy;

    beforeEach(() => {
      usersService = sinon.createStubInstance(
        UsersService
      ) as unknown as UsersService;
      usersController = new UsersController(usersService);
      req = {};
      res = {
        status: function (this: express.Response, code: number) {
          return this;
        },
        json: function (this: express.Response, body?: any) {
          return this;
        },
      } as Partial<express.Response>;
      status = sinon.spy(res, 'status');
      json = sinon.spy(res, 'json');
      next = sinon.spy();
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call the usersService to delete all users and send status 204', async () => {
      await usersController.deleteAllUsers(
        req as express.Request,
        res as express.Response,
        next
      );

      expect((usersService.deleteAllUsers as sinon.SinonStub).calledOnce).to.be
        .true;
      expect(status.calledOnceWith(204)).to.be.true;
      expect(json.calledOnce).to.be.true;
    });

    it('should call next with the error if deleteAllUsers fails', async () => {
      const error = new Error('Failed to delete all users');
      (usersService.deleteAllUsers as sinon.SinonStub).rejects(error);

      await usersController.deleteAllUsers(
        req as express.Request,
        res as express.Response,
        next
      );

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });
});
