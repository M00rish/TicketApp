import debug from 'debug';
import express from 'express';

import { BusesService } from '../services/buses.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:bus-controller');

class BusesController {
  constructor(private busesService: BusesService) {
    log('Created new instance of BusesController');

    this.listBuses = this.listBuses.bind(this);
    this.getBusById = this.getBusById.bind(this);
    this.addBus = this.addBus.bind(this);
    this.updateBus = this.updateBus.bind(this);
    this.deleteBus = this.deleteBus.bind(this);
  }

  /**
   * Retrieves a list of buses.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async listBuses(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const buses = await this.busesService.list(100, 0);
      res.status(HttpStatusCode.Ok).json(buses);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieves a bus by its ID.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  async getBusById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const busId = req.params.busId;
    try {
      const bus = await this.busesService.getById(busId);
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
      next(error);
    }
  }

  /**
   * Adds a new bus.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   * @returns A Promise that resolves to the ID of the created bus.
   */
  async addBus(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const busId = await this.busesService.create(req.body);
      res.status(HttpStatusCode.Created).json({ _id: busId });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Updates a bus by its ID.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   * @returns A JSON response with the updated bus ID.
   */
  async updateBus(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const busId = req.params.busId;
    try {
      const bus = await this.busesService.updateById(busId, req.body);
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
      next(error);
    }
  }

  /**
   * Deletes a bus by its ID.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async deleteBus(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const busId = req.params.busId;
    try {
      await this.busesService.deleteById(busId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      next(error);
    }
  }
}

export { BusesController };
