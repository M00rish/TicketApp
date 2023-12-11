import debug from 'debug';
import { millisecondsToMinutes } from 'date-fns';
import shortid from 'shortid';

import mongooseService, {
  MongooseService,
} from '../../common/service/mongoose.service';
import citiesDao from '../../cities/daos/cities.dao';
import busesDao from '../../buses/daos/buses.dao';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import ticketsService, {
  TicketsService,
} from '../../tickets/services/tickets.service';
import schedulerService, {
  SchedulerService,
} from '../../common/service/scheduler.service';
import CommonService from '../../common/service/common.service';

const log: debug.IDebugger = debug('app:trips-dao');

class TripsDao {
  constructor(
    private schedulerService: SchedulerService,
    private ticketsService: TicketsService,
    private mongooseService: MongooseService
  ) {
    log('created new instance of TripsDao');
    this.Trip = CommonService.getOrCreateModel(this.tripSchema, 'Trip');
  }

  /**
   * Retrieves a list of trips.
   * @param limit - The maximum number of trips to retrieve.
   * @param page - The page number of the trips to retrieve.
   * @returns A promise that resolves to an array of trips.
   * @throws If an error occurs while retrieving the trips.
   */
  async listTrips(limit = 25, page = 0) {
    try {
      return await this.Trip.find()
        .limit(limit)
        .skip(limit * page)
        .exec();
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
  async addTrip(tripFields: CreateTripDto) {
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
  async getTripById(tripId: string) {
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
  async updateTripById(tripId: string, tripFields: PatchTripDto) {
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
  async deleteTripById(tripId: string) {
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
  async deleteAllTrips() {
    try {
      await this.Trip.deleteMany({}).exec();
      await this.ticketsService.deleteAllTickets();
    } catch (error) {
      throw error;
    }
  }

  //TODO : move to buses dao
  validateBusExists = async (BusId: string) => {
    const busExists = await busesDao.Bus.exists({ _id: BusId });
    return busExists;
  };

  // TODO : test after bus testing
  async validateBusAvailability(BusId: string) {
    try {
      const trip = this.mongooseService
        .getMongoose()
        .model('Trip', this.tripSchema);

      const tripWithSameTime = await trip.exists({
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

  // TODO : test after cities testing
  async validateDepartureCity(departureCityName: string) {
    try {
      const departureCity = await citiesDao.getcityByName(departureCityName);

      if (!departureCity) return false;

      return true;
    } catch (error) {
      throw error;
    }
  }
  // TODO : test after cities testing
  async validateArrivalCity(arrivalCityName: string) {
    try {
      const arrivalCity = await citiesDao.getcityByName(arrivalCityName);

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
  async updateBookedSeats(tripId: string, seatNumber: Number) {
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
  async removeBookedSeat(tripId: string, seatNumber: Number) {
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
  async resetBookedSeatsForAllTrips() {
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
  async updateTripStatus(tripId: string) {
    const trip = await this.Trip.findById({ _id: tripId }).exec();
    if (!trip) return;

    if (trip.status !== 'canceled') {
      await this.Trip.findByIdAndUpdate(tripId, { status: 'completed' }).exec();
    }
  }

  schema = this.mongooseService.getMongoose().Schema;

  tripSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      departureCity: {
        type: this.schema.Types.String,
        ref: citiesDao.City,
        required: true,
        validate: {
          validator: this.validateDepartureCity,
          message: 'Departure city does not exist',
        },
      },
      arrivalCity: {
        type: this.schema.Types.String,
        ref: citiesDao.City,
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
        ref: busesDao.Bus,
        required: true,
        validate: [
          {
            validator: this.validateBusExists,
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

  Trip = CommonService.getOrCreateModel(this.tripSchema, 'Trip');
}

export default new TripsDao(schedulerService, ticketsService, mongooseService);
export { TripsDao };
