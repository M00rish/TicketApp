import debug from 'debug';
import { injectable } from 'inversify';
import mongoose from 'mongoose';

const log: debug.IDebugger = debug('app:mongoose-service');

class MongooseService {
  private count = 0;
  public DB_URI: string = '';

  constructor() {
    this.connectWithRetry();
    log('Created new instance of MongooseService');
  }

  /**
   * Retrieves the Mongoose instance.
   * @returns The Mongoose instance.
   */
  public getMongoose() {
    return mongoose;
  }

  /**
   * Attempts to connect to MongoDB and retries if needed.
   * @returns {Promise<void>} A promise that resolves when the connection is successful.
   */
  public connectWithRetry = async () => {
    log('Attempting MongoDB connection (will retry if needed)');

    typeof global.it === 'function'
      ? (this.DB_URI = process.env.MONGO_TEST_URI)
      : (this.DB_URI = process.env.MONGO_URI);

    await mongoose
      .connect(this.DB_URI)
      .then(() => {
        log('MongoDB is connected');
      })
      .catch((error) => {
        const retrySecond = 5;
        log(
          `MongoDB connection unsuccessful (will retry #${++this
            .count} after ${retrySecond} seconds):`,
          error
        );
        setTimeout(this.connectWithRetry, retrySecond * 1000);
      });
  };

  /**
   * Inserts test users into the database.
   * @param {any[]} users - The array of test users to insert.
   * @throws {Error} If an error occurs while inserting the test users.
   */
  public async insertTestUsers(users: any[]) {
    try {
      const User = mongoose.model('User');
      await User.insertMany(users);
    } catch (error) {
      throw error;
    }
  }
  // TODO: unit test is needed
  public async insertTestData(ModelName: string, data: any[]) {
    try {
      const Model = mongoose.model(ModelName);
      await Model.insertMany(data);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes all test data from the specified model.
   * @param {string} ModelName - The name of the model to delete test data from.
   * @throws {Error} If an error occurs while deleting the test data.
   */
  public async deleteTestData(ModelName: string) {
    try {
      const Model = mongoose.model(ModelName);
      await Model.deleteMany({});
    } catch (error) {
      throw error;
    }
  }
}

export { MongooseService };
