import debug from 'debug';
import { millisecondsToMinutes } from 'date-fns';

import mongooseService from '../../common/service/mongoose.service';
import shortid from 'shortid';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { PatchTripDto } from '../dtos/patch.trips.dto';

const log: debug.IDebugger = debug('app:trips-dao');

class TripsDao {
  constructor() {
    log('created new instance of TripsDao');
  }

  async listTrips(limit = 25, page = 0) {
    return await this.Trip.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  async addTrip(tripFields: CreateTripDto) {
    const tripId = shortid.generate();
    const trip = new this.Trip({
      _id: tripId,
      ...tripFields,
    });

    await trip.save();
    return tripId;
  }

  async getTripById(tripId: string) {
    return await this.Trip.findOne({ _id: tripId }).exec();
  }

  async updateTripById(tripId: string, tripFields: PatchTripDto) {
    const trip = await this.Trip.findOneAndUpdate(
      { _id: tripId },
      { $set: tripFields },
      { new: true }
    ).exec();

    return trip;
  }

  async removeTripById(tripId: string) {
    await this.Trip.deleteOne({ _id: tripId }).exec();
  }

  schema = mongooseService.getMongoose().Schema;

  tripSchema = new this.schema(
    {
      _id: String,
      startCity: { type: String, required: true },
      finishCity: { type: String, required: true },
      startDate: { type: Date, required: true },
      finishDate: { type: Date, required: true },
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
      bookedSeats: { type: Number, max: [50, 'seats must be below 50'] }, // TODO: add static method to update bookedSeats
      busId: { type: String, required: true },
    },
    { id: false, timestamps: true }
  ).pre('save', function (next) {
    const durationInMin = millisecondsToMinutes(
      this.finishDate.getTime() - this.startDate.getTime()
    );

    this.duration =
      `${Math.floor(durationInMin / 60)}` + `h ${durationInMin % 60}` + `min`;

    next();
  });

  Trip = mongooseService.getMongoose().model('Trips', this.tripSchema);
}

export default new TripsDao();
