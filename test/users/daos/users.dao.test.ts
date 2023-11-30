import { assert, expect } from 'chai';
import sinon from 'sinon';
import shortid from 'shortid';
import mocha from 'mocha';
import { exit } from 'process';

import { UsersDao } from '../../../src/users/daos/users.dao';
import AppError from '../../../src/common/types/appError';
import commonService from '../../../src/common/service/common.service';
import debug from 'debug';

describe('UsersDao', () => {
  let usersDao: UsersDao = new UsersDao();

  describe('Constructor', () => {
    let getOrCreateModelStub: sinon.SinonStub;

    beforeEach(() => {
      getOrCreateModelStub = sinon.stub(commonService, 'getOrCreateModel');
    });

    afterEach(() => {
      getOrCreateModelStub.restore();
    });

    it('should log a message and initialize User', () => {
      const userModel = { name: 'User' };
      getOrCreateModelStub.returns(userModel);

      const usersDao = new UsersDao();

      expect(
        getOrCreateModelStub.calledWithExactly(usersDao.userSchema, 'User')
      ).to.be.true;
      expect(usersDao.User).to.equal(userModel);
    });
  });

  describe('createUser', () => {
    let saveUserStub: sinon.SinonStub;
    let generateIdStub: sinon.SinonStub;

    beforeEach(() => {
      saveUserStub = sinon.stub(usersDao.User.prototype, 'save');
      generateIdStub = sinon.stub(shortid, 'generate');
    });

    afterEach(() => {
      saveUserStub.restore();
      generateIdStub.restore();
    });

    it('should create a user and return an id', async () => {
      const userFields = {
        email: `john@gmail.com`,
        password: '123abc',
        firstName: 'John',
        lastName: 'Doe',
      };

      generateIdStub.returns('generatedUserId');

      const userId = await usersDao.createUser(userFields);

      expect(userId).to.equal('generatedUserId');
      expect(generateIdStub.calledOnce).to.be.true;
      expect(saveUserStub.calledOnce).to.be.true;
    });

    it('should throw an error when save fails', async () => {
      const userFields = {
        email: `john@gmail.com`,
        password: '123abc',
        firstName: 'John',
        lastName: 'Doe',
      };

      const error = new Error('Failed to save user');
      saveUserStub.throws(error);

      try {
        await usersDao.createUser(userFields);
      } catch (err: any) {
        expect(err).to.equal(error);
      }

      expect(generateIdStub.calledOnce).to.be.true;
      expect(saveUserStub.calledOnce).to.be.true;
    });
  });

  describe('updateUserById', () => {
    let findByIdStub: sinon.SinonStub;
    let findOneAndUpdateStub: sinon.SinonStub;

    beforeEach(() => {
      findByIdStub = sinon.stub(usersDao.User, 'findById');
      findOneAndUpdateStub = sinon.stub(usersDao.User, 'findOneAndUpdate');
    });

    afterEach(() => {
      findByIdStub.restore();
      findOneAndUpdateStub.restore();
    });

    it('should update a user and return an id', async () => {
      const userId = 'userId';
      const userFields = {
        email: `mark10@gmail.com`,
        firstName: 'Markos',
        lastName: 'masos',
      };

      const user = {
        _id: userId,
        email: `mark@gmail.com`,
        password: '123qw',
        firstName: 'Mark',
        lastName: 'mas',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(user),
      });

      findOneAndUpdateStub.returns({
        exec: sinon.stub().resolves(user),
      });

      const updatedUserId = await usersDao.updateUserById(userId, userFields);

      expect(updatedUserId).to.equal(userId);
      expect(findByIdStub.calledOnce).to.be.true;
      expect(findOneAndUpdateStub.calledOnce).to.be.true;
    });

    it('should throw an error when user is not found', async () => {
      const userId = 'userId';
      const userFields = {
        email: `mark10@gmail.com`,
        firstName: 'Markos',
        lastName: 'masos',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await usersDao.updateUserById(userId, userFields);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('User not found');
      }

      expect(findByIdStub.calledOnce).to.be.true;
      expect(findOneAndUpdateStub.called).to.be.false;
    });

    it('should throw an error when update fails', async () => {
      const userId = 'userId';
      const userFields = {
        email: `mark10@gmail.com`,
        firstName: 'Markos',
        lastName: 'masos',
      };

      const user = {
        _id: userId,
        email: `mark@gmail.com`,
        password: '123qw',
        firstName: 'Mark',
        lastName: 'mas',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(user),
      });
      findOneAndUpdateStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await usersDao.updateUserById(userId, userFields);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('Failed to update user');
      }

      expect(findByIdStub.calledOnce).to.be.true;
      expect(findOneAndUpdateStub.calledOnce).to.be.true;
    });
  });

  describe('getUserByEmail', () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      findOneStub = sinon.stub(usersDao.User, 'findOne');
    });

    afterEach(() => {
      findOneStub.restore();
    });

    it('should return a user when found', async () => {
      const email = 'john@gmail.com';

      const user = {
        _id: 'userId',
        email: email,
        password: '123qw',
        firstName: 'John',
        lastName: 'Doe',
      };

      findOneStub.returns({
        exec: sinon.stub().resolves(user),
      });

      const returnedUser = await usersDao.getUserByEmail(email);

      expect(returnedUser).to.equal(user);
      expect(findOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when user is not found', async () => {
      const email = 'john@gmail.com';

      findOneStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await usersDao.getUserByEmail(email);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('User not found');
      }

      expect(findOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when findOne fails', async () => {
      const email = 'john@gmail.com';

      const error = new Error('Failed to find user');
      findOneStub.returns({
        exec: sinon.stub().rejects(error),
      });

      try {
        await usersDao.getUserByEmail(email);
      } catch (error: any) {
        expect(error).to.equal(error);
      }

      expect(findOneStub.calledOnce).to.be.true;
    });
  });

  describe('getUserById', () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      findOneStub = sinon.stub(usersDao.User, 'findOne');
    });

    afterEach(() => {
      findOneStub.restore();
    });

    it('should return a user when found', async () => {
      const userId = 'userId';

      const user = {
        _id: userId,
        email: `john@gmail.com`,
        firstName: 'John',
        lastName: 'Doe',
      };

      findOneStub.returns({
        select: sinon.stub().returns({
          exec: sinon.stub().resolves(user),
        }),
      });

      const returnedUser = await usersDao.getUserById(userId);

      expect(returnedUser).to.equal(user);
      expect(findOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when user is not found', async () => {
      const userId = 'userId';

      findOneStub.returns({
        select: sinon.stub().returns({
          exec: sinon.stub().resolves(null),
        }),
      });

      try {
        await usersDao.getUserById(userId);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('User not found');
      }

      expect(findOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when findOne fails', async () => {
      const userId = 'userId';

      const error = new Error('Failed to find user');
      findOneStub.returns({
        select: sinon.stub().returns({
          exec: sinon.stub().rejects(error),
        }),
      });

      try {
        await usersDao.getUserById(userId);
      } catch (error: any) {
        expect(error).to.equal(error);
      }

      expect(findOneStub.calledOnce).to.be.true;
    });
  });

  describe('listUsers', () => {
    let findStub: sinon.SinonStub;

    beforeEach(() => {
      findStub = sinon.stub(usersDao.User, 'find');
    });

    afterEach(() => {
      findStub.restore();
    });

    it('should return a list of users when found', async () => {
      const users = [
        {
          _id: 'userId1',
          email: `john1@gmail.com`,
          password: '123qw',
          firstName: 'John1',
          lastName: 'Doe1',
        },
        {
          _id: 'userId2',
          email: `john2@gmail.com`,
          password: '123qw',
          firstName: 'John2',
          lastName: 'Doe2',
        },
      ];

      findStub.returns({
        limit: sinon.stub().returns({
          skip: sinon.stub().returns({
            exec: sinon.stub().resolves(users),
          }),
        }),
      });

      const returnedUsers = await usersDao.listUsers();

      expect(returnedUsers).to.equal(users);
      expect(findStub.calledOnce).to.be.true;
    });

    it('should throw an error when find fails', async () => {
      const error = new Error('Failed to find users');
      findStub.returns({
        limit: sinon.stub().returns({
          skip: sinon.stub().returns({
            exec: sinon.stub().rejects(error),
          }),
        }),
      });

      try {
        await usersDao.listUsers();
      } catch (err: any) {
        expect(err).to.equal(error);
      }

      expect(findStub.calledOnce).to.be.true;
    });
  });

  describe('deleteUserById', () => {
    let findByIdStub: sinon.SinonStub;
    let deleteOneStub: sinon.SinonStub;

    beforeEach(() => {
      findByIdStub = sinon.stub(usersDao.User, 'findById');
      deleteOneStub = sinon.stub(usersDao.User, 'deleteOne');
    });

    afterEach(() => {
      findByIdStub.restore();
      deleteOneStub.restore();
    });

    it('should delete a user and not throw an error', async () => {
      const userId = 'userId';

      const user = {
        _id: userId,
        email: `john@gmail.com`,
        firstName: 'John',
        lastName: 'Doe',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(user),
      });

      deleteOneStub.returns({
        exec: sinon.stub().resolves({ deletedCount: 1 }),
      });

      await usersDao.deleteUserById(userId);

      expect(findByIdStub.calledOnce).to.be.true;
      expect(deleteOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when user is not found', async () => {
      const userId = 'userId';

      findByIdStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await usersDao.deleteUserById(userId);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('User not found');
      }

      expect(findByIdStub.calledOnce).to.be.true;
      expect(deleteOneStub.called).to.be.false;
    });

    it('should throw an error when delete fails', async () => {
      const userId = 'userId';

      const user = {
        _id: userId,
        email: `john@gmail.com`,
        firstName: 'John',
        lastName: 'Doe',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(user),
      });

      deleteOneStub.returns({
        exec: sinon.stub().resolves({ deletedCount: 0 }),
      });

      try {
        await usersDao.deleteUserById(userId);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('Failed to delete user');
      }

      expect(findByIdStub.calledOnce).to.be.true;
      expect(deleteOneStub.calledOnce).to.be.true;
    });
  });

  describe('getUserByEmailWithPassword', () => {
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      findOneStub = sinon.stub(usersDao.User, 'findOne');
    });

    afterEach(() => {
      findOneStub.restore();
    });

    it('should return a user when found', async () => {
      const email = 'john@gmail.com';

      const user = {
        _id: 'userId',
        email: email,
        password: '123qw',
        permissionFlags: 'user',
      };

      findOneStub.returns({
        select: sinon.stub().returns({
          exec: sinon.stub().resolves(user),
        }),
      });

      const returnedUser = await usersDao.getUserByEmailWithPassword(email);

      expect(returnedUser).to.equal(user);
      expect(findOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when user is not found', async () => {
      const email = 'john@gmail.com';

      findOneStub.returns({
        select: sinon.stub().returns({
          exec: sinon.stub().resolves(null),
        }),
      });

      try {
        await usersDao.getUserByEmailWithPassword(email);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('User not found');
      }

      expect(findOneStub.calledOnce).to.be.true;
    });

    it('should throw an error when findOne fails', async () => {
      const email = 'john@gmail.com';

      const error = new Error('Failed to find user');
      findOneStub.returns({
        select: sinon.stub().returns({
          exec: sinon.stub().rejects(error),
        }),
      });

      try {
        await usersDao.getUserByEmailWithPassword(email);
      } catch (error: any) {
        expect(error).to.equal(error);
      }

      expect(findOneStub.calledOnce).to.be.true;
    });
  });

  describe('updateUserRefreshTokenById', () => {
    let findByIdStub: sinon.SinonStub;
    let findOneAndUpdateStub: sinon.SinonStub;

    beforeEach(() => {
      findByIdStub = sinon.stub(usersDao.User, 'findById');
      findOneAndUpdateStub = sinon.stub(usersDao.User, 'findOneAndUpdate');
    });

    afterEach(() => {
      findByIdStub.restore();
      findOneAndUpdateStub.restore();
    });

    it('should update a user refresh token and return void', async () => {
      const userId = 'userId';
      const refreshToken = 'refreshToken123';

      const user = {
        _id: userId,
        email: `john@gmail.com`,
        password: '123qw',
        firstName: 'John',
        lastName: 'Doe',
        refreshToken: 'refreshTokenOld',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(user),
      });

      findOneAndUpdateStub.returns({
        exec: sinon.stub().resolves({
          ...user,
          refreshToken,
        }),
      });

      await usersDao.updateUserRefreshTokenById(userId, refreshToken);

      expect(findByIdStub.calledOnce).to.be.true;
      expect(findOneAndUpdateStub.calledOnce).to.be.true;
    });

    it('should throw an error when user is not found', async () => {
      const userId = 'userId';
      const refreshToken = 'refreshToken123';

      findByIdStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await usersDao.updateUserRefreshTokenById(userId, refreshToken);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('User not found');
        expect(findByIdStub.calledOnce).to.be.true;
        expect(findOneAndUpdateStub.called).to.be.false;
      }
    });

    it('should throw an error when update fails', async () => {
      const userId = 'userId';
      const refreshToken = 'refreshToken123';

      const user = {
        _id: userId,
        email: `john@gmail.com`,
        password: '123qw',
        firstName: 'John',
        lastName: 'Doe',
        refreshToken: 'refreshTokenOld',
      };

      findByIdStub.returns({
        exec: sinon.stub().resolves(user),
      });
      findOneAndUpdateStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await usersDao.updateUserRefreshTokenById(userId, refreshToken);
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.message).to.equal('Failed to update user');
        expect(findByIdStub.calledOnce).to.be.true;
        expect(findOneAndUpdateStub.calledOnce).to.be.true;
      }
    });
  });

  describe('deleteAllUsers', () => {
    let deleteManyStub: sinon.SinonStub;

    beforeEach(() => {
      deleteManyStub = sinon.stub(usersDao.User, 'deleteMany');
    });

    afterEach(() => {
      deleteManyStub.restore();
    });

    it('should delete all users successfully', async () => {
      deleteManyStub.returns({
        exec: sinon.stub().resolves(),
      });

      await usersDao.deleteAllUsers();

      expect(deleteManyStub.calledOnce).to.be.true;
    });

    it('should throw an error when deleteMany fails', async () => {
      const error = new Error('Failed to delete users');
      deleteManyStub.returns({
        exec: sinon.stub().rejects(error),
      });

      try {
        await usersDao.deleteAllUsers();
      } catch (err: any) {
        expect(err).to.equal(error);
      }

      expect(deleteManyStub.calledOnce).to.be.true;
    });
  });
});
