import debug from 'debug';
import { millisecondsToMinutes } from 'date-fns';
import shortid from 'shortid';
import { injectable, inject, LazyServiceIdentifier } from 'inversify';
import getDecorators from 'inversify-inject-decorators';

import { TicketsService } from '../../tickets/services/tickets.service';
import { SchedulerService } from '../../common/service/scheduler.service';
import { BusesService } from '../../buses/services/buses.service';
import { CitiesService } from '../../cities/services/cities.service';
import { CommonService } from '../../common/service/common.service';
import { CreateTripDto } from '../dtos/create.trip.dto';
import { PatchTripDto } from '../dtos/patch.trips.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:trips-dao');

class TripsDao {
  constructor(
    private commonService: CommonService,
    private citiesService: CitiesService,
    private busesService: BusesService
  ) {
    this.Trip = this.commonService.getOrCreateModel('Trip', this.tripSchema);
    log('Created new instance of TripsDao');
  }

  /**
   * Retrieves a list of trips.
   * @param limit - The maximum number of trips to retrieve. Default is 25.
   * @param page - The page number of the trips to retrieve. Default is 0.
   * @returns A promise that resolves to an array of trips.
   */
  public async list(limit = 25, page = 0) {
    return await this.Trip.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  /**
   * Creates a new trip.
   * @param tripDto - The data transfer object containing the trip details.
   * @returns The created trip.
   */
  public async create(tripDto: CreateTripDto) {
    const tripId = shortid.generate();
    const trip = new this.Trip({
      _id: tripId,
      ...tripDto,
    });
    await trip.save();
    return trip;
  }

  /**
   * Retrieves a trip by its ID.
   * @param tripId - The ID of the trip to retrieve.
   * @returns A promise that resolves to the trip object if found, or null if not found.
   */
  public async getById(tripId: string) {
    return await this.Trip.findOne({ _id: tripId }).exec();
  }

  /**
   * Updates a trip by its ID.
   * @param {string} tripId - The ID of the trip to update.
   * @param {PatchTripDto} tripFields - The fields to update in the trip.
   * @returns {Promise<Trip>} - A promise that resolves to the updated trip.
   */
  public async updateById(tripId: string, tripFields: PatchTripDto) {
    return this.Trip.findOneAndUpdate(
      { _id: tripId },
      { $set: tripFields },
      { new: true, runValidators: true }
    ).exec();
  }

  /**
   * Deletes a trip by its ID.
   * @param tripId - The ID of the trip to delete.
   * @returns A promise that resolves to the result of the delete operation.
   */
  public async deleteById(tripId: string) {
    return await this.Trip.deleteOne({ _id: tripId }).exec();
  }

  public async deleteAllTrips() {
    await this.Trip.deleteMany({}).exec();
  }

  /**
   * Resets the booked seats for all trips.
   * @throws {Error} If an error occurs while resetting the booked seats.
   */
  public async resetBookedSeatsForAllTrips() {
    await this.Trip.updateMany({}, { bookedSeats: [] }).exec();
  }

  /**
   * Updates the booked seats for a trip.
   * @param tripId - The ID of the trip.
   * @param seatNumber - The seat number to be added to the booked seats.
   * @throws {AppError} If the trip is not found.
   */
  public async updateBookedSeats(tripId: string, seatNumber: Number) {
    await this.Trip.findByIdAndUpdate(tripId, {
      $addToSet: { bookedSeats: seatNumber },
    }).exec();
  }

  /**
   * Removes a booked seat from a trip.
   * @param tripId - The ID of the trip.
   * @param seatNumber - The seat number to be removed.
   * @throws {AppError} If the trip is not found.
   */
  public async removeBookedSeat(tripId: string, seatNumber: Number) {
    await this.Trip.findByIdAndUpdate(tripId, {
      $pull: { bookedSeats: seatNumber },
    }).exec();
  }

  /**
   * Updates the status of a trip.
   * @param tripId - The ID of the trip to update.
   */
  public async updateTripStatus(tripId: string, status) {
    if (status !== 'canceled') {
      await this.Trip.findByIdAndUpdate(tripId, { status: 'completed' }).exec();
    }
  }

  /**
   * Updates the rating of a trip based on the provided reviews.
   * If there are no reviews, the rating is set to 0.
   *
   * @param {string} tripId - The ID of the trip to update.
   * @param {Array<object>} reviews - The array of reviews for the trip.
   * @returns {Promise<void>} - A promise that resolves when the update is complete.
   */
  public async updateTripRating(tripId: string, reviews) {
    if (reviews.length === 0) {
      await this.Trip.findOneAndUpdate(
        { _id: tripId },
        { $set: { ratings: 0 } },
        { new: true }
      ).exec();
      return;
    }

    const ratingSum = reviews.reduce((acc, review) => acc + review.ratings, 0);
    const ratingAvg = (ratingSum / reviews.length).toFixed(1);

    await this.Trip.findOneAndUpdate(
      { _id: tripId },
      { $set: { ratings: ratingAvg } },
      { new: true }
    ).exec();
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

  schema = this.commonService.getMongoose().Schema;

  tripSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      departureCity: {
        type: this.schema.Types.String,
        ref: this.commonService.getOrCreateModel('City'),
        required: true,
        validate: {
          validator: this.citiesService.validateDepartureCity,
          message: 'Departure city does not exist',
        },
      },
      arrivalCity: {
        type: this.schema.Types.String,
        ref: this.commonService.getOrCreateModel('City'),
        required: true,
        validate: [
          {
            validator: this.citiesService.validateArrivalCity,
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
        ref: this.commonService.getOrCreateModel('Bus'),
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
