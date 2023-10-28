import debug from 'debug';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import { CreateUserDto } from '../dtos/create.user.dto';
import { CRUD } from '../../common/interfaces/crud.interface';
import usersDao from '../daos/users.dao';

const log: debug.IDebugger = debug('app:users-service');

class UserService implements CRUD {
  constructor(private usersDao: any) {
    log('Created new instance of UserService');
  }

  async create(resource: CreateUserDto) {
    return await this.usersDao.createUser(resource);
  }

  async deleteById(id: string) {
    return await this.usersDao.deleteUserById(id);
  }

  async list(limit: number, page: number) {
    return await this.usersDao.listUsers(limit, page);
  }

  async updateById(id: string, resource: PatchUserDto) {
    return await this.usersDao.updateUserById(id, resource);
  }

  async getById(id: string) {
    return await this.usersDao.getUserById(id);
  }

  async getUserByEmail(email: string) {
    return await this.usersDao.getUserByEmail(email);
  }

  async getUserByEmailWithPassword(email: string) {
    return await this.usersDao.getUserByEmailWithPassword(email);
  }

  async getUserRefeshTokenById(id: string) {
    return await this.usersDao.getUserRefreshTokenById(id);
  }

  async updateUserRefreshTokenById(id: string, refreshToken: string) {
    await this.usersDao.updateUserRefreshTokenById(id, refreshToken);
  }
}

export default new UserService(usersDao);
