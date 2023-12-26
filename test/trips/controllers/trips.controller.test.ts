import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import express from 'express';
import request from 'supertest';
import httpMocks from 'node-mocks-http';

import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';
import { TripsController } from '../../../src/trips/controllers/trips.controller';
import { TripsService } from '../../../src/trips/services/trips.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CitiesDao } from '../../../src/cities/daos/cities.dao';
import { CitiesService } from '../../../src/cities/services/cities.service';
import { CommonService } from '../../../src/common/service/common.service';
import { SchedulerService } from '../../../src/common/service/scheduler.service';
import { TicketsDao } from '../../../src/tickets/daos/tickets.dao';
import { TicketsService } from '../../../src/tickets/services/tickets.service';
import { TripsDao } from '../../../src/trips/daos/trips.dao';
import AppError from '../../../src/common/types/appError';

describe('TripsController', () => {
  describe('listTrips', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let ticketsDao = new TicketsDao(commonService);
    let ticketsService = new TicketsService(ticketsDao);
    let schedulerService = new SchedulerService();
    let tripsDao = new TripsDao(
      schedulerService,
      ticketsService,
      commonService,
      citiesService
    );
    let tripService = new TripsService(tripsDao);
    let tripsController = new TripsController(tripService);

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

    it('should return a list of trips', async () => {
      const trips = [
        { id: 1, name: 'Trip 1' },
        { id: 2, name: 'Trip 2' },
      ];
      sinon.stub(tripService, 'list').resolves(trips);

      await tripsController.listTrips(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Ok)).to.be.true;
      expect(jsonStub.calledWith(trips)).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(tripService, 'list').rejects(error);

      await tripsController.listTrips(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('getTripById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let ticketsDao = new TicketsDao(commonService);
    let ticketsService = new TicketsService(ticketsDao);
    let schedulerService = new SchedulerService();
    let tripsDao = new TripsDao(
      schedulerService,
      ticketsService,
      commonService,
      citiesService
    );
    let tripService = new TripsService(tripsDao);
    let tripsController = new TripsController(tripService);

    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest();
      res = httpMocks.createResponse();
      next = sinon.stub();
      statusStub = sinon.stub(res, 'status').returnsThis();
      jsonStub = sinon.stub(res, 'json');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return a trip', async () => {
      const trip = { id: '1', name: 'Trip 1' };
      req.params.tripId = trip.id;
      sinon.stub(tripService, 'getById').resolves(trip);

      await tripsController.getTripById(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Ok)).to.be.true;
      expect(jsonStub.calledWith(trip)).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(tripService, 'getById').rejects(error);

      await tripsController.getTripById(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('createTrip', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let ticketsDao = new TicketsDao(commonService);
    let ticketsService = new TicketsService(ticketsDao);
    let schedulerService = new SchedulerService();
    let tripsDao = new TripsDao(
      schedulerService,
      ticketsService,
      commonService,
      citiesService
    );
    let tripService = new TripsService(tripsDao);
    let tripsController = new TripsController(tripService);

    let req: express.Request;
    let res: express.Response;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = {
        body: {
          departureCity: 'departureCity',
          arrivalCity: 'arrivalCity',
          departureTime: 'departureTime',
          arrivalTime: 'arrivalTime',
          price: 22,
          busId: '123DSA',
        },
      } as express.Request;
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

    it('should create a trip and return its id', async () => {
      const tripId = '123';
      sinon.stub(tripService, 'create').resolves(tripId);

      await tripsController.createTrip(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Created)).to.be.true;
      expect(jsonStub.calledWith({ _id: tripId })).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(tripService, 'create').rejects(error);

      await tripsController.createTrip(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('patchTripById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let ticketsDao = new TicketsDao(commonService);
    let ticketsService = new TicketsService(ticketsDao);
    let schedulerService = new SchedulerService();
    let tripsDao = new TripsDao(
      schedulerService,
      ticketsService,
      commonService,
      citiesService
    );
    let tripService = new TripsService(tripsDao);
    let tripsController = new TripsController(tripService);

    let req: httpMocks.MockRequest<express.Request>;
    let res: express.Response;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          tripId: '123',
        },
        body: {},
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

    it('should update a trip and return its id', async () => {
      const tripId = '123';
      sinon.stub(tripService, 'updateById').resolves();

      await tripsController.patchTripById(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.Ok)).to.be.true;
      expect(jsonStub.calledWith({ _id: tripId })).to.be.true;
    });

    it('should not allow updating certain fields', async () => {
      req.body.duration = 10;
      req.body.ratings = 4.5;
      req.body.bookedSeats = 5;

      await tripsController.patchTripById(req, res, next);

      const expectedError = new AppError(
        true,
        'patchTripError',
        HttpStatusCode.BadRequest,
        "you're not allowed to change the following fields: duration ratings bookedSeats"
      );
      expect(next.calledWith(sinon.match.has('message', expectedError.message)))
        .to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(tripService, 'updateById').rejects(error);

      await tripsController.patchTripById(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteTripById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let ticketsDao = new TicketsDao(commonService);
    let ticketsService = new TicketsService(ticketsDao);
    let schedulerService = new SchedulerService();
    let tripsDao = new TripsDao(
      schedulerService,
      ticketsService,
      commonService,
      citiesService
    );
    let tripService = new TripsService(tripsDao);
    let tripsController = new TripsController(tripService);

    let req: httpMocks.MockRequest<express.Request>;
    let res: express.Response;
    let next: sinon.SinonStub;
    let statusStub: sinon.SinonStub;
    let jsonStub: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          tripId: '123',
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

    it('should delete a trip by id', async () => {
      sinon.stub(tripService, 'deleteById').resolves();

      await tripsController.deleteTripById(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.NoContent)).to.be.true;
      expect(jsonStub.calledOnce).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(tripService, 'deleteById').rejects(error);

      await tripsController.deleteTripById(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });

  describe('deleteAllTrips', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let ticketsDao = new TicketsDao(commonService);
    let ticketsService = new TicketsService(ticketsDao);
    let schedulerService = new SchedulerService();
    let tripsDao = new TripsDao(
      schedulerService,
      ticketsService,
      commonService,
      citiesService
    );
    let tripService = new TripsService(tripsDao);
    let tripsController = new TripsController(tripService);

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

    it('should delete all trips', async () => {
      sinon.stub(tripService, 'deleteAll').resolves();

      await tripsController.deleteAllTrips(req, res, next);

      expect(statusStub.calledWith(HttpStatusCode.NoContent)).to.be.true;
      expect(jsonStub.calledOnce).to.be.true;
    });

    it('should handle errors', async () => {
      const error = new Error('Error message');
      sinon.stub(tripService, 'deleteAll').rejects(error);

      await tripsController.deleteAllTrips(req, res, next);

      expect(next.calledWith(error)).to.be.true;
    });
  });
});
