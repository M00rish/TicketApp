import debug from 'debug';
import mongoose from 'mongoose';

const log: debug.IDebugger = debug('app:mongoose-service');

class MongooseService {
  private count = 0;
  private mongooseOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    useFindAndModify: false,
    strictQuery: false,
  };

  constructor() {
    this.connectWithRetry();
  }

  getMongoose() {
    return mongoose;
  }

  connectWithRetry = async (
    DB_URI: string = `mongodb://localhost:27017/api-db`
  ) => {
    log('Attempting MongoDB connection (will retry if needed)');

    await mongoose
      .connect(DB_URI)
      .then(() => {
        log('MongoDB is connected');
      })
      .catch((err) => {
        const retrySecond = 5;
        log(
          `MongoDB connection unsuccessful (will retry #${++this
            .count} after ${retrySecond} seconds):`,
          err
        );
        setTimeout(this.connectWithRetry, retrySecond * 1000);
      });
  };
}

export default new MongooseService();
