import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';
import { TripsService } from '../../../src/trips/services/trips.service';
import { CreateTripDto } from '../../../src/trips/dtos/create.trip.dto';
import { TripsDao } from '../../../src/trips/daos/trips.dao';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';
import { CitiesDao } from '../../../src/cities/daos/cities.dao';
import { CitiesService } from '../../../src/cities/services/cities.service';
import { TicketsDao } from '../../../src/tickets/daos/tickets.dao';
import { TicketsService } from '../../../src/tickets/services/tickets.service';
import { SchedulerService } from '../../../src/common/service/scheduler.service';
import { PatchTripDto } from '../../../src/trips/dtos/patch.trips.dto';

describe('TripsService', () => {
  describe('create', () => {
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
    let addTripStub: sinon.SinonStub;

    beforeEach(() => {
      addTripStub = sinon.stub(tripsDao, 'addTrip');
    });

    afterEach(() => {
      addTripStub.restore();
    });

    it('should create a trip successfully', async () => {
      const createTripDto: CreateTripDto = {
        departureCity: 'London',
        arrivalCity: 'Paris',
        departureTime: new Date(),
        arrivalTime: new Date(),
        price: 10,
        busId: '1',
      };
      const createdTrip = { id: '1', ...createTripDto };
      addTripStub.resolves(createdTrip);

      const result = await tripService.create(createTripDto);
      expect(result).to.eql(createdTrip);
      expect(addTripStub.calledOnceWith(createTripDto)).to.be.true;
    });

    it('should propagate error when tripsDao.addTrip throws error', async () => {
      const createTripDto: CreateTripDto = {
        departureCity: 'London',
        arrivalCity: 'Paris',
        departureTime: new Date(),
        arrivalTime: new Date(),
        price: 12,
        busId: '2',
      };
      const error = new Error('Database error');
      addTripStub.rejects(error);

      try {
        await tripService.create(createTripDto);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('deleteById', () => {
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
    let deleteTripByIdStub: sinon.SinonStub;

    beforeEach(() => {
      deleteTripByIdStub = sinon.stub(tripsDao, 'deleteTripById');
    });

    afterEach(() => {
      deleteTripByIdStub.restore();
    });

    it('should delete a trip successfully', async () => {
      const tripId = '1';
      deleteTripByIdStub.resolves({ deletedCount: 1 });

      const result = await tripService.deleteById(tripId);
      expect(result).to.eql({ deletedCount: 1 });
      expect(deleteTripByIdStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should return null when no trip is deleted', async () => {
      const tripId = '2';
      deleteTripByIdStub.resolves({ deletedCount: 0 });

      const result = await tripService.deleteById(tripId);
      expect(result).to.eql({ deletedCount: 0 });
      expect(deleteTripByIdStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should propagate error when tripsDao.deleteTripById throws error', async () => {
      const tripId = '1';
      const error = new Error('Database error');
      deleteTripByIdStub.rejects(error);

      try {
        await tripService.deleteById(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('deleteById', () => {
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
    let deleteTripByIdStub: sinon.SinonStub;

    beforeEach(() => {
      deleteTripByIdStub = sinon.stub(tripsDao, 'deleteTripById');
    });

    afterEach(() => {
      deleteTripByIdStub.restore();
    });

    it('should delete a trip successfully', async () => {
      const tripId = '1';
      deleteTripByIdStub.resolves({ deletedCount: 1 });

      const result = await tripService.deleteById(tripId);
      expect(result).to.eql({ deletedCount: 1 });
      expect(deleteTripByIdStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should return null when no trip is deleted', async () => {
      const tripId = '2';
      deleteTripByIdStub.resolves({ deletedCount: 0 });

      const result = await tripService.deleteById(tripId);
      expect(result).to.eql({ deletedCount: 0 });
      expect(deleteTripByIdStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should propagate error when tripsDao.deleteTripById throws error', async () => {
      const tripId = '1';
      const error = new Error('Database error');
      deleteTripByIdStub.rejects(error);

      try {
        await tripService.deleteById(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('list', () => {
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
    let listTripsStub: sinon.SinonStub;

    beforeEach(() => {
      listTripsStub = sinon.stub(tripsDao, 'listTrips');
    });

    afterEach(() => {
      listTripsStub.restore();
    });

    it('should return a list of trips successfully', async () => {
      const limit = 10;
      const page = 1;
      const trips = [{ id: '1' }, { id: '2' }];
      listTripsStub.resolves(trips);

      const result = await tripService.list(limit, page);
      expect(result).to.eql(trips);
      expect(listTripsStub.calledOnceWith(limit, page)).to.be.true;
    });

    it('should propagate error when tripsDao.listTrips throws error', async () => {
      const limit = 10;
      const page = 1;
      const error = new Error('Database error');
      listTripsStub.rejects(error);

      try {
        await tripService.list(limit, page);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('updateById', () => {
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
    let updateTripByIdStub: sinon.SinonStub;

    beforeEach(() => {
      updateTripByIdStub = sinon.stub(tripsDao, 'updateTripById');
    });

    afterEach(() => {
      updateTripByIdStub.restore();
    });

    it('should update a trip successfully', async () => {
      const tripId = '1';
      const patchTripDto: PatchTripDto = {
        departureCity: 'London',
        arrivalCity: 'Paris',
        departureTime: new Date(),
        arrivalTime: new Date(),
        price: 10,
        busId: '1',
      };
      const updatedTrip = { id: tripId, ...patchTripDto };
      updateTripByIdStub.resolves(updatedTrip);

      const result = await tripService.updateById(tripId, patchTripDto);
      expect(result).to.eql(updatedTrip);
      expect(updateTripByIdStub.calledOnceWith(tripId, patchTripDto)).to.be
        .true;
    });

    it('should propagate error when tripsDao.updateTripById throws error', async () => {
      const tripId = '1';
      const patchTripDto: PatchTripDto = {
        departureCity: 'London',
        arrivalCity: 'Paris',
        departureTime: new Date(),
        arrivalTime: new Date(),
        price: 12,
        busId: '2',
      };
      const error = new Error('Database error');
      updateTripByIdStub.rejects(error);

      try {
        await tripService.updateById(tripId, patchTripDto);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('getById', () => {
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
    let getTripByIdStub: sinon.SinonStub;

    beforeEach(() => {
      getTripByIdStub = sinon.stub(tripsDao, 'getTripById');
    });

    afterEach(() => {
      getTripByIdStub.restore();
    });

    it('should return a trip successfully', async () => {
      const tripId = '1';
      const trip = {
        id: tripId,
        departureCity: 'London',
        arrivalCity: 'Paris',
      };
      getTripByIdStub.resolves(trip);

      const result = await tripService.getById(tripId);
      expect(result).to.eql(trip);
      expect(getTripByIdStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should return null when no trip is found', async () => {
      const tripId = '2';
      getTripByIdStub.resolves(null);

      const result = await tripService.getById(tripId);
      expect(result).to.be.null;
      expect(getTripByIdStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should propagate error when tripsDao.getTripById throws error', async () => {
      const tripId = '1';
      const error = new Error('Database error');
      getTripByIdStub.rejects(error);

      try {
        await tripService.getById(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('deleteAll', () => {
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
    let deleteAllTripsStub: sinon.SinonStub;

    beforeEach(() => {
      deleteAllTripsStub = sinon.stub(tripsDao, 'deleteAllTrips');
    });

    afterEach(() => {
      deleteAllTripsStub.restore();
    });

    it('should delete all trips successfully', async () => {
      expect(async () => await tripService.deleteAll()).to.not.throw();

      expect(deleteAllTripsStub.calledOnce).to.be.true;
    });

    it('should propagate error when tripsDao.deleteAllTrips throws error', async () => {
      const error = new Error('Database error');
      deleteAllTripsStub.rejects(error);

      try {
        await tripService.deleteAll();
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('updateBookedSeats', () => {
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
    let updateBookedSeatsStub: sinon.SinonStub;

    beforeEach(() => {
      updateBookedSeatsStub = sinon.stub(tripsDao, 'updateBookedSeats');
    });

    afterEach(() => {
      updateBookedSeatsStub.restore();
    });

    it('should update booked seats successfully', async () => {
      const tripId = '1';
      const seats = 2;

      updateBookedSeatsStub.resolves(null);

      expect(
        async () => await tripService.updateBookedSeats(tripId, seats)
      ).to.not.throw();

      expect(updateBookedSeatsStub.calledOnceWith(tripId, seats)).to.be.true;
    });

    it('should propagate error when tripsDao.updateBookedSeats throws error', async () => {
      const tripId = '1';
      const seats = 2;
      const error = new Error('Database error');
      updateBookedSeatsStub.rejects(error);

      try {
        await tripService.updateBookedSeats(tripId, seats);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('removeBookedSeats', () => {
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
    let removeBookedSeatStub: sinon.SinonStub;

    beforeEach(() => {
      removeBookedSeatStub = sinon.stub(tripsDao, 'removeBookedSeat');
    });

    afterEach(() => {
      removeBookedSeatStub.restore();
    });

    it('should remove booked seats successfully', async () => {
      const tripId = '1';
      const seats = 2;

      removeBookedSeatStub.resolves(null);

      expect(
        async () => await tripService.removeBookedSeats(tripId, seats)
      ).to.not.throw();
      expect(removeBookedSeatStub.calledOnceWith(tripId, seats)).to.be.true;
    });

    it('should propagate error when tripsDao.removeBookedSeat throws error', async () => {
      const tripId = '1';
      const seats = 2;
      const error = new Error('Database error');
      removeBookedSeatStub.rejects(error);

      try {
        await tripService.removeBookedSeats(tripId, seats);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('resetBookedSeatsForAllTrips', () => {
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
    let resetBookedSeatsForAllTripsStub: sinon.SinonStub;

    beforeEach(() => {
      resetBookedSeatsForAllTripsStub = sinon.stub(
        tripsDao,
        'resetBookedSeatsForAllTrips'
      );
    });

    afterEach(() => {
      resetBookedSeatsForAllTripsStub.restore();
    });

    it('should reset booked seats for all trips successfully', async () => {
      resetBookedSeatsForAllTripsStub.resolves(null);

      expect(
        async () => await tripService.resetBookedSeatsForAllTrips()
      ).to.not.throw();
      expect(resetBookedSeatsForAllTripsStub.calledOnce).to.be.true;
    });

    it('should propagate error when tripsDao.resetBookedSeatsForAllTrips throws error', async () => {
      const error = new Error('Database error');
      resetBookedSeatsForAllTripsStub.rejects(error);

      try {
        await tripService.resetBookedSeatsForAllTrips();
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });

  describe('updateTripStatus', () => {
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
    let updateTripStatusStub: sinon.SinonStub;

    beforeEach(() => {
      updateTripStatusStub = sinon.stub(tripsDao, 'updateTripStatus');
    });

    afterEach(() => {
      updateTripStatusStub.restore();
    });

    it('should update a trip status successfully', async () => {
      const tripId = '1';
      updateTripStatusStub.resolves(null);

      expect(
        async () => await tripService.updateTripStatus(tripId)
      ).to.not.throw();
      expect(updateTripStatusStub.calledOnceWith(tripId)).to.be.true;
    });

    it('should propagate error when tripsDao.updateTripStatus throws error', async () => {
      const tripId = '1';
      const error = new Error('Database error');
      updateTripStatusStub.rejects(error);

      try {
        await tripService.updateTripStatus(tripId);
        expect.fail('Expected error to be thrown');
      } catch (err) {
        expect(err).to.eql(error);
      }
    });
  });
});
