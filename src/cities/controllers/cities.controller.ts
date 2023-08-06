import debug from 'debug';
import express from 'express';

import citiesService from '../services/cities.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:city-controller');

class cityController {
  async listcities(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const cities = await citiesService.list(100, 0);
      res.status(HttpStatusCode.Ok).json(cities);
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'listcities_Error',
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

  async getcityById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const cityId = req.params.cityId;
    try {
      const city = await citiesService.readById(cityId);
      if (!city) {
        const error = new AppError(
          false,
          'getcityById_Error',
          HttpStatusCode.NotFound,
          'city not found'
        );
        return next(error);
      }
      res.status(HttpStatusCode.Ok).json(city);
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'getcityById_Error',
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

  async addcity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const cityId = await citiesService.create(req.body);
      res.status(HttpStatusCode.Created).json({ _id: cityId });
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'createcity_Error',
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

  async updatecity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const cityId = req.params.cityId;
    try {
      const city = await citiesService.patchById(cityId, req.body);
      if (!city) {
        const error = new AppError(
          false,
          'updatecity_Error',
          HttpStatusCode.NotFound,
          'city not found'
        );
        return next(error);
      }
      res.status(HttpStatusCode.Ok).json({ _id: city });
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'updatecity_Error',
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

  async deletecity(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const cityId = req.params.cityId;
    try {
      await citiesService.deleteById(cityId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      if (error instanceof AppError) {
        error = new AppError(
          false,
          'deletecity_Error',
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

export default new cityController();
