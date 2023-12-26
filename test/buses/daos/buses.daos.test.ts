import 'mocha';
import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';
import shortid from 'shortid';

import { CreateBusDto } from '../../../src/buses/dtos/create.bus.dto';
import { BusesDao } from '../../../src/buses/daos/buses.dao';
import { CommonService } from '../../../src/common/service/common.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import AppError from '../../../src/common/types/appError';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';
import { PatchBusDto } from '../../../src/buses/dtos/patch.bus.dto';

describe('BusesDao', () => {
  describe('addBus', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let saveBusStub: SinonStub;
    let generateIdStub: sinon.SinonStub;

    beforeEach(() => {
      saveBusStub = sinon.stub(busesDao.Bus.prototype, 'save');
      generateIdStub = sinon.stub(shortid, 'generate');
    });

    afterEach(() => {
      saveBusStub.restore();
      generateIdStub.restore();
    });

    it('should add a bus and return its id', async () => {
      const busFields: CreateBusDto = {
        busModel: '12XY',
        seats: 90,
      };

      await busesDao.addBus(busFields);

      expect(saveBusStub.calledOnce).to.be.true;
      expect(generateIdStub.calledOnce).to.be.true;
    });

    it('should throw an error if saving the bus fails', async () => {
      const busFields: CreateBusDto = {
        busModel: '12XY',
        seats: 90,
      };

      const error = new Error('Failed to save bus');

      saveBusStub.throws(error);

      try {
        await busesDao.addBus(busFields);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(saveBusStub.calledOnce).to.be.true;
      expect(generateIdStub.calledOnce).to.be.true;
    });
  });

  describe('getBusById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let findByIdStub: SinonStub;

    beforeEach(() => {
      findByIdStub = sinon.stub(busesDao.Bus, 'findById');
    });

    afterEach(() => {
      findByIdStub.restore();
    });

    it('should return a bus if it exists', async () => {
      const busId = '123';
      const bus = { _id: busId, busModel: '12XY', seats: 90 };

      findByIdStub.returns({
        exec: sinon.stub().resolves(bus),
      });

      const result = await busesDao.getBusById(busId);

      expect(result).to.eql(bus);
      expect(findByIdStub.calledWith(busId)).to.be.true;
    });

    it('should throw an error if the bus does not exist', async () => {
      const busId = '123';
      findByIdStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await busesDao.getBusById(busId);
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('getBusById_Error');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Bus not found');
      }

      expect(findByIdStub.calledWith(busId)).to.be.true;
    });

    it('should propagate the error if the database operation fails', async () => {
      const busId = '123';
      const error = new Error('Database error');
      findByIdStub.returns({
        exec: sinon.stub().rejects(error),
      });

      try {
        await busesDao.getBusById(busId);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(findByIdStub.calledWith(busId)).to.be.true;
    });
  });

  describe('getBuses', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let findStub: SinonStub;

    beforeEach(() => {
      findStub = sinon.stub(busesDao.Bus, 'find');
    });

    afterEach(() => {
      findStub.restore();
    });

    it('should return all buses', async () => {
      const buses = [
        { _id: '123', busModel: '12XY', seats: 90 },
        { _id: '456', busModel: '34YZ', seats: 60 },
      ];
      findStub.returns({
        exec: sinon.stub().resolves(buses),
      });

      const result = await busesDao.getBuses();

      expect(result).to.eql(buses);
      expect(findStub.calledOnce).to.be.true;
    });

    it('should propagate the error if the database operation fails', async () => {
      const error = new Error('Database error');
      findStub.returns({
        exec: sinon.stub().rejects(error),
      });

      try {
        await busesDao.getBuses();
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(findStub.calledOnce).to.be.true;
    });
  });

  describe('updateBusById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let findByIdStub: SinonStub;
    let saveStub: SinonStub;

    beforeEach(() => {
      findByIdStub = sinon.stub(busesDao.Bus, 'findById');
      saveStub = sinon.stub(busesDao.Bus.prototype, 'save');
    });

    afterEach(() => {
      findByIdStub.restore();
      saveStub.restore();
    });

    it('should update a bus and return its id', async () => {
      const busId = '123';
      const busFields: PatchBusDto = {
        busModel: '34YZ',
        seats: 60,
      };
      const bus = { _id: busId, set: sinon.stub(), save: saveStub };
      findByIdStub.returns({
        exec: sinon.stub().resolves(bus),
      });

      const result = await busesDao.updateBusById(busId, busFields);

      expect(result).to.equal(busId);
      expect(bus.set.calledWith(busFields)).to.be.true;
      expect(saveStub.calledOnce).to.be.true;
      expect(findByIdStub.calledWith(busId)).to.be.true;
    });

    it('should throw an error if the bus does not exist', async () => {
      const busId = '123';
      const busFields: PatchBusDto = {
        busModel: '34YZ',
        seats: 60,
      };
      findByIdStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await busesDao.updateBusById(busId, busFields);
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('updateBusById_Error');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Bus not found');
      }

      expect(findByIdStub.calledWith(busId)).to.be.true;
    });

    it('should propagate the error if the database operation fails', async () => {
      const busId = '123';
      const busFields: PatchBusDto = {
        busModel: '34YZ',
        seats: 60,
      };
      const error = new Error('Database error');
      findByIdStub.returns({
        exec: sinon.stub().rejects(error),
      });

      try {
        await busesDao.updateBusById(busId, busFields);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(findByIdStub.calledWith(busId)).to.be.true;
    });
  });

  describe('removeBusById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let findByIdStub: SinonStub;
    let removeStub: SinonStub;

    beforeEach(() => {
      findByIdStub = sinon.stub(busesDao.Bus, 'findById');
      removeStub = sinon.stub(busesDao.Bus.prototype, 'remove');
    });

    afterEach(() => {
      findByIdStub.restore();
      removeStub.restore();
    });

    it('should remove a bus and return its id', async () => {
      const busId = '123';
      const bus = { _id: busId, remove: removeStub };
      findByIdStub.returns({
        exec: sinon.stub().resolves(bus),
      });

      const result = await busesDao.removeBusById(busId);

      expect(result).to.equal(busId);
      expect(removeStub.calledOnce).to.be.true;
      expect(findByIdStub.calledWith(busId)).to.be.true;
    });

    it('should throw an error if the bus does not exist', async () => {
      const busId = '123';
      findByIdStub.returns({
        exec: sinon.stub().resolves(null),
      });

      try {
        await busesDao.removeBusById(busId);
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('removeBusById_Error');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Bus not found');
      }

      expect(findByIdStub.calledWith(busId)).to.be.true;
    });

    it('should propagate the error if the database operation fails', async () => {
      const busId = '123';
      const error = new Error('Database error');
      findByIdStub.returns({
        exec: sinon.stub().rejects(error),
      });

      try {
        await busesDao.removeBusById(busId);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(findByIdStub.calledWith(busId)).to.be.true;
    });
  });

  describe('validateBusExists', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let existsStub: SinonStub;

    beforeEach(() => {
      existsStub = sinon.stub(busesDao.Bus, 'exists');
    });

    afterEach(() => {
      existsStub.restore();
    });

    it('should return true if the bus exists', async () => {
      const busId = '123';
      existsStub.resolves(true);

      const result = await busesDao.validateBusExists(busId);

      expect(result).to.be.true;
      expect(existsStub.calledWith({ _id: busId })).to.be.true;
    });

    it('should return false if the bus does not exist', async () => {
      const busId = '123';
      existsStub.resolves(false);

      const result = await busesDao.validateBusExists(busId);

      expect(result).to.be.false;
      expect(existsStub.calledWith({ _id: busId })).to.be.true;
    });

    it('should propagate the error if the database operation fails', async () => {
      const busId = '123';
      const error = new Error('Database error');
      existsStub.rejects(error);

      try {
        await busesDao.validateBusExists(busId);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(existsStub.calledWith({ _id: busId })).to.be.true;
    });
  });
});
