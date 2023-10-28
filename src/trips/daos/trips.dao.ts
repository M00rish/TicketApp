import debug from 'debug';
import { millisecondsToMinutes } from 'date-fns';
import shortid from 'shortid';

import mongooseService from '../../common/service/mongoose.service';
import citiesDao from '../../cities/daos/cities.dao';
import busesDao from '../../buses/daos/buses.dao';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import ticketsDao from '../../tickets/daos/tickets.dao';
import SchedulerService from '../../common/service/scheduler.service';
import schedulerService from '../../common/service/scheduler.service';

const log: debug.IDebugger = debug('app:trips-dao');

class TripsDao {
  constructor() {
    log('created new instance of TripsDao');
  }

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
      await SchedulerService.scheduleStatusUpdate(tripId, trip.arrivalTime);

      return tripId;
    } catch (error) {
      throw error;
    }
  }

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
        schedulerService.updateScheduledTime(
          updatedTrip._id,
          updatedTrip.arrivalTime
        );

      return updatedTrip._id;
    } catch (error) {
      throw error;
    }
  }

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
      await ticketsDao.deleteTicketsByTripId(tripId);
      await SchedulerService.cancelScheduledTime(tripId);
    } catch (error) {
      throw error;
    }
  }

  async deleteAllTrips() {
    try {
      await this.Trip.deleteMany({}).exec();
      await ticketsDao.deleteAllTickets();
    } catch (error) {
      throw error;
    }
  }

  validateBusExists = async (BusId: string) => {
    const busExists = await busesDao.Bus.exists({ _id: BusId });
    return busExists;
  };

  async validateBusAvailability(BusId: string) {
    try {
      const trip = mongooseService.getMongoose().model('Trip', this.tripSchema);

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

  validateTripTimings(
    arrivalTime: Date | undefined,
    departureTime: Date | undefined
  ) {
    if (arrivalTime && departureTime) {
      const paresdArrivalTime = new Date(arrivalTime);
      const parsedDepartureTime = new Date(departureTime);
      const now = new Date();

      if (
        paresdArrivalTime.getTime() < now.getTime() ||
        parsedDepartureTime.getTime() < now.getTime()
      )
        throw new AppError(
          true,
          'validateArrivalTimeError',
          HttpStatusCode.BadRequest,
          'Arrival time and departure time must be in the future'
        );

      if (paresdArrivalTime.getTime() < parsedDepartureTime.getTime())
        throw new AppError(
          true,
          'validateArrivalTimeError',
          HttpStatusCode.BadRequest,
          'Arrival time must be greater than departure time'
        );

      const difference =
        paresdArrivalTime.getTime() - parsedDepartureTime.getTime();
      const hours = difference / 1000 / 60 / 60;

      if (hours > 48)
        throw new AppError(
          true,
          'validateArrivalTimeError',
          HttpStatusCode.BadRequest,
          'The difference between arrival time and departure time must be at max 48 hours'
        );
    } else {
      throw new AppError(
        true,
        'validateArrivalTimeError',
        HttpStatusCode.BadRequest,
        'Please provide both arrival time and departure time'
      );
    }
  }

  async validateDepartureCity(departureCityName: string) {
    try {
      const departureCity = await citiesDao.getcityByName(departureCityName);

      if (!departureCity) return false;

      return true;
    } catch (error) {
      throw error;
    }
  }

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

      // update bookedseats
      await this.Trip.findByIdAndUpdate(tripId, {
        $addToSet: { bookedSeats: seatNumber },
      }).exec();
    } catch (error) {
      throw error;
    }
  }

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

  async resetBookedSeatsForAllTrips() {
    try {
      await this.Trip.updateMany({}, { bookedSeats: [] }).exec();
    } catch (error) {
      throw error;
    }
  }
  async updateTripStatus(tripId: string) {
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

  Trip = mongooseService.getMongoose().model('Trip', this.tripSchema);
}

export default new TripsDao();
