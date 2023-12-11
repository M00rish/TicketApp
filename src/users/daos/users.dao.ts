import shortid from 'shortid';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import { CreateUserDto } from '../dtos/create.user.dto';
import { PutUserDto } from '../dtos/put.user.dto';
import { PatchUserDto } from '../dtos/patch.user.dto';
import mongooseService, {
  MongooseService,
} from '../../common/service/mongoose.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import commonService, {
  CommonService,
} from '../../common/service/common.service';

const log: debug.IDebugger = debug('app:in-memory-dao');

class UsersDao {
  constructor(private commonService: CommonService) {
    log('created new instance of UsersDao');
    this.User = this.commonService.getOrCreateModel(this.userSchema, 'User');
  }

  /**
   * Creates a new user in the database.
   * @param {CreateUserDto} userFields - The fields of the user to be created.
   * @returns The ID of the newly created user.
   * @throws An error If there was an error creating the user.
   */
  async createUser(userFields: CreateUserDto): Promise<string> {
    try {
      const userId = shortid.generate();
      const user = new this.User({
        _id: userId,
        ...userFields,
      });

      await user.save();
      return userId;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Updates a user by their ID.
   * @param {string} userId - The ID of the user to update.
   * @param {(PatchUserDto | PutUserDto)} userFields - The fields to update on the user.
   * @returns {Promise<string>} - A promise that resolves with the ID of the updated user.
   * @throws An Error if the user is not found or if the update fails.
   */
  async updateUserById(
    userId: string,
    userFields: PatchUserDto | PutUserDto
  ): Promise<string> {
    try {
      const user = await this.User.findById({ _id: userId }).exec();
      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      const updatedUser = await this.User.findOneAndUpdate(
        { _id: userId },
        { $set: userFields },
        { new: true }
      ).exec();

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
   * Retrieves a user from the database by their email address.
   * @param email The email address of the user to retrieve.
   * @returns A Promise that resolves to the retrieved user.
   * @throws An AppError if the user is not found.
   */
  async getUserByEmail(email: string): Promise<any> {
    try {
      const user = await this.User.findOne({ email: email }).exec();

      if (!user)
        throw new AppError(
          false,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a user by their ID.
   * @param {string} userId - The ID of the user to retrieve.
   * @returns {Promise<User>} A promise that resolves with the retrieved user.
   * @throws An AppError If the user is not found.
   */
  async getUserById(userId: string): Promise<any> {
    try {
      const user = await this.User.findOne({ _id: userId })
        .select('-refreshToken -password')
        .exec();

      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      return user;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Retrieves a list of users from the database.
   * @param limit - The maximum number of users to retrieve (default: 25).
   * @param page - The page number of results to retrieve (default: 0).
   * @returns A Promise that resolves to an array of User objects.
   * @throws An error if there was a problem retrieving the users.
   */
  async listUsers(limit = 25, page = 0): Promise<any> {
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

  /**
   * Deletes a user by their ID.
   * @param {string} userId - The ID of the user to delete.
   * @throws An AppError If the user is not found or if there is an error deleting the user.
   */
  async deleteUserById(userId: string): Promise<any> {
    try {
      const user = await this.User.findById({ _id: userId }).exec();

      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      const deletedDoc = await this.User.deleteOne({ _id: userId }).exec();
      if (deletedDoc.deletedCount === 0)
        throw new AppError(
          false,
          'deleteUserError',
          HttpStatusCode.InternalServerError,
          'Failed to delete user'
        );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a user by their email address along with their password.
   * @param email The email address of the user to retrieve.
   * @returns A Promise that resolves to the user object if found, or throws an error if not found.
   */
  async getUserByEmailWithPassword(email: string) {
    try {
      const user = await this.User.findOne({ email: email })
        .select('_id email permissionFlags +password')
        .exec();
      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      return user;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates the refresh token of a user with the given ID.
   * @param {string} userId - The ID of the user to update.
   * @param {string} refreshToken - The new refresh token to set for the user.
   * @throws An AppError If the user is not found or if the update fails.

   */
  async updateUserRefreshTokenById(userId: string, refreshToken: string) {
    try {
      const user = await this.User.findById({ _id: userId }).exec();

      if (!user)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'User not found'
        );

      const updatedUser = await this.User.findOneAndUpdate(
        { _id: userId },
        { refreshToken },
        { new: true }
      ).exec();

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
   * Deletes all users from the database.
   * @returns {Promise<void>} A promise that resolves when the operation is complete.
   */
  async deleteAllUsers(): Promise<void> {
    try {
      await this.User.deleteMany({}).exec();
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Mongoose schema for the User model.
   */
  schema = mongooseService.getMongoose().Schema;

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

  User = this.commonService.getOrCreateModel(this.userSchema, 'User');
}

export default new UsersDao(commonService);
export { UsersDao };
