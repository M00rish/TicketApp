import debug from 'debug';
import express from 'express';

import busesService from '../services/buses.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:bus-controller');

class BusController {
  async listBuses(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const buses = await busesService.list(100, 0);
      res.status(HttpStatusCode.Ok).json(buses);
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'listBuses_Error',
          HttpStatusCode.BadRequest,
          error.message
        );
        next(error);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async getBusById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const busId = req.params.busId;
    try {
      const bus = await busesService.getById(busId);
      if (!bus) {
        const error = new AppError(
          false,
          'getBusById_Error',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
        return next(error);
      }
      res.status(HttpStatusCode.Ok).json(bus);
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'getBusById_Error',
          HttpStatusCode.BadRequest,
          error.message
        );
        next(error);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async addBus(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const busId = await busesService.create(req.body);
      res.status(HttpStatusCode.Created).json({ _id: busId });
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'createBus_Error',
          HttpStatusCode.BadRequest,
          error.message
        );
        next(error);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async updateBus(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const busId = req.params.busId;
    try {
      const bus = await busesService.updateById(busId, req.body);
      if (!bus) {
        const error = new AppError(
          false,
          'updateBus_Error',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
        return next(error);
      }
      res.status(HttpStatusCode.Ok).json({ _id: bus });
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'updateBus_Error',
          HttpStatusCode.BadRequest,
          error.message
        );
        next(error);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async deleteBus(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const busId = req.params.busId;
    try {
      await busesService.deleteById(busId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'deleteBus_Error',
          HttpStatusCode.BadRequest,
          error.message
        );
        next(error);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }
}

export default new BusController();
