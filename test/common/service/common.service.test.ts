import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import mongoose from 'mongoose';
import { CommonService } from '../../../src/common/service/common.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';

describe('CommonService', () => {
  let CommonService: CommonService;
  let mongooseService: MongooseService;
  let schema;
  let mongooseStub;

  beforeEach(() => {
    mongooseService = new MongooseService();
    CommonService = new CommonService(mongooseService);
    mongooseStub = sinon.stub(mongooseService, 'getMongoose');
    schema = new mongoose.Schema({ name: String });
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should return existing model', () => {
    const model = mongoose.model('Test', schema);
    mongooseStub.returns({ model: sinon.stub().returns(model) });

    const result = CommonService.getOrCreateModel(schema, 'Test');
    expect(result).to.equal(model);
  });

  it('should create new model', () => {
    const model = mongoose.model('NewTest', schema);
    mongooseStub.returns({
      model: sinon.stub().throws().onSecondCall().returns(model),
    });

    const result = CommonService.getOrCreateModel(schema, 'NewTest');
    expect(result).to.equal(model);
  });
});
