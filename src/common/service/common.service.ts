import { Schema } from 'mongoose';
import mongooseService from '../service/mongoose.service';

import debug from 'debug';

const log: debug.IDebugger = debug('app:common-service');

class commonService {
  constructor() {
    log('created new instance of commonService');
  }

  /**
   * Returns a Mongoose model for the given schema and model name. If the model doesn't exist, it will be created.
   * @param schema The Mongoose schema for the model.
   * @param modelName The name of the Mongoose model.
   * @returns The Mongoose model.
   */
  getOrCreateModel(schema: Schema, modelName: string) {
    let model;
    try {
      model = mongooseService.getMongoose().model(modelName); // This will throw an error if the model doesn't exist
    } catch (error) {
      model = mongooseService.getMongoose().model(modelName, schema); // This will create the model
    }
    return model;
  }
}

export default new commonService();
