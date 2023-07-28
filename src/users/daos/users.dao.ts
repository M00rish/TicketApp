import shortid from 'shortid';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import mongooseService from '../../common/service/mongoose.service';

const log: debug.IDebugger = debug('app:users-dao');

class UsersDao {
  constructor() {
    log('created new instance of UsersDao');
  }

  async addUser(userFields: CreateUserDto) {
    const userId = shortid.generate();
    const user = new this.User({
      _id: userId,
      ...userFields,
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

    return existingUser?._id;
  }

  async getUserByEmail(email: string) {
    return await this.User.findOne({ email: email }).exec();
  }

  async getUserById(userId: string) {
    return await this.User.findOne({ _id: userId })
      .select('-refreshToken -password')
      .exec();
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

  async getUserByEmailWithPassword(email: string) {
    const user = await this.User.findOne({ email: email })
      .select('_id email permissionFlags +password')
      .exec();
    return user;
  }

  async getUserRefreshTokenById(userId: string) {
    const refreshToken = await this.User.findOne({ _id: userId })
      .select('refreshToken')
      .exec();
    return refreshToken;
  }

  async updateUserRefreshTokenById(userId: string, refreshToken: string) {
    await this.User.findOneAndUpdate(
      { _id: userId },
      { refreshToken },
      { new: true }
    ).exec();
  }

  schema = mongooseService.getMongoose().Schema;

  userSchema = new this.schema(
    {
      _id: String,
      email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
      },
      password: { type: String, select: false },
      firstName: { type: String, required: [true, 'First name is required'] },
      lastName: { type: String, required: [true, 'Last name is required'] },
      image: { type: String, default: 'default.jpg' },
      permissionFlags: { type: Number, enum: [1, 2, 4], default: 1 },
      refreshToken: { type: String, select: false },
    },
    { id: false }
  ).pre('save', async function (next) {
    const user = this as any;
    if (!this.isModified('password')) {
      return next();
    }
    user.password = await bcrypt.hashSync(user.password, 10);
    next();
  });

  User = mongooseService.getMongoose().model('User', this.userSchema);
}

export default new UsersDao();
