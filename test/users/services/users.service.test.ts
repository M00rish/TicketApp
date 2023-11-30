import { UsersService } from '../../../src/users/services/users.service';
import { UsersDao } from '../../../src/users/daos/users.dao';
import { CreateUserDto } from '../../../src/users/dtos/create.user.dto';
import { PatchUserDto } from '../../../src/users/dtos/patch.user.dto';

import mocha from 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

describe('UsersService', () => {
  describe('Contructor', () => {
    let usersDao: any;
    let usersService: UsersService;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao);
      usersService = new UsersService(usersDao);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should create an instance of UsersService', () => {
      expect(usersService).to.be.instanceOf(UsersService);
    });

    it('should set usersDao property correctly', () => {
      expect((usersService as any).usersDao).to.equal(usersDao);
    });
  });

  describe('create', () => {
    let usersService: UsersService;
    let usersDao: any;
    let createUserDto: CreateUserDto;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      createUserDto = {
        email: 'email@gmail.com',
        password: 'pass123',
        firstName: 'mark',
        lastName: 'wasl',
      };
    });

    it('should call the usersDao to create user and return id', async () => {
      const expectedResult = { id: 'userId', ...createUserDto };
      usersDao.createUser.resolves(expectedResult.id);

      const result = await usersService.create(createUserDto);

      expect(usersDao.createUser.calledOnceWith(createUserDto)).to.be.true;
      expect(result).to.equal(expectedResult.id);
    });

    it('should throw an error if createUser fails', async () => {
      const error = new Error('Failed to create user');
      usersDao.createUser.rejects(error);

      try {
        await usersService.create(createUserDto);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('getById', () => {
    let usersService: UsersService;
    let usersDao: any;
    let userId: string;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      userId = 'userId';
    });

    it('should call the usersDao to get user by id and return the user', async () => {
      const expectedUser = {
        id: userId,
        email: 'email@gmail.com',
        password: 'pass123',
        firstName: 'mark',
        lastName: 'wasl',
      };
      usersDao.getUserById.resolves(expectedUser);

      const result = await usersService.getById(userId);

      expect(usersDao.getUserById.calledOnceWith(userId)).to.be.true;
      expect(result).to.equal(expectedUser);
    });

    it('should throw an error if getUserById fails', async () => {
      const error = new Error('Failed to get user');
      usersDao.getUserById.rejects(error);

      try {
        await usersService.getById(userId);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('deleteById', () => {
    let usersService: UsersService;
    let usersDao: any;
    let userId: string;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      userId = 'userId';
    });

    it('should call the usersDao to delete user by id and return the result', async () => {
      const expectedResult = { deleted: true };
      usersDao.deleteUserById.resolves(expectedResult);

      const result = await usersService.deleteById(userId);

      expect(usersDao.deleteUserById.calledOnceWith(userId)).to.be.true;
      expect(result).to.equal(expectedResult);
    });

    it('should throw an error if deleteUserById fails', async () => {
      const error = new Error('Failed to delete user');
      usersDao.deleteUserById.rejects(error);

      try {
        await usersService.deleteById(userId);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('list', () => {
    let usersService: UsersService;
    let usersDao: any;
    let limit: number;
    let page: number;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      limit = 10;
      page = 1;
    });

    it('should call the usersDao to list users and return the result', async () => {
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
      usersDao.listUsers.resolves(expectedUsers);

      const result = await usersService.list(limit, page);

      expect(usersDao.listUsers.calledOnceWith(limit, page)).to.be.true;
      expect(result).to.equal(expectedUsers);
    });

    it('should throw an error if listUsers fails', async () => {
      const error = new Error('Failed to list users');
      usersDao.listUsers.rejects(error);

      try {
        await usersService.list(limit, page);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('updateById', () => {
    let usersService: UsersService;
    let usersDao: any;
    let userId: string;
    let patchUserDto: PatchUserDto;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      userId = 'userId';
      patchUserDto = {
        email: 'updatedEmail@gmail.com',
        lastName: 'updatedLastName',
      };
    });

    it('should call the usersDao to update user by id and return the result', async () => {
      const expectedResult = { id: userId, ...patchUserDto };
      usersDao.updateUserById.resolves(expectedResult);

      const result = await usersService.updateById(userId, patchUserDto);

      expect(usersDao.updateUserById.calledOnceWith(userId, patchUserDto)).to.be
        .true;
      expect(result).to.equal(expectedResult);
    });

    it('should throw an error if updateUserById fails', async () => {
      const error = new Error('Failed to update user');
      usersDao.updateUserById.rejects(error);

      try {
        await usersService.updateById(userId, patchUserDto);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('getUserByEmail', () => {
    let usersService: UsersService;
    let usersDao: any;
    let userEmail: string;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      userEmail = 'email@gmail.com';
    });

    it('should call the usersDao to get user by email and return the user', async () => {
      const expectedUser = {
        id: 'userId',
        email: userEmail,
        password: 'pass123',
        firstName: 'mark',
        lastName: 'wasl',
      };
      usersDao.getUserByEmail.resolves(expectedUser);

      const result = await usersService.getUserByEmail(userEmail);

      expect(usersDao.getUserByEmail.calledOnceWith(userEmail)).to.be.true;
      expect(result).to.equal(expectedUser);
    });

    it('should throw an error if getUserByEmail fails', async () => {
      const error = new Error('Failed to get user');
      usersDao.getUserByEmail.rejects(error);

      try {
        await usersService.getUserByEmail(userEmail);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('getUserByEmailWithPassword', () => {
    let usersService: UsersService;
    let usersDao: any;
    let userEmail: string;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      userEmail = 'email@gmail.com';
    });

    it('should call the usersDao to get user by email with password and return the user', async () => {
      const expectedUser = {
        id: 'userId',
        email: userEmail,
        password: 'pass123',
        firstName: 'mark',
        lastName: 'wasl',
      };
      usersDao.getUserByEmailWithPassword.resolves(expectedUser);

      const result = await usersService.getUserByEmailWithPassword(userEmail);

      expect(usersDao.getUserByEmailWithPassword.calledOnceWith(userEmail)).to
        .be.true;
      expect(result).to.equal(expectedUser);
    });

    it('should throw an error if getUserByEmailWithPassword fails', async () => {
      const error = new Error('Failed to get user');
      usersDao.getUserByEmailWithPassword.rejects(error);

      try {
        await usersService.getUserByEmailWithPassword(userEmail);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('updateUserRefreshTokenById', () => {
    let usersService: UsersService;
    let usersDao: any;
    let userId: string;
    let refreshToken: string;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
      userId = 'userId';
      refreshToken = 'refreshToken123';
    });

    it('should call the usersDao to update user refresh token by id', async () => {
      await usersService.updateUserRefreshTokenById(userId, refreshToken);
      expect(
        usersDao.updateUserRefreshTokenById.calledOnceWith(userId, refreshToken)
      ).to.be.true;
    });

    it('should throw an error if updateUserRefreshTokenById fails', async () => {
      const error = new Error('Failed to update user refresh token');
      usersDao.updateUserRefreshTokenById.rejects(error);

      try {
        await usersService.updateUserRefreshTokenById(userId, refreshToken);
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('deleteAllUsers', () => {
    let usersService: UsersService;
    let usersDao: any;

    beforeEach(() => {
      usersDao = sinon.createStubInstance(UsersDao) as unknown as UsersDao;
      usersService = new UsersService(usersDao);
    });

    it('should call the usersDao to delete all users', async () => {
      await usersService.deleteAllUsers();
      expect(usersDao.deleteAllUsers.calledOnce).to.be.true;
    });

    it('should throw an error if deleteAllUsers fails', async () => {
      const error = new Error('Failed to delete all users');
      usersDao.deleteAllUsers.rejects(error);

      try {
        await usersService.deleteAllUsers();
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
