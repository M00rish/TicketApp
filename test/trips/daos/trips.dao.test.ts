import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import shortid from 'shortid';

import { TripsDao } from '../../../src/trips/daos/trips.dao';
import { SchedulerService } from '../../../src/common/service/scheduler.service';
import { TicketsService } from '../../../src/tickets/services/tickets.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CreateTripDto } from '../../../src/trips/dtos/create.trip.dto';
import AppError from '../../../src/common/types/appError';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';
import { PatchTripDto } from '../../../src/trips/dtos/patch.trips.dto';

describe('TripsDao', () => {
  describe('listTrips', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let findStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      findStub = sinon.stub(tripsDao.Trip, 'find');
    });

    afterEach(() => {
      findStub.restore();
    });

    it('should call Trip.find with correct arguments and return result when called with default parameters', async () => {
      const expectedResult = [{ id: '1', destination: 'Paris' }];
      findStub.returns({
        limit: sinon.stub().returns({
          skip: sinon.stub().returns({
            exec: sinon.stub().resolves(expectedResult),
          }),
        }),
      });

      const result = await tripsDao.listTrips();
      expect(findStub.calledOnce).to.be.true;
      expect(result).to.eql(expectedResult);
    });

    it('should call Trip.find with correct arguments and return result when called with specific limit and page', async () => {
      const expectedResult = [{ id: '2', destination: 'London' }];
      findStub.returns({
        limit: sinon.stub().returns({
          skip: sinon.stub().returns({
            exec: sinon.stub().resolves(expectedResult),
          }),
        }),
      });

      const result = await tripsDao.listTrips(50, 2);
      expect(findStub.calledOnce).to.be.true;
      expect(result).to.eql(expectedResult);
    });

    it('should propagate error when Trip.find throws error', async () => {
      const error = new Error('Database error');
      findStub.throws(error);

      try {
        await tripsDao.listTrips();
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('addTrip', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let saveStub: sinon.SinonStub;
    let scheduleStatusUpdateStub: sinon.SinonStub;
    let validateTripTimingsStub: sinon.SinonStub;
    let generateStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      saveStub = sinon.stub(tripsDao.Trip.prototype, 'save');
      scheduleStatusUpdateStub = sinon.stub(
        schedulerService,
        'scheduleStatusUpdate'
      );
      validateTripTimingsStub = sinon.stub(tripsDao, 'validateTripTimings');
      generateStub = sinon.stub(shortid, 'generate');
    });

    afterEach(() => {
      saveStub.restore();
      scheduleStatusUpdateStub.restore();
      validateTripTimingsStub.restore();
      generateStub.restore();
    });

    it('should create new Trip, validate timings, save trip, schedule status update, and return trip ID when called with valid parameters', async () => {
      const tripFields: CreateTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2022-01-02T00:00:00Z'),
        departureCity: 'Paris',
        arrivalCity: 'London',
        price: 100,
        busId: '123',
      };
      const expectedTripId = '123';

      saveStub.resolves();
      scheduleStatusUpdateStub.resolves();
      validateTripTimingsStub.returns(null);
      generateStub.returns(expectedTripId);

      const result = await tripsDao.addTrip(tripFields);
      expect(result).to.equal(expectedTripId);
      expect(saveStub.calledOnce).to.be.true;
      expect(
        scheduleStatusUpdateStub.calledOnceWith(
          expectedTripId,
          tripFields.arrivalTime
        )
      ).to.be.true;
      expect(
        validateTripTimingsStub.calledOnceWith(
          tripFields.arrivalTime,
          tripFields.departureTime
        )
      ).to.be.true;
    });

    it('should throw error when called with invalid trip timings', async () => {
      const tripFields: CreateTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2021-12-01T00:00:00Z'),
        departureCity: 'Paris',
        arrivalCity: 'London',
        price: 100,
        busId: '123',
      };
      const error = new Error('Invalid trip timings');

      validateTripTimingsStub.throws(error);

      try {
        await tripsDao.addTrip(tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when trip.save throws error', async () => {
      const tripFields: CreateTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2021-12-01T00:00:00Z'),
        departureCity: 'Paris',
        arrivalCity: 'London',
        price: 100,
        busId: '123',
      };
      const error = new Error('Database error');

      saveStub.throws(error);

      try {
        await tripsDao.addTrip(tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when SchedulerService.scheduleStatusUpdate throws error', async () => {
      const tripFields: CreateTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2021-12-01T00:00:00Z'),
        departureCity: 'Paris',
        arrivalCity: 'London',
        price: 100,
        busId: '123',
      };
      const error = new Error('Database error');

      saveStub.resolves();
      scheduleStatusUpdateStub.throws(error);

      try {
        await tripsDao.addTrip(tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('getTripById', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let findOneStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      findOneStub = sinon.stub(tripsDao.Trip, 'findOne');
    });

    afterEach(() => {
      findOneStub.restore();
    });

    it('should call Trip.findOne with correct arguments and return trip when called with valid trip ID', async () => {
      const expectedTrip = { _id: '123', destination: 'Paris' };
      findOneStub.returns({ exec: sinon.stub().resolves(expectedTrip) });

      const result = await tripsDao.getTripById('123');
      expect(result).to.eql(expectedTrip);
      expect(findOneStub.calledOnceWith({ _id: '123' })).to.be.true;
    });

    it('should throw RessourceNotFoundError when called with non-existent trip ID', async () => {
      findOneStub.returns({ exec: sinon.stub().resolves(null) });

      try {
        await tripsDao.getTripById('123');
        expect.fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('RessourceNotFoundError');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Trip not found');
      }
    });

    it('should propagate error when Trip.findOne throws error', async () => {
      const error = new Error('Database error');
      findOneStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.getTripById('123');
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('updateTripById', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let findByIdStub: sinon.SinonStub;
    let findOneAndUpdateStub: sinon.SinonStub;
    let validateTripTimingsStub: sinon.SinonStub;
    let updateScheduledTimeStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      findByIdStub = sinon.stub(tripsDao.Trip, 'findById');
      findOneAndUpdateStub = sinon.stub(tripsDao.Trip, 'findOneAndUpdate');
      validateTripTimingsStub = sinon.stub(tripsDao, 'validateTripTimings');
      updateScheduledTimeStub = sinon.stub(
        schedulerService,
        'updateScheduledTime'
      );
    });

    afterEach(() => {
      findByIdStub.restore();
      findOneAndUpdateStub.restore();
      validateTripTimingsStub.restore();
      updateScheduledTimeStub.restore();
    });

    it('should update trip and return trip ID when called with valid parameters', async () => {
      const tripFields: PatchTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2022-01-02T00:00:00Z'),
      };
      const expectedTripId = '123';
      const trip = {
        _id: expectedTripId,
        status: 'ongoing',
        departureTime: new Date('2022-01-01T00:00:00Z'),
      };
      const updatedTrip = { ...trip, ...tripFields };

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findOneAndUpdateStub.returns({
        exec: sinon.stub().resolves(updatedTrip),
      });

      const result = await tripsDao.updateTripById(expectedTripId, tripFields);

      expect(result).to.equal(expectedTripId);
      expect(findByIdStub.calledOnceWith({ _id: expectedTripId })).to.be.true;
      expect(
        findOneAndUpdateStub.calledOnceWith(
          { _id: expectedTripId },
          { $set: tripFields },
          { new: true, runValidators: true }
        )
      ).to.be.true;
      expect(
        updateScheduledTimeStub.calledOnceWith(
          updatedTrip._id,
          updatedTrip.arrivalTime
        )
      ).to.be.true;
    });

    it('should throw RessourceNotFoundError when called with non-existent trip ID', async () => {
      const tripFields: PatchTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2022-01-02T00:00:00Z'),
      };
      const tripId = '123';

      findByIdStub.returns({ exec: sinon.stub().resolves(null) });

      try {
        await tripsDao.updateTripById(tripId, tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('RessourceNotFoundError');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Trip not found');
      }
    });

    it('should throw TripCompletedError when called with completed trip ID', async () => {
      const tripFields: PatchTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2022-01-02T00:00:00Z'),
      };
      const tripId = '123';
      const trip = { _id: tripId, status: 'completed' };

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });

      try {
        await tripsDao.updateTripById(tripId, tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('TripCompletedError');
        expect(err.statusCode).to.equal(HttpStatusCode.BadRequest);
        expect(err.message).to.equal('Trip has been completed already');
      }
    });

    it('should propagate error when Trip.findById throws error', async () => {
      const tripFields: PatchTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2022-01-02T00:00:00Z'),
      };
      const tripId = '123';
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.updateTripById(tripId, tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when Trip.findOneAndUpdate throws error', async () => {
      const tripFields: PatchTripDto = {
        arrivalTime: new Date('2022-01-01T00:00:00Z'),
        departureTime: new Date('2022-01-02T00:00:00Z'),
      };
      const tripId = '123';
      const trip = { _id: tripId, status: 'ongoing' };
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findOneAndUpdateStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.updateTripById(tripId, tripFields);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('deleteTripById', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let deleteOneStub: sinon.SinonStub;
    let deleteTicketsByTripIdStub: sinon.SinonStub;
    let cancelScheduledTimeStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      deleteOneStub = sinon.stub(tripsDao.Trip, 'deleteOne');
      deleteTicketsByTripIdStub = sinon.stub(ticketsService, 'deleteById');
      cancelScheduledTimeStub = sinon.stub(
        schedulerService,
        'cancelScheduledTime'
      );
    });

    afterEach(() => {
      deleteOneStub.restore();
      deleteTicketsByTripIdStub.restore();
      cancelScheduledTimeStub.restore();
    });

    it('should delete trip, delete tickets and cancel scheduled time when called with valid trip ID', async () => {
      const tripId = '123';
      deleteOneStub.returns({
        exec: sinon.stub().resolves({ deletedCount: 1 }),
      });
      deleteTicketsByTripIdStub.resolves();
      cancelScheduledTimeStub.resolves();

      await tripsDao.deleteTripById(tripId);

      expect(deleteOneStub.calledOnceWith({ _id: tripId })).to.be.true;
      expect(deleteTicketsByTripIdStub.calledOnceWith(tripId)).to.be.true;
      expect(cancelScheduledTimeStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should throw RessourceNotFoundError when called with non-existent trip ID', async () => {
      const tripId = '123';
      deleteOneStub.returns({
        exec: sinon.stub().resolves({ deletedCount: 0 }),
      });

      try {
        await tripsDao.deleteTripById(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('RessourceNotFoundError');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Trip not found');
      }
    });

    it('should propagate error when Trip.deleteOne throws error', async () => {
      const tripId = '123';
      const error = new Error('Database error');
      deleteOneStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.deleteTripById(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('deleteAllTrips', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let deleteManyStub: sinon.SinonStub;
    let deleteAllTicketsStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      deleteManyStub = sinon.stub(tripsDao.Trip, 'deleteMany');
      deleteAllTicketsStub = sinon.stub(ticketsService, 'deleteAllTickets');
    });

    afterEach(() => {
      deleteManyStub.restore();
      deleteAllTicketsStub.restore();
    });

    it('should delete all trips and tickets when called', async () => {
      deleteManyStub.returns({ exec: sinon.stub().resolves() });
      deleteAllTicketsStub.resolves();

      await tripsDao.deleteAllTrips();

      expect(deleteManyStub.calledOnceWith({})).to.be.true;
      expect(deleteAllTicketsStub.calledOnce).to.be.true;
    });

    it('should propagate error when Trip.deleteMany throws error', async () => {
      const error = new Error('Database error');
      deleteManyStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.deleteAllTrips();
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when TicketsService.deleteAllTickets throws error', async () => {
      const error = new Error('Database error');
      deleteManyStub.returns({ exec: sinon.stub().resolves() });
      deleteAllTicketsStub.rejects(error);

      try {
        await tripsDao.deleteAllTrips();
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('validateTripTimings', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should throw error when arrivalTime or departureTime is not provided', () => {
      expect(() => tripsDao.validateTripTimings(undefined, undefined)).to.throw(
        AppError,
        'Both arrival time and departure time must be provided'
      );
    });

    it('should throw error when arrivalTime is in the past', () => {
      const arrivalTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      const departureTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour later
      expect(() =>
        tripsDao.validateTripTimings(arrivalTime, departureTime)
      ).to.throw(AppError, 'Arrival time must be in the future');
    });

    it('should throw error when departureTime is in the past', () => {
      const arrivalTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour later
      const departureTime = new Date(Date.now() - 1000 * 60 * 60); // 1 hour ago
      expect(() =>
        tripsDao.validateTripTimings(arrivalTime, departureTime)
      ).to.throw(AppError, 'Departure time must be in the future');
    });

    it('should throw error when arrivalTime is less than departureTime', () => {
      const arrivalTime = new Date(Date.now() + 1000 * 60 * 60); // 1 hour later
      const departureTime = new Date(Date.now() + 1000 * 60 * 60 * 2); // 2 hours later
      expect(() =>
        tripsDao.validateTripTimings(arrivalTime, departureTime)
      ).to.throw(AppError, 'Arrival time must be greater than departure time');
    });

    it('should throw error when the difference between arrivalTime and departureTime is more than 48 hours', () => {
      const arrivalTime = new Date(Date.now() + 1000 * 60 * 60 * 49); // 49 hours later
      const departureTime = new Date(); // now
      expect(() =>
        tripsDao.validateTripTimings(arrivalTime, departureTime)
      ).to.throw(
        AppError,
        'The difference between arrival time and departure time must be at max 48 hours'
      );
    });

    it('should not throw error when the difference between arrivalTime and departureTime is less than or equal to 48 hours', () => {
      const arrivalTime = new Date(Date.now() + 1000 * 60 * 60 * 48); // 48 hours later
      const departureTime = new Date(); // now
      expect(() =>
        tripsDao.validateTripTimings(arrivalTime, departureTime)
      ).to.not.throw();
    });
  });

  describe('updateBookedSeats', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let findByIdStub: sinon.SinonStub;
    let findByIdAndUpdateStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      findByIdStub = sinon.stub(tripsDao.Trip, 'findById');
      findByIdAndUpdateStub = sinon.stub(tripsDao.Trip, 'findByIdAndUpdate');
    });

    afterEach(() => {
      findByIdStub.restore();
      findByIdAndUpdateStub.restore();
    });

    it('should update booked seats when called with valid parameters', async () => {
      const tripId = '123';
      const seatNumber = 1;
      const trip = { _id: tripId, bookedSeats: [] };

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findByIdAndUpdateStub.returns({ exec: sinon.stub().resolves() });

      await tripsDao.updateBookedSeats(tripId, seatNumber);

      expect(findByIdStub.calledOnceWith(tripId)).to.be.true;
      expect(
        findByIdAndUpdateStub.calledOnceWith(tripId, {
          $addToSet: { bookedSeats: seatNumber },
        })
      ).to.be.true;
    });

    it('should throw RessourceNotFoundError when called with non-existent trip ID', async () => {
      const tripId = '123';
      const seatNumber = 1;

      findByIdStub.returns({ exec: sinon.stub().resolves(null) });

      try {
        await tripsDao.updateBookedSeats(tripId, seatNumber);
        expect.fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('RessourceNotFoundError');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Trip not found');
      }
    });

    it('should propagate error when Trip.findById throws error', async () => {
      const tripId = '123';
      const seatNumber = 1;
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.updateBookedSeats(tripId, seatNumber);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when Trip.findByIdAndUpdate throws error', async () => {
      const tripId = '123';
      const seatNumber = 1;
      const trip = { _id: tripId, bookedSeats: [] };
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findByIdAndUpdateStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.updateBookedSeats(tripId, seatNumber);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('removeBookedSeat', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let findByIdStub: sinon.SinonStub;
    let findByIdAndUpdateStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      findByIdStub = sinon.stub(tripsDao.Trip, 'findById');
      findByIdAndUpdateStub = sinon.stub(tripsDao.Trip, 'findByIdAndUpdate');
    });

    afterEach(() => {
      findByIdStub.restore();
      findByIdAndUpdateStub.restore();
    });

    it('should remove booked seat when called with valid parameters', async () => {
      const tripId = '123';
      const seatNumber = 1;
      const trip = { _id: tripId, bookedSeats: [seatNumber] };

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findByIdAndUpdateStub.returns({ exec: sinon.stub().resolves() });

      await tripsDao.removeBookedSeat(tripId, seatNumber);

      expect(findByIdStub.calledOnceWith(tripId)).to.be.true;
      expect(
        findByIdAndUpdateStub.calledOnceWith(tripId, {
          $pull: { bookedSeats: seatNumber },
        })
      ).to.be.true;
    });

    it('should throw RessourceNotFoundError when called with non-existent trip ID', async () => {
      const tripId = '123';
      const seatNumber = 1;

      findByIdStub.returns({ exec: sinon.stub().resolves(null) });

      try {
        await tripsDao.removeBookedSeat(tripId, seatNumber);
        expect.fail('Expected error to be thrown');
      } catch (err: any) {
        expect(err).to.be.instanceOf(AppError);
        expect(err.isOperational).to.be.true;
        expect(err.name).to.equal('RessourceNotFoundError');
        expect(err.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(err.message).to.equal('Trip not found');
      }
    });

    it('should propagate error when Trip.findById throws error', async () => {
      const tripId = '123';
      const seatNumber = 1;
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.removeBookedSeat(tripId, seatNumber);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when Trip.findByIdAndUpdate throws error', async () => {
      const tripId = '123';
      const seatNumber = 1;
      const trip = { _id: tripId, bookedSeats: [seatNumber] };
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findByIdAndUpdateStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.removeBookedSeat(tripId, seatNumber);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('resetBookedSeatsForAllTrips', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let updateManyStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      updateManyStub = sinon.stub(tripsDao.Trip, 'updateMany');
    });

    afterEach(() => {
      updateManyStub.restore();
    });

    it('should reset booked seats for all trips when called', async () => {
      updateManyStub.returns({ exec: sinon.stub().resolves() });

      await tripsDao.resetBookedSeatsForAllTrips();

      expect(updateManyStub.calledOnceWith({}, { bookedSeats: [] })).to.be.true;
    });

    it('should propagate error when Trip.updateMany throws error', async () => {
      const error = new Error('Database error');
      updateManyStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.resetBookedSeatsForAllTrips();
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('updateTripStatus', () => {
    let tripsDao: TripsDao;
    let schedulerService: SchedulerService;
    let ticketsService: TicketsService;
    let mongooseService: MongooseService;
    let findByIdStub: sinon.SinonStub;
    let findByIdAndUpdateStub: sinon.SinonStub;

    beforeEach(() => {
      schedulerService = new SchedulerService();
      ticketsService = new TicketsService(schedulerService);
      mongooseService = new MongooseService();
      tripsDao = new TripsDao(
        schedulerService,
        ticketsService,
        mongooseService
      );
      findByIdStub = sinon.stub(tripsDao.Trip, 'findById');
      findByIdAndUpdateStub = sinon.stub(tripsDao.Trip, 'findByIdAndUpdate');
    });

    afterEach(() => {
      findByIdStub.restore();
      findByIdAndUpdateStub.restore();
    });

    it('should update trip status to completed when trip is not canceled', async () => {
      const tripId = '123';
      const trip = { _id: tripId, status: 'ongoing' };

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findByIdAndUpdateStub.returns({ exec: sinon.stub().resolves() });

      await tripsDao.updateTripStatus(tripId);

      expect(findByIdStub.calledOnceWith({ _id: tripId })).to.be.true;
      expect(
        findByIdAndUpdateStub.calledOnceWith(tripId, { status: 'completed' })
      ).to.be.true;
    });

    it('should not update trip status when trip is canceled', async () => {
      const tripId = '123';
      const trip = { _id: tripId, status: 'canceled' };

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });

      await tripsDao.updateTripStatus(tripId);

      expect(findByIdStub.calledOnceWith({ _id: tripId })).to.be.true;
      expect(findByIdAndUpdateStub.called).to.be.false;
    });

    it('should not update trip status when trip does not exist', async () => {
      const tripId = '123';

      findByIdStub.returns({ exec: sinon.stub().resolves(null) });

      await tripsDao.updateTripStatus(tripId);

      expect(findByIdStub.calledOnceWith({ _id: tripId })).to.be.true;
      expect(findByIdAndUpdateStub.called).to.be.false;
    });

    it('should propagate error when Trip.findById throws error', async () => {
      const tripId = '123';
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.updateTripStatus(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });

    it('should propagate error when Trip.findByIdAndUpdate throws error', async () => {
      const tripId = '123';
      const trip = { _id: tripId, status: 'ongoing' };
      const error = new Error('Database error');

      findByIdStub.returns({ exec: sinon.stub().resolves(trip) });
      findByIdAndUpdateStub.returns({ exec: sinon.stub().rejects(error) });

      try {
        await tripsDao.updateTripStatus(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });
});
