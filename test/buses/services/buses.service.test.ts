import 'mocha';
import { expect } from 'chai';
import sinon, { SinonStub } from 'sinon';

import { BusesService } from '../../../src/buses/services/buses.service';
import { BusesDao } from '../../../src/buses/daos/buses.dao';
import { CommonService } from '../../../src/common/service/common.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';

describe('BusesService', () => {
  describe('addBus', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let addBusStub: SinonStub;

    beforeEach(() => {
      addBusStub = sinon.stub(busesDao, 'addBus');
    });

    afterEach(() => {
      addBusStub.restore();
    });

    it('should add a bus and return its id', async () => {
      const busFields = {
        busModel: '12XY',
        seats: 90,
      };

      addBusStub.resolves('123');

      const busId = await busesService.create(busFields);

      expect(addBusStub.calledOnce).to.be.true;
      expect(busId).to.eql('123');
    });

    it('should throw an error if saving the bus fails', async () => {
      const busFields = {
        busModel: '12XY',
        seats: 90,
      };

      const error = new Error('Failed to save bus');

      addBusStub.throws(error);

      try {
        await busesService.create(busFields);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(addBusStub.calledOnce).to.be.true;
    });
  });

  describe('deleteById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let removeBusByIdStub: SinonStub;

    beforeEach(() => {
      removeBusByIdStub = sinon.stub(busesDao, 'removeBusById');
    });

    afterEach(() => {
      removeBusByIdStub.restore();
    });

    it('should call removeBusById method of busesDao with correct parameters', async () => {
      const resourceId = '123';
      removeBusByIdStub.resolves(true);

      const result = await busesService.deleteById(resourceId);

      expect(removeBusByIdStub.calledOnceWithExactly(resourceId)).to.be.true;
    });

    it('should return the result of removeBusById method of busesDao', async () => {
      const resourceId = '123';
      const expectedResult = true;
      removeBusByIdStub.resolves(expectedResult);

      const result = await busesService.deleteById(resourceId);

      expect(result).to.equal(expectedResult);
    });

    it('should throw an error if removing the bus fails', async () => {
      const resourceId = '123';
      const error = new Error('Failed to remove bus');
      removeBusByIdStub.throws(error);

      try {
        await busesService.deleteById(resourceId);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(removeBusByIdStub.calledOnceWithExactly(resourceId)).to.be.true;
    });
  });

  describe('list', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let getBusesStub: SinonStub;

    beforeEach(() => {
      getBusesStub = sinon.stub(busesDao, 'getBuses');
    });

    afterEach(() => {
      getBusesStub.restore();
    });

    it('should call getBuses method of busesDao', async () => {
      getBusesStub.resolves([]);

      await busesService.list(10, 1);

      expect(getBusesStub.calledOnce).to.be.true;
    });

    it('should return the result of getBuses method of busesDao', async () => {
      const expectedResult = [{ id: '123', busModel: '12XY', seats: 90 }];
      getBusesStub.resolves(expectedResult);

      const result = await busesService.list(10, 1);

      expect(result).to.deep.equal(expectedResult);
    });

    it('should throw an error if getting the buses fails', async () => {
      const error = new Error('Failed to get buses');
      getBusesStub.throws(error);

      try {
        await busesService.list(10, 1);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(getBusesStub.calledOnce).to.be.true;
    });
  });

  describe('updateById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let updateBusByIdStub: SinonStub;

    beforeEach(() => {
      updateBusByIdStub = sinon.stub(busesDao, 'updateBusById');
    });

    afterEach(() => {
      updateBusByIdStub.restore();
    });

    it('should call updateBusById method of busesDao with correct parameters', async () => {
      const busId = '123';
      const resource = { busModel: '12XY', seats: 90 };
      updateBusByIdStub.resolves(resource);

      const result = await busesService.updateById(busId, resource);

      expect(updateBusByIdStub.calledOnceWithExactly(busId, resource)).to.be
        .true;
    });

    it('should return the result of updateBusById method of busesDao', async () => {
      const busId = '123';
      const resource = { busModel: '12XY', seats: 90 };
      const expectedResult = { ...resource, updated: true };
      updateBusByIdStub.resolves(expectedResult);

      const result = await busesService.updateById(busId, resource);

      expect(result).to.deep.equal(expectedResult);
    });

    it('should throw an error if updating the bus fails', async () => {
      const busId = '123';
      const resource = { busModel: '12XY', seats: 90 };
      const error = new Error('Failed to update bus');
      updateBusByIdStub.throws(error);

      try {
        await busesService.updateById(busId, resource);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(updateBusByIdStub.calledOnceWithExactly(busId, resource)).to.be
        .true;
    });
  });

  describe('getById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let getBusByIdStub: SinonStub;

    beforeEach(() => {
      getBusByIdStub = sinon.stub(busesDao, 'getBusById');
    });

    afterEach(() => {
      getBusByIdStub.restore();
    });

    it('should call getBusById method of busesDao with correct parameters', async () => {
      const resourceId = '123';
      const expectedBus = { id: '123', busModel: '12XY', seats: 90 };
      getBusByIdStub.resolves(expectedBus);

      const result = await busesService.getById(resourceId);

      expect(getBusByIdStub.calledOnceWithExactly(resourceId)).to.be.true;
    });

    it('should return the result of getBusById method of busesDao', async () => {
      const resourceId = '123';
      const expectedBus = { id: '123', busModel: '12XY', seats: 90 };
      getBusByIdStub.resolves(expectedBus);

      const result = await busesService.getById(resourceId);

      expect(result).to.deep.equal(expectedBus);
    });

    it('should throw an error if getting the bus fails', async () => {
      const resourceId = '123';
      const error = new Error('Failed to get bus');
      getBusByIdStub.throws(error);

      try {
        await busesService.getById(resourceId);
      } catch (err) {
        expect(err).to.eql(error);
      }

      expect(getBusByIdStub.calledOnceWithExactly(resourceId)).to.be.true;
    });
  });
});
