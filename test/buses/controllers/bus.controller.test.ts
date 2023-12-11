import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import httpMocks from 'node-mocks-http';

import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';
import AppError from '../../../src/common/types/appError';
import { BusesController } from '../../../src/buses/controllers/buses.controller';
import { BusesService } from '../../../src/buses/services/buses.service';
import { BusesDao } from '../../../src/buses/daos/buses.dao';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';

describe('BusesController', () => {
  describe('listBuses', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let busesController = new BusesController(busesService);
    let req: express.Request;
    let res: express.Response;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = {} as express.Request;
      res = {
        status: function (statusCode: number) {
          return this;
        },
        json: function (data: any) {
          return;
        },
      } as express.Response;
      next = sinon.stub();
      statusStub = sinon.stub(res, 'status').returnsThis();
      jsonStub = sinon.stub(res, 'json');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return a list of buses', async () => {
      const buses = [
        { id: 1, name: 'Bus 1' },
        { id: 2, name: 'Bus 2' },
      ];
      sinon.stub(busesService, 'list').resolves(buses);

      await busesController.listBuses(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Ok)).to.be.true;
      expect(jsonStub.calledWith(buses)).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(busesService, 'list').rejects(error);

      await busesController.listBuses(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getBusById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let busesController = new BusesController(busesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: express.Response;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          busId: '1',
        },
      });
      res = {
        status: function (statusCode: number) {
          return this;
        },
        json: function (data: any) {
          return;
        },
      } as express.Response;
      next = sinon.stub();
      statusStub = sinon.stub(res, 'status').returnsThis();
      jsonStub = sinon.stub(res, 'json');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return a bus by id', async () => {
      const bus = { id: 1, name: 'Bus 1' };
      sinon.stub(busesService, 'getById').resolves(bus);

      await busesController.getBusById(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Ok)).to.be.true;
      expect(jsonStub.calledWith(bus)).to.be.true;
    });

    it('should return a not found error when bus does not exist', async () => {
      sinon.stub(busesService, 'getById').resolves(null);

      await busesController.getBusById(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(AppError))).to.be.true;
      expect(
        next.calledWith(sinon.match.has('statusCode', HttpStatusCode.NotFound))
      ).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(busesService, 'getById').rejects(error);

      await busesController.getBusById(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('addBus', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let busesController = new BusesController(busesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        body: {
          busModel: '10YM',
          seats: 10,
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      statusStub = sinon.stub(res, 'status').returnsThis();
      jsonStub = sinon.stub(res, 'json');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should create a bus and return its id', async () => {
      const busId = '1';
      sinon.stub(busesService, 'create').resolves(busId);

      await busesController.addBus(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Created)).to.be.true;
      expect(jsonStub.calledWith({ _id: busId })).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(busesService, 'create').rejects(error);

      await busesController.addBus(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('updateBus', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let busesController = new BusesController(busesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          busId: '1',
        },
        body: {
          busModel: '10YM',
          seats: 10,
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      statusStub = sinon.stub(res, 'status').returnsThis();
      jsonStub = sinon.stub(res, 'json');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should update a bus and return its id', async () => {
      const busId = '1';
      sinon.stub(busesService, 'updateById').resolves(busId);

      await busesController.updateBus(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Ok)).to.be.true;
      expect(jsonStub.calledWith({ _id: busId })).to.be.true;
    });

    it('should return a not found error when bus does not exist', async () => {
      sinon.stub(busesService, 'updateById').resolves(undefined);

      await busesController.updateBus(req, res, next);

      expect(next.calledWith(sinon.match.instanceOf(AppError))).to.be.true;
      expect(
        next.calledWith(sinon.match.has('statusCode', HttpStatusCode.NotFound))
      ).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(busesService, 'updateById').rejects(error);

      await busesController.updateBus(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteBus', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let busesDao = new BusesDao(commonService);
    let busesService = new BusesService(busesDao);
    let busesController = new BusesController(busesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          busId: '1',
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      statusStub = sinon.stub(res, 'status').returnsThis();
      jsonStub = sinon.stub(res, 'json');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should delete a bus and return no content', async () => {
      sinon.stub(busesService, 'deleteById').resolves();

      await busesController.deleteBus(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.NoContent)).to.be.true;
      expect(jsonStub.calledOnce).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(busesService, 'deleteById').rejects(error);

      await busesController.deleteBus(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
