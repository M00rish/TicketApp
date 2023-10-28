import debug from 'debug';
import mongoose from 'mongoose';

const log: debug.IDebugger = debug('app:mongoose-service');

class MongooseService {
  private count = 0;
  public DB_URI: string = '';

  constructor() {
    this.connectWithRetry();
  }

  getMongoose() {
    return mongoose;
  }

  connectWithRetry = async () => {
    log('Attempting MongoDB connection (will retry if needed)');

    typeof global.it === 'function'
      ? (this.DB_URI = `mongodb://localhost:27018/test-db`)
      : (this.DB_URI = `mongodb://localhost:27017/api-db`);

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
}

export default new MongooseService();
