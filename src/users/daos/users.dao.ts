import shortid from 'shortid';
import debug from 'debug';

import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';

const log: debug.IDebugger = debug('app:in-memory-dao');

class UsersDao {
  users: Array<CreateUserDto> = [];

  constructor() {
    log('created new instance of UsersDao');
  }

  async addUser(user: CreateUserDto) {
    user.id = shortid.generate();
    this.users.push(user);
    return user.id;
  }

  async getUsers() {
    return this.users;
  }

  async getUserById(userId: string) {
    return this.users.find((user: { id: string }) => {
      user.id === userId;
    });
  }

  async putUserById(userId: string, user: PutUserDto) {
    const userIndex = this.users.findIndex((user: { id: string }) => {
      user.id === userId;
    });

    this.users.splice(userIndex, 1, user);
    return `User ${user.id} updated via put`;
  }

  async patchUserById(userId: string, user: PatchUserDto) {
    const userIndex = this.users.findIndex((user: { id: string }) => {
      user.id === userId;
    });

    let currentUser = this.users[userIndex];

    const allowedPatchedFields = [
      'password',
      'firstName',
      'lastName',
      'permissionLevel',
    ];

    for (let field in allowedPatchedFields) {
      if (field in user) {
        // @ts-ignore
        currentUser[field] = user[field];
      }
    }

    this.users.splice(userIndex, 1, currentUser);
    return `user ${user.id} patched`;
  }

  async removeUserById(userId: string) {
    const userIndex = this.users.findIndex((user: { id: string }) => {
      user.id = userId;
    });

    this.users.splice(userIndex, 1);
    return `user ${userIndex} is deleted`;
  }

  async getUserByEmail(email: string) {
    const userIndex = this.users.findIndex((user: { email: string }) => {
      user.email = email;
    });

    let currentUser = this.users[userIndex];

    if (currentUser) {
      return currentUser;
    } else {
      return null;
    }
  }
}

export default new UsersDao();
