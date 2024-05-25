import shortid from 'shortid';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { CommonService } from '../../common/service/common.service';
import { injectable, inject } from 'inversify';
import { TYPES } from '../../ioc/types';
import { MongooseService } from '../../common/service/mongoose.service';

const log: debug.IDebugger = debug('app:in-memory-dao');

class UsersDao {
  constructor(private commonService: CommonService) {
    this.User = this.commonService.getOrCreateModel('User', this.userSchema);

    log('Created new instance of UsersDao');
  }

  /**
   * Creates a new user in the database.
   * @param {CreateUserDto} userFields - The fields of the user to be created.
   * @returns The ID of the newly created user.
   * @throws An error If there was an error creating the user.
   */
  async createUser(userFields: CreateUserDto) {
    const userId = shortid.generate();
    const user = new this.User({
      _id: userId,
      ...userFields,
    });

    await user.save();
    return userId;
  }

  /**
   * Retrieves a list of users from the database.
   * @param limit - The maximum number of users to retrieve (default: 25).
   * @param page - The page number of results to retrieve (default: 0).
   * @returns A Promise that resolves to an array of User objects.
   * @throws An error if there was a problem retrieving the users.
   */
  async list(limit = 25, page = 0) {
    return await this.User.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  /**
   * Retrieves a user by their ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<User>} A promise that resolves with the retrieved user.
   * @throws An AppError If the user is not found.
   */
  async getById(userId: string) {
    return await this.User.findOne({ _id: userId })
      .select('-refreshToken -password')
      .exec();
  }

  /**
   * Updates a user by their ID.
   * @param {string} userId - The ID of the user to update.
   * @param {(PatchUserDto | PutUserDto)} userFields - The fields to update on the user.
   * @returns {Promise<string>} - A promise that resolves with the ID of the updated user.
   * @throws An Error if the user is not found or if the update fails.
   */
  async updateById(userId: string, userFields: PatchUserDto | PutUserDto) {
    return await this.User.findOneAndUpdate(
      { _id: userId },
      { $set: userFields },
      { new: true }
    ).exec();
  }

  /**
   * Deletes a user by their ID.
   * @param {string} userId - The ID of the user to delete.
   * @throws An AppError If the user is not found or if there is an error deleting the user.
   */
  async deleteById(userId: string) {
    return await this.User.deleteOne({ _id: userId }).exec();
  }

  /**
   * Retrieves a user from the database by their email address.
   * @param email The email address of the user to retrieve.
   * @returns A Promise that resolves to the retrieved user.
   * @throws An AppError if the user is not found.
   */
  async getUserByEmail(email: string) {
    return await this.User.findOne({ email: email }).exec();
  }

  /**
   * Retrieves a user by their email address along with their password.
   * @param email The email address of the user to retrieve.
   * @returns A Promise that resolves to the user object if found, or throws an error if not found.
   */
  async getUserByEmailWithPassword(email: string) {
    return await this.User.findOne({ email: email })
      .select('_id email permissionFlags +password')
      .exec();
  }

  /**
   * Updates the refresh token of a user with the given ID.
   * @param {string} userId - The ID of the user to update.
   * @param {string} refreshToken - The new refresh token to set for the user.
   * @throws An AppError If the user is not found or if the update fails.

   */
  async updateUserRefreshTokenById(userId: string, refreshToken: string) {
    return await this.User.findOneAndUpdate(
      { _id: userId },
      { refreshToken },
      { new: true }
    ).exec();
  }

  /**
   * Deletes all users from the database.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async deleteAllUsers(): Promise<void> {
    await this.User.deleteMany({}).exec();
  }

  /**
   * Mongoose schema for the User model.
   */
  schema = this.commonService.getMongoose().Schema;

  /**
   * Mongoose schema for the User model.
   * @property {string} _id - The user ID.
   * @property {string} email - The user email.
   * @property {string} password - The user password.
   * @property {string} firstName - The user first name.
   * @property {string} lastName - The user last name.
   * @property {string} image - The user image.
   * @property {number} permissionFlags - The user permission flags.
   * @property {string} refreshToken - The user refresh token.
   */
  userSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      email: {
        type: String,
        unique: true,
        required: [true, 'Email is required'],
      },
      password: {
        type: String,
        select: false,
        required: [true, 'Password is required'],
      },
      firstName: { type: String, required: [true, 'First name is required'] },
      lastName: { type: String, required: [true, 'Last name is required'] },
      image: { type: String, default: 'default.jpg' },
      permissionFlags: { type: Number, default: 1 },
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

  User = this.commonService.getOrCreateModel('User', this.userSchema);
}

export { UsersDao };
