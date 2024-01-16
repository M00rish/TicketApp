import debug from 'debug';
import { millisecondsToMinutes } from 'date-fns';
import shortid from 'shortid';
import { injectable, inject, LazyServiceIdentifier } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import mongooseService from '../../common/service/mongoose.service';
import citiesDao, { CitiesDao } from '../../cities/daos/cities.dao';
import busesDao, { BusesDao } from '../../buses/daos/buses.dao';
import ticketsService, {
  TicketsService,
} from '../../tickets/services/tickets.service';
import schedulerService, {
  SchedulerService,
} from '../../common/service/scheduler.service';
import busesService, { BusesService } from '../../buses/services/buses.service';
import citiesService, {
  CitiesService,
} from '../../cities/services/cities.service';
import commonService from '../../common/service/common.service';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { TYPES } from '../../ioc/types';
import { container } from '../../ioc/inversify.config';

const log: debug.IDebugger = debug('app:trips-dao');

class TripsDao {
  constructor(
    private schedulerService: SchedulerService,
    private commonService,
    private citiesService: CitiesService,
    private ticketsService: TicketsService,
    private citiesDao: CitiesDao,
    private busesDao: BusesDao,
    private busesService: BusesService
  ) {
    this.schedulerService = schedulerService;
    this.commonService = commonService;
    this.citiesService = citiesService;
    this.ticketsService = ticketsService;
    this.citiesDao = citiesDao;
    this.busesDao = busesDao;
    this.busesService = busesService;

    this.Trip = this.commonService.getOrCreateModel('Trip', this.tripSchema);
    log('Created new instance of TripsDao');
  }

  /**
   * Retrieves a list of trips.
   *
   * @param limit The maximum number of trips to retrieve. Default is 25.
   * @param page The page number of the trips to retrieve. Default is 0.
   * @returns A promise that resolves to an array of trips.
   * @throws Throws an error if there is an issue retrieving the trips.
   */
  public async listTrips(limit = 25, page = 0) {
    try {
      const trips = await this.Trip.find()
        .limit(limit)
        .skip(limit * page)
        .exec();
      return trips;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Adds a new trip to the database.
   * @param tripFields - The trip fields to be added.
   * @returns The ID of the newly added trip.
   * @throws Throws an error if there is an issue adding the trip.
   */
  public async createTrip(tripFields: CreateTripDto) {
    try {
      const tripId = shortid.generate();
      const trip = new this.Trip({
        _id: tripId,
        ...tripFields,
      });

      const { arrivalTime, departureTime } = tripFields;
      if (arrivalTime || departureTime)
        this.validateTripTimings(arrivalTime, departureTime);

      await trip.save();
      await this.schedulerService.scheduleStatusUpdate(
        tripId,
        trip.arrivalTime
      );

      return tripId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a trip by its ID.
   * @param tripId - The ID of the trip to retrieve.
   * @returns The trip object if found, otherwise throws an error.
   */
  public async getById(tripId: string) {
    try {
      const trip = await this.Trip.findOne({ _id: tripId }).exec();
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );
      return trip;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a trip by its ID.
   * @param tripId - The ID of the trip to update.
   * @param tripFields - The fields to update in the trip.
   * @returns The ID of the updated trip.
   * @throws AppError if the trip is not found, has already been completed, or if there is an error updating the trip.
   */
  public async updateById(tripId: string, tripFields: PatchTripDto) {
    try {
      const trip = await this.Trip.findById({ _id: tripId }).exec();
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );

      if (trip.status === 'completed')
        throw new AppError(
          true,
          'TripCompletedError',
          HttpStatusCode.BadRequest,
          'Trip has been completed already'
        );

      const { arrivalTime, departureTime } = tripFields;
      if (arrivalTime || departureTime)
        this.validateTripTimings(arrivalTime, departureTime);

      const updatedTrip = await this.Trip.findOneAndUpdate(
        { _id: tripId },
        { $set: tripFields },
        { new: true, runValidators: true }
      ).exec();

      if (!updatedTrip)
        throw new AppError(
          false,
          'Internal Server Error',
          HttpStatusCode.InternalServerError,
          'Failed to update trip'
        );

      if (trip.departureTime !== updatedTrip.departureTime)
        this.schedulerService.updateScheduledTime(
          updatedTrip._id,
          updatedTrip.arrivalTime
        );

      return updatedTrip._id;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a trip by its ID.
   * @param tripId - The ID of the trip to delete.
   * @throws {AppError} If the trip is not found.
   */
  public async deleteById(tripId: string) {
    try {
      const trip = await this.Trip.deleteOne({ _id: tripId }).exec();
      if (trip.deletedCount === 0)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );
      await this.ticketsService.deleteById(tripId);
      await this.schedulerService.cancelScheduledTime(tripId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes all trips from the database.
   * Also deletes all associated tickets.
   * @throws {Error} If an error occurs while deleting the trips or tickets.
   */
  public async deleteAllTrips() {
    try {
      await this.Trip.deleteMany({}).exec();
      await this.ticketsService.deleteAllTickets();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the availability of a bus for a given trip.
   * Checks if there is any active trip with overlapping departure and arrival times.
   *
   * @param {string} BusId - The ID of the bus to validate availability for.
   * @returns {Promise<boolean>} - A promise that resolves to true if the bus is available, false otherwise.
   * @throws {Error} - If there is an error while validating the bus availability.
   */
  public async validateBusAvailability(BusId: string) {
    try {
      //TODO: recheck
      // const trip = this.mongooseService
      //   .getMongoose()
      //   .model('Trip', this.tripSchema);

      const tripWithSameTime = await this.Trip.exists({
        busId: BusId,
        Status: 'active',
        $or: [
          {
            // @ts-ignore
            departureTime: { $lt: this.arrivalTime },
            // @ts-ignore
            arrivalTime: { $gt: this.departureTime },
          },
          {
            // @ts-ignore
            departureTime: { $gte: this.departureTime, $lt: this.arrivalTime },
          },
        ],
      });

      if (tripWithSameTime) return false;
      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the trip timings.
   *
   * @param arrivalTime - The arrival time of the trip.
   * @param departureTime - The departure time of the trip.
   * @throws {AppError} - If the trip timings are invalid.
   */
  validateTripTimings(
    arrivalTime: Date | undefined,
    departureTime: Date | undefined
  ) {
    if (!arrivalTime || !departureTime) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Both arrival time and departure time must be provided'
      );
    }

    const parsedArrivalTime = new Date(arrivalTime);
    const parsedDepartureTime = new Date(departureTime);
    const now = new Date();

    if (parsedArrivalTime.getTime() < now.getTime()) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Arrival time must be in the future'
      );
    }

    if (parsedDepartureTime.getTime() < now.getTime()) {
      throw new AppError(
        true,
        'validateDepartureTimeError',
        HttpStatusCode.BadRequest,
        'Departure time must be in the future'
      );
    }

    if (parsedArrivalTime.getTime() < parsedDepartureTime.getTime()) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Arrival time must be greater than departure time'
      );
    }

    const difference =
      parsedArrivalTime.getTime() - parsedDepartureTime.getTime();
    const hours = difference / 1000 / 60 / 60;

    if (hours > 48) {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'The difference between arrival time and departure time must be at max 48 hours'
      );
    }
  }

  /**
   * Validates the departure city by checking if it exists in the cities service.
   * @param departureCityName - The name of the departure city to validate.
   * @returns A boolean indicating whether the departure city is valid or not.
   * @throws Throws an error if there is an error while validating the departure city.
   */
  public async validateDepartureCity(departureCityName: string) {
    try {
      const departureCity = await this.citiesService.getCityByName(
        departureCityName
      );

      if (!departureCity) return false;

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validates the arrival city by checking if it exists and if it is different from the departure city.
   * @param arrivalCityName - The name of the arrival city to validate.
   * @returns A boolean indicating whether the arrival city is valid or not.
   * @throws Throws an error if there is an issue with the validation process.
   */
  public async validateArrivalCity(arrivalCityName: string) {
    try {
      const arrivalCity = await this.citiesService.getCityByName(
        arrivalCityName
      );

      if (!arrivalCity) return false;

      // @ts-ignore
      if (arrivalCity.cityName === this.departureCity)
        throw new AppError(
          true,
          'validateArrivalCityError',
          HttpStatusCode.BadRequest,
          'Arrival city must be different from departure city'
        );

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates the booked seats for a trip.
   * @param tripId - The ID of the trip.
   * @param seatNumber - The seat number to be added to the booked seats.
   * @throws {AppError} If the trip is not found.
   */
  public async updateBookedSeats(tripId: string, seatNumber: Number) {
    try {
      const trip = await this.Trip.findById(tripId).exec();
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );

      await this.Trip.findByIdAndUpdate(tripId, {
        $addToSet: { bookedSeats: seatNumber },
      }).exec();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes a booked seat from a trip.
   * @param tripId - The ID of the trip.
   * @param seatNumber - The seat number to be removed.
   * @throws {AppError} If the trip is not found.
   */
  public async removeBookedSeat(tripId: string, seatNumber: Number) {
    try {
      const trip = await this.Trip.findById(tripId).exec();
      if (!trip)
        throw new AppError(
          true,
          'RessourceNotFoundError',
          HttpStatusCode.NotFound,
          'Trip not found'
        );

      // update bookedseats
      await this.Trip.findByIdAndUpdate(tripId, {
        $pull: { bookedSeats: seatNumber },
      }).exec();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Resets the booked seats for all trips.
   * @throws {Error} If an error occurs while resetting the booked seats.
   */
  public async resetBookedSeatsForAllTrips() {
    try {
      await this.Trip.updateMany({}, { bookedSeats: [] }).exec();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates the status of a trip.
   * @param tripId - The ID of the trip to update.
   */
  public async updateTripStatus(tripId: string) {
    const trip = await this.Trip.findById({ _id: tripId }).exec();
    if (!trip) return;

    if (trip.status !== 'canceled') {
      await this.Trip.findByIdAndUpdate(tripId, { status: 'completed' }).exec();
    }
  }

  schema = mongooseService.getMongoose().Schema;

  tripSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      departureCity: {
        type: this.schema.Types.String,
        ref: this.citiesDao.City,
        required: true,
        validate: {
          validator: this.validateDepartureCity,
          message: 'Departure city does not exist',
        },
      },
      arrivalCity: {
        type: this.schema.Types.String,
        ref: this.citiesDao.City,
        required: true,
        validate: [
          {
            validator: this.validateArrivalCity,
            message: 'Arrival city does not exist',
          },
        ],
      },
      departureTime: {
        type: Date,
        required: true,
      },
      arrivalTime: {
        type: Date,
        required: true,
      },
      duration: String,
      price: { type: Number, required: true },
      ratings: {
        type: Number,
        default: 0,
        min: [0, 'rating must be above 0'],
        max: [5, 'rating must be below 5'],
      },
      status: {
        type: String,
        enum: ['active', 'completed', 'canceled'],
        default: 'active',
      },
      bookedSeats: {
        type: [Number],
      },
      busId: {
        type: this.schema.Types.String,
        ref: this.busesDao.Bus, // TODO: update and use commonService.getOrCreateModel instead
        required: true,
        validate: [
          {
            validator: this.busesService.validateBusExists,
            message: 'Bus does not exist',
          },
          {
            validator: this.validateBusAvailability,
            message: 'Bus is not available for this trip',
          },
        ],
      },
    },
    { id: false, timestamps: true }
  ).pre('save', function (next) {
    const durationInMin = millisecondsToMinutes(
      this.arrivalTime.getTime() - this.departureTime.getTime()
    );

    this.duration =
      `${Math.floor(durationInMin / 60)}` + `h ${durationInMin % 60}` + `min`;
    next();
  });

  Trip = this.commonService.getOrCreateModel('Trip', this.tripSchema);
}

export { TripsDao };
export default new TripsDao(
  schedulerService,
  commonService,
  citiesService,
  ticketsService,
  citiesDao,
  busesDao,
  busesService
);
