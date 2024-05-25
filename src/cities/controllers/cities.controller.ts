import debug from 'debug';
import express from 'express';

import { CitiesService } from '../services/cities.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:City-controller');

class CitiesController {
  constructor(private CitiesService: CitiesService) {
    log('Created new instance of CitiesController');

    this.listCities = this.listCities.bind(this);
    this.getCityById = this.getCityById.bind(this);
    this.addCity = this.addCity.bind(this);
    this.updateCity = this.updateCity.bind(this);
    this.deleteCity = this.deleteCity.bind(this);
  }

  /**
   * Retrieves a list of Cities.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async listCities(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const Cities = await this.CitiesService.list(100, 0);
      res.status(HttpStatusCode.Ok).json(Cities);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieves a City by its ID.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async getCityById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const CityId = req.params.cityId;

    try {
      const City = await this.CitiesService.getById(CityId);
      res.status(HttpStatusCode.Ok).json(City);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Adds a new City.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async addCity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const CityId = await this.CitiesService.create(req.body);
      res.status(HttpStatusCode.Created).json({ _id: CityId });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Updates a City by its ID.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async updateCity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const CityId = req.params.cityId;
    try {
      const City = await this.CitiesService.updateById(CityId, req.body);
      res.status(HttpStatusCode.Ok).json({ _id: City });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Deletes a city by its ID.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  async deleteCity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const CityId = req.params.cityId;
    try {
      await this.CitiesService.deleteById(CityId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      next(error);
    }
  }
}

export { CitiesController };
