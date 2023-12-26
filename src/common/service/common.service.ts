import { Schema } from 'mongoose';
import mongooseService, { MongooseService } from '../service/mongoose.service';

import debug from 'debug';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:common-service');

@injectable()
class CommonService {
  constructor(
    @inject(TYPES.MongooseService) private mongooseService: MongooseService
  ) {
    log('Created new instance of CommonService');
  }

  /**
   * Returns a Mongoose model for the given schema and model name. If the model doesn't exist, it will be created.
   * @param schema The Mongoose schema for the model.
   * @param modelName The name of the Mongoose model.
   * @returns The Mongoose model.
   */
  public getOrCreateModel(schema: Schema, modelName: string) {
    let model;
    try {
      model = this.mongooseService.getMongoose().model(modelName);
    } catch (error) {
      model = this.mongooseService.getMongoose().model(modelName, schema);
    }
    return model;
  }
}

export { CommonService };
