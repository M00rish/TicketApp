import debug from 'debug';
import { millisecondsToMinutes } from 'date-fns';

import mongooseService from '../../common/service/mongoose.service';
import shortid from 'shortid';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import AppError from '../../common/types/appError';

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

      await trip.save();
      return tripId;
    } catch (error) {
      throw error;
    }
  }

  async getTripById(tripId: string) {
    try {
      const trip = await this.Trip.findOne({ _id: tripId }).exec();
      if (!trip)
        throw new AppError(false, 'getTripById_Error', 404, 'Trip not found');
      return trip;
    } catch (error) {
      throw error;
    }
  }

  async updateTripById(tripId: string, tripFields: PatchTripDto) {
    try {
      const trip = await this.Trip.findById({ _id: tripId }).exec();
      if (!trip)
        throw new AppError(true, 'updateTripById_Error', 404, 'Trip not found');

      const updatedTrip = await this.Trip.findOneAndUpdate(
        { _id: tripId },
        { $set: tripFields },
        { new: true }
      ).exec();

      if (!updatedTrip)
        throw new AppError(
          false,
          'updateTripById_Error',
          500,
          'Failed to update trip'
        );

      return updatedTrip._id;
    } catch (error) {
      throw error;
    }
  }

  async removeTripById(tripId: string) {
    try {
      const trip = await this.Trip.deleteOne({ _id: tripId }).exec();
      if (trip.deletedCount === 0)
        throw new AppError(true, 'removeTripById_Error', 404, 'Trip not found');
    } catch (error) {
      throw error;
    }
  }

  schema = mongooseService.getMongoose().Schema;

  tripSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      startCity: { type: String, required: true }, // ref: 'Cities'
      finishCity: { type: String, required: true }, // ref: 'Cities'
      departureTime: { type: Date, required: true },
      arrivalTime: { type: Date, required: true },
      duration: String,
      price: { type: Number, required: true },
      ratings: {
        type: Number,
        default: 0,
        min: [0, 'rating must be above 0'],
        max: [5, 'rating must be below 5'],
      },
      seats: {
        type: Number,
        min: [10, 'seats must be above 10'],
        max: [50, 'seats must be below 50'],
        required: true,
      },
      bookedSeats: {
        type: Number,
        default: 0,
        min: 0,
        max: [50, 'seats must be below 50'],
      }, // TODO: add static method to update bookedSeats
      busId: { type: String, required: true }, //  ref: 'Buses'
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
