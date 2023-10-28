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
      res.status(HttpStatusCode.Ok).json(trips);
    } catch (error: any) {
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
      const trip = await tripsService.getById(tripId);
      res.status(HttpStatusCode.Ok).json(trip);
    } catch (error: any) {
      next(error);
    }
  }

  async createTrip(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const tripId = await tripsService.create(req.body);
      return res.status(201).json({ _id: tripId });
    } catch (error: any) {
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
        const errorMessage = `you're not allowed to change the following fields:${
          req.body.duration ? ' duration ' : ''
        }${req.body.ratings ? 'ratings ' : ''}${
          req.body.bookedSeats ? 'bookedSeats' : ''
        }`;

        const error = new AppError(
          true,
          'patchTripError',
          HttpStatusCode.BadRequest,
          errorMessage
        );
        return next(error);
      }

      await tripsService.updateById(tripId, req.body);
      res.status(200).json({ _id: tripId });
    } catch (error: any) {
      next(error);
    }
  }

  async deleteTripById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      await tripsService.deleteById(tripId);
      res.status(204).json();
    } catch (error: any) {
      next(error);
    }
  }

  async deleteAllTrips(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await tripsService.deleteAll();
      res.status(204).json();
    } catch (error: any) {
      next(error);
    }
  }
}

export default new TripsController();
