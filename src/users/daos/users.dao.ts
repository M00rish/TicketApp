import shortid from 'shortid';
import debug from 'debug';

import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import mongooseService from '../../common/service/mongoose.service';

const log: debug.IDebugger = debug('app:in-memory-dao');

class UsersDao {
  constructor() {
    log('created new instance of UsersDao');
  }

  async addUser(userFields: CreateUserDto) {
    const userId = shortid.generate();
    const user = new this.User({
      _id: userId,
      ...userFields,
      permissionFlags: 1,
    });

    await user.save();
    return userId;
  }

  async updateUserById(userId: string, userFields: PatchUserDto | PutUserDto) {
    const existingUser = await this.User.findOneAndUpdate(
      { _id: userId },
      { $set: userFields },
      { new: true }
    ).exec();

    return existingUser;
  }

  async getUserByEmail(email: string) {
    return await this.User.findOne({ email: email }).exec();
  }

  async getUserById(userId: string) {
    return await this.User.findOne({ _id: userId }).exec();
  }

  async getUsers(limit = 25, page = 0) {
    return await this.User.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  async removeUserById(userId: string) {
    return await this.User.deleteOne({ _id: userId }).exec();
  }

  schema = mongooseService.getMongoose().Schema;

  userSchema = new this.schema(
    {
      _id: String,
      email: String,
      password: { type: String, select: false },
      firstName: String,
      lastName: String,
      permessionFlags: Number,
    },
    { id: false }
  );

  User = mongooseService.getMongoose().model('User', this.userSchema);
}

export default new UsersDao();
