import 'mocha';
import { expect } from 'chai';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import mongoose, { Schema, Document } from 'mongoose';
import sinon from 'sinon';
import debug from 'debug';

describe('MongooseService', () => {
  describe('connectWithRetry', () => {
    let mongooseService: MongooseService;
    let mongooseConnectStub: sinon.SinonStub;
    let logStub: sinon.SinonStub;
    let setTimeoutStub: sinon.SinonStub;

    beforeEach(() => {
      mongooseService = new MongooseService();
      mongooseConnectStub = sinon.stub(mongoose, 'connect');
      logStub = sinon.stub(mongooseService, 'log');
      setTimeoutStub = sinon.stub(global, 'setTimeout');
    });

    afterEach(() => {
      mongooseConnectStub.restore();
      logStub.restore();
      setTimeoutStub.restore();
    });

    it('should call mongoose.connect with the correct DB_URI', async () => {
      const DB_URI = `mongodb://localhost:27018/test-db`;
      mongooseConnectStub.resolves();

      await mongooseService.connectWithRetry();
      expect(mongooseConnectStub.calledWith(DB_URI)).to.be.true;
    });

    it('should log the correct message when the connection is successful', async () => {
      mongooseConnectStub.resolves();

      await mongooseService.connectWithRetry();
      expect(logStub.calledWith('MongoDB is connected')).to.be.true;
    });

    it('should log the correct message and retry the connection when the connection is unsuccessful', async () => {
      mongooseConnectStub
        .onFirstCall()
        .rejects(new Error('Test error'))
        .onSecondCall()
        .resolves();

      await mongooseService.connectWithRetry();
      expect(logStub.called).to.be.true;
      expect(setTimeoutStub.called).to.be.true;
    });
  });

  describe('insertTestUsers', () => {
    let User: any;
    let insertManyStub: sinon.SinonStub;
    let mongooseService: MongooseService;

    interface IUser extends Document {
      name: string;
    }

    const UserSchema: Schema = new Schema({
      name: { type: String, required: true },
    });

    User = mongoose.model<IUser>('User', UserSchema);

    beforeEach(() => {
      mongooseService = new MongooseService();
      insertManyStub = sinon.stub(User, 'insertMany');
    });

    afterEach(() => {
      insertManyStub.restore();
    });

    it('should call User.insertMany with the correct users', async () => {
      const users = [{ name: 'Test User 1' }, { name: 'Test User 2' }];

      insertManyStub.resolves();

      await mongooseService.insertTestUsers(users);
      expect(insertManyStub.calledWith(users)).to.be.true;
    });

    it('should throw an error when User.insertMany fails', async () => {
      const users = [{ name: 'Test User 1' }, { name: 'Test User 2' }];
      const testError = new Error('Test error');

      insertManyStub.rejects(testError);

      try {
        await mongooseService.insertTestUsers(users);
      } catch (error) {
        expect(error).to.equal(testError);
      }

      expect(insertManyStub.calledWith(users)).to.be.true;
    });
  });

  describe('deleteTestData', () => {
    let Model: any;
    let deleteManyStub: sinon.SinonStub;
    let mongooseModelStub: sinon.SinonStub;
    let mongooseService: MongooseService;

    beforeEach(() => {
      mongooseService = new MongooseService();
      Model = mongoose.model('User');
      deleteManyStub = sinon.stub(Model, 'deleteMany');
      mongooseModelStub = sinon.stub(mongoose, 'model');
    });

    afterEach(() => {
      deleteManyStub.restore();
      mongooseModelStub.restore();
    });

    it('should call Model.deleteMany', async () => {
      mongooseModelStub.returns(Model);
      deleteManyStub.resolves();

      await mongooseService.deleteTestData('User');
      expect(deleteManyStub.called).to.be.true;
    });

    it('should throw an error when Model.deleteMany fails', async () => {
      const testError = new Error('Test error');

      mongooseModelStub.returns(Model);
      deleteManyStub.rejects(testError);

      try {
        await mongooseService.deleteTestData('User');
      } catch (error) {
        expect(error).to.equal(testError);
      }

      expect(deleteManyStub.called).to.be.true;
    });
  });

  describe('getMongoose', () => {
    let mongooseService: MongooseService;

    beforeEach(() => {
      mongooseService = new MongooseService();
    });

    it('should return the mongoose instance', () => {
      const result = mongooseService.getMongoose();
      expect(result).to.equal(mongoose);
    });
  });
});
