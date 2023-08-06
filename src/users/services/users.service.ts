import UsersDao from '../daos/users.dao';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import { CreateUserDto } from '../dtos/create.user.dto';
import { CRUD } from '../../common/interfaces/crud.interface';

class UserService implements CRUD {
  async create(resource: CreateUserDto) {
    return await UsersDao.addUser(resource);
  }

  async deleteById(id: string) {
    return await UsersDao.removeUserById(id);
  }

  async list(limit: number, page: number) {
    return await UsersDao.getUsers(limit, page);
  }

  async patchById(id: string, resource: PatchUserDto) {
    return await UsersDao.updateUserById(id, resource);
  }

  async readById(id: string) {
    return await UsersDao.getUserById(id);
  }

  async getUserByEmail(email: string) {
    return await UsersDao.getUserByEmail(email);
  }

  async getUserByEmailWithPassword(email: string) {
    return await UsersDao.getUserByEmailWithPassword(email);
  }

  async getUserRefeshTokenById(id: string) {
    return await UsersDao.getUserRefreshTokenById(id);
  }

  async updateUserRefreshTokenById(id: string, refreshToken: string) {
    await UsersDao.updateUserRefreshTokenById(id, refreshToken);
  }
}

export default new UserService();
