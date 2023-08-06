import shortid from 'shortid';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import mongooseService from '../../common/service/mongoose.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:users-dao');

class UsersDao {
  constructor() {
    log('created new instance of UsersDao');
  }

  async addUser(userFields: CreateUserDto) {
    try {
      const userId = shortid.generate();
      const user = new this.User({
        _id: userId,
        ...userFields,
      });

      await user.save();
      return userId;
    } catch (error) {
      throw error;
    }
  }

  async updateUserById(userId: string, userFields: PatchUserDto | PutUserDto) {
    try {
      const user = await this.User.findById({ _id: userId }).exec();
      if (!user)
        throw new AppError(true, 'updateUserById_Error', 404, 'User not found');

      const updatedUser = await this.User.findOneAndUpdate(
        { _id: userId },
        { $set: userFields },
        { new: true }
      ).exec();

      if (!updatedUser)
        throw new AppError(
          true,
          'updateUserById_Error',
          HttpStatusCode.InternalServerError,
          'Failed to update user'
        );

      return updatedUser._id;
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmail(email: string) {
    try {
      const user = await this.User.findOne({ email: email }).exec();
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      const user = await this.User.findOne({ _id: userId })
        .select('-refreshToken -password')
        .exec();
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUsers(limit = 25, page = 0) {
    try {
      const users = await this.User.find()
        .limit(limit)
        .skip(limit * page)
        .exec();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async removeUserById(userId: string) {
    try {
      const user = await this.User.deleteOne({ _id: userId }).exec();
      if (user.deletedCount === 0)
        throw new AppError(
          true,
          'removeUserById_Error',
          404,
          'User not found '
        );
    } catch (error) {
      throw error;
    }
  }

  async getUserByEmailWithPassword(email: string) {
    try {
      const user = await this.User.findOne({ email: email })
        .select('_id email permissionFlags +password')
        .exec();
      if (!user)
        throw new AppError(
          true,
          'getUserByEmailWithPassword_Error',
          404,
          'User not found'
        );
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserRefreshTokenById(userId: string) {
    try {
      const refreshToken = await this.User.findOne({ _id: userId })
        .select('refreshToken')
        .exec();
      if (!refreshToken)
        throw new AppError(
          true,
          'getUserRefreshTokenById_Error',
          404,
          'User not found'
        );

      return refreshToken;
    } catch (error) {
      throw error;
    }
  }

  async updateUserRefreshTokenById(userId: string, refreshToken: string) {
    try {
      const user = await this.User.findById({ _id: userId }).exec();
      if (!user)
        throw new AppError(
          true,
          'updateUserRefreshTokenById_Error',
          404,
          'User not found'
        );

      const updatedUser = await this.User.findOneAndUpdate(
        { _id: userId },
        { refreshToken },
        { new: true }
      ).exec();

      if (!updatedUser)
        throw new AppError(
          true,
          'updateUserRefreshTokenById_Error',
          HttpStatusCode.InternalServerError,
          'Failed to update user'
        );
    } catch (error) {
      throw error;
    }
  }

  schema = mongooseService.getMongoose().Schema;

  userSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
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
