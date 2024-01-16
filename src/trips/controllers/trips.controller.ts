import debug from 'debug';
import express from 'express';

import tripsService, { TripsService } from '../services/trips.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:trips-controller');

class TripsController {
  constructor(private tripsService: TripsService) {
    console.log('Created new instance of TripsController');

    // this.tripsService = tripsService;
    this.listTrips = this.listTrips.bind(this);
    this.getTripById = this.getTripById.bind(this);
    this.createTrip = this.createTrip.bind(this);
    this.patchTripById = this.patchTripById.bind(this);
    this.deleteTripById = this.deleteTripById.bind(this);
    this.deleteAllTrips = this.deleteAllTrips.bind(this);
  }

  /**
   * Retrieves a list of trips.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  public async listTrips(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const trips = await this.tripsService.list(100, 0);
      res.status(HttpStatusCode.Ok).json(trips);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieves a trip by its ID.
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  public async getTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      const trip = await this.tripsService.getById(tripId);
      res.status(HttpStatusCode.Ok).json(trip);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Creates a new trip.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   * @returns The trip ID of the newly created trip.
   */
  public async createTrip(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const tripId = await this.tripsService.create(req.body);
      return res.status(201).json({ _id: tripId });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Updates a trip by its ID.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   * @returns A Promise that resolves to void.
   * @throws AppError if the request body contains invalid fields.
   */
  public async patchTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      if (req.body.duration || req.body.ratings || req.body.bookedSeats) {
        const errorMessage = `you're not allowed to change the following fields:${
          req.body.duration ? ' duration ' : ''
        }${req.body.ratings ? 'ratings ' : ''}${
          req.body.bookedSeats ? 'bookedSeats' : ''
        }`;

        const error = new AppError(
          true,
          'InvalidRequestBody',
          HttpStatusCode.BadRequest,
          errorMessage
        );
        return next(error);
      }

      await this.tripsService.updateById(tripId, req.body);
      res.status(200).json({ _id: tripId });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Deletes a trip by its ID.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  public async deleteTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      await this.tripsService.deleteById(tripId);
      res.status(204).json();
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Deletes all trips.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  public async deleteAllTrips(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await this.tripsService.deleteAll();
      res.status(204).json();
    } catch (error: any) {
      next(error);
    }
  }
}

export { TripsController };
export default new TripsController(tripsService);
