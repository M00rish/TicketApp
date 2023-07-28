import debug from 'debug';
import express from 'express';

import tripsService from '../services/trips.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:trips-controller');

class TripsController {
  async listTrips(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const trips = await tripsService.list(100, 0);
      res.status(200).json(trips);
    } catch (error: any) {
      error = new AppError(
        false,
        'listTrips_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async getTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      const trip = await tripsService.readById(tripId);
      if (!trip) {
        const error = new AppError(
          false,
          'getTripById_Error',
          HttpStatusCode.NotFound,
          'Trip not found'
        );
        return next(error);
      }
      res.status(200).json(trip);
    } catch (error: any) {
      error = new AppError(
        false,
        'getTripById_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async createTrip(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const tripId: string = await tripsService.create(req.body);
      res.status(201).json({ _id: tripId });
    } catch (error: any) {
      error = new AppError(
        false,
        'createTrip_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async patchTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      if (req.body.duration || req.body.ratings || req.body.bookedSeats) {
        const error = new AppError(
          true,
          'patchTripById_Error',
          HttpStatusCode.BadRequest,
          `you're not allowed to change the following fields:${
            req.body.duration ? ' duration ' : ''
          }${req.body.ratings ? 'ratings ' : ''}${
            req.body.bookedSeats ? 'bookedSeats' : ''
          }`
        );
        return next(error);
      }
      const trip = await tripsService.patchById(tripId, req.body);
      if (!trip) {
        const error = new AppError(
          false,
          'patchTripById_Error',
          HttpStatusCode.NotFound,
          'Trip not found'
        );
        return next(error);
      }

      res.status(200).json(trip);
    } catch (error: any) {
      error = new AppError(
        false,
        'updateTripById_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async removeTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      await tripsService.deleteById(tripId);
      res.status(200).json('trip deleted');
    } catch (error: any) {
      error = new AppError(
        false,
        'deleteTripById_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }
}

export default new TripsController();
