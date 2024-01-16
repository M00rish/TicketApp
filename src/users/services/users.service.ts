import debug from 'debug';
import { PatchUserDto } from '../dtos/patch.user.dto';
import { CreateUserDto } from '../dtos/create.user.dto';
import { CRUD } from '../../common/interfaces/crud.interface';
import usersDao, { UsersDao } from '../daos/users.dao';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:Users-Service');

class UsersService implements CRUD {
  /**
   * Creates a new instance of the UsersService.
   * @param usersDao - The users data access object.
   */
  constructor(private usersDao: UsersDao) {
    log('Created new instance of UsersService');
  }

  /**
   * Creates a new user.
   * @param resource The user data to create.
   * @returns The created user.
   */
  public async create(resource: CreateUserDto) {
    return await this.usersDao.createUser(resource);
  }

  /**
   * Retrieves a user by their ID.
   * @param id - The ID of the user.
   * @returns A Promise that resolves to the user object.
   */
  public async getById(id: string) {
    return await this.usersDao.getUserById(id);
  }

  /**
   * Deletes a user by their ID.
   * @param id The ID of the user to delete.
   * @returns A promise that resolves when the user is deleted.
   */
  public async deleteById(id: string) {
    return await this.usersDao.deleteUserById(id);
  }

  /**
   * Retrieves a list of users.
   * @param limit The maximum number of users to retrieve.
   * @param page The page number of the results.
   * @returns A promise that resolves to the list of users.
   */
  public async list(limit: number, page: number) {
    return await this.usersDao.listUsers(limit, page);
  }

  /**
   * Updates a user by their ID.
   * @param id - The ID of the user to update.
   * @param resource - The updated user data.
   * @returns A Promise that resolves to the updated user.
   */
  public async updateById(id: string, resource: PatchUserDto) {
    return await this.usersDao.updateUserById(id, resource);
  }

  /**
   * Retrieves a user by their email address.
   * @param email - The email address of the user.
   * @returns A Promise that resolves to the user object.
   */
  public async getUserByEmail(email: string) {
    return await this.usersDao.getUserByEmail(email);
  }

  /**
   * Retrieves a user by their email along with their password.
   * @param email - The email of the user.
   * @returns A promise that resolves to the user with the specified email and password.
   */
  public async getUserByEmailWithPassword(email: string) {
    return await this.usersDao.getUserByEmailWithPassword(email);
  }

  /**
   * Updates the refresh token of a user by their ID.
   * @param id - The ID of the user.
   * @param refreshToken - The new refresh token.
   */
  public async updateUserRefreshTokenById(id: string, refreshToken: string) {
    return await this.usersDao.updateUserRefreshTokenById(id, refreshToken);
  }

  /**
   * Deletes all users.
   * @returns {Promise<void>} A promise that resolves when all users are deleted.
   */
  public async deleteAllUsers() {
    return await this.usersDao.deleteAllUsers();
  }
}

export { UsersService };
export default new UsersService(usersDao);
