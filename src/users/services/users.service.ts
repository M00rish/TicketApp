import debug from 'debug';
import { PatchUserDto } from '../dtos/patch.user.dto';
import { CreateUserDto } from '../dtos/create.user.dto';
import { CRUD } from '../../common/interfaces/crud.interface';
import { UsersDao } from '../daos/users.dao';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:Users-Service');

class UsersService implements CRUD {
  /**
   * Creates a new instance of the UsersService.
   * @param usersDao - The users data access object.
   */
  constructor(private usersDao: UsersDao) {
    this.usersDao = usersDao;
    log('Created new instance of UsersService');
  }

  /**
   * Creates a new user.
   * @param resource The user data to create.
   * @returns The created user.
   */
  public async create(resource: CreateUserDto) {
    try {
      const userId = await this.usersDao.createUser(resource);
      return userId;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Retrieves a list of users.
   * @param limit The maximum number of users to retrieve.
   * @param page The page number of the results.
   * @returns A promise that resolves to the list of users.
   */
  public async list(limit: number, page: number) {
    try {
      const users = await this.usersDao.list(limit, page);
      return users;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Retrieves a user by their ID.
   * @param id - The ID of the user.
   * @returns A Promise that resolves to the user object.
   */
  public async getById(id: string) {
    try {
      const user = await this.usersDao.getById(id);

      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      return user;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Updates a user by their ID.
   * @param id - The ID of the user to update.
   * @param resource - The updated user data.
   * @returns A Promise that resolves to the updated user.
   */
  public async updateById(id: string, userFields: PatchUserDto) {
    try {
      const user = this.getById(id);
      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      const updatedUser = await this.usersDao.updateById(id, userFields);

      if (!updatedUser)
        throw new AppError(
          false,
          'updateUserError',
          HttpStatusCode.InternalServerError,
          'Failed to update user'
        );

      return updatedUser._id;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Deletes a user by their ID.
   * @param id The ID of the user to delete.
   * @returns A promise that resolves when the user is deleted.
   */
  public async deleteById(id: string) {
    try {
      const user = await this.getById(id);
      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      const deletedDoc = await this.usersDao.deleteById(id);
      if (deletedDoc.deletedCount === 0)
        throw new AppError(
          false,
          'deleteUserError',
          HttpStatusCode.InternalServerError,
          'Failed to delete user'
        );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address of the user.
   * @returns A Promise that resolves to the user object.
   */
  public async getUserByEmail(email: string) {
    try {
      const user = await this.usersDao.getUserByEmail(email);

      if (!user)
        throw new AppError(
          false,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      return user;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Retrieves a user by their email along with their password.
   * @param email - The email of the user.
   * @returns A promise that resolves to the user with the specified email and password.
   */
  public async getUserByEmailWithPassword(email: string) {
    try {
      const user = await this.usersDao.getUserByEmailWithPassword(email);

      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );
      return user;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Updates the refresh token of a user by their ID.
   * @param id - The ID of the user.
   * @param refreshToken - The new refresh token.
   */
  public async updateUserRefreshTokenById(id: string, refreshToken: string) {
    try {
      const user = await this.getById(id);

      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      const updatedUser = await this.usersDao.updateUserRefreshTokenById(
        id,
        refreshToken
      );

      if (!updatedUser)
        throw new AppError(
          false,
          'updateUserRefreshTokenError',
          HttpStatusCode.InternalServerError,
          'Failed to update user'
        );
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Deletes all users.
   * @returns {Promise<void>} A promise that resolves when all users are deleted.
   */
  public async deleteAllUsers() {
    try {
      await this.usersDao.deleteAllUsers();
    } catch (error: any) {
      throw error;
    }
  }
}

export { UsersService };
