import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import imageUpdateMiddleware from '../common/middlewares/image.update.middleware';
import permissionMiddleware from '../common/middlewares/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import bodyValidationMiddleware from '../common/middlewares/body.validation.middleware';
import citiesController from './controllers/cities.controller';

export class CitiesRoutes extends CommonRoutesConfig {
  private jwtMiddleware;
  private permissionMiddleware;
  private bodyValidationMiddleware;
  private imageUpdateMiddleware;
  private citiesController;

  constructor(app: express.Application) {
    super(app, 'busesRoutes');

    this.jwtMiddleware = jwtMiddleware;
    this.permissionMiddleware = permissionMiddleware;
    this.bodyValidationMiddleware = bodyValidationMiddleware;
    this.imageUpdateMiddleware = imageUpdateMiddleware;
    this.citiesController = citiesController;

    this.configureRoutes();
  }

  configureRoutes() {
    this.app
      .route(`/v1/cities`)
      .all(
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        )
      )
      .get(this.citiesController.listCities)
      .post(
        body('cityName')
          .exists()
          .withMessage('City name is required')
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('First name must only contain letters'),
        body('location.type')
          .exists()
          .withMessage('type location is required')
          .trim()
          .escape()
          .isIn(['Point']),
        body('location.coordinates')
          .exists()
          .withMessage('coordinates are required')
          .isArray({ min: 2, max: 2 })
          .custom(this.bodyValidationMiddleware.validateCoordiantes),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'cityName',
          'location',
        ]),
        this.citiesController.addCity
      );

    this.app
      .route(`/v1/cities/:cityId`)
      .all(this.jwtMiddleware.checkValidToken)
      .get(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        this.citiesController.getCityById
      )
      .patch(
        body('cityName')
          .optional()
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('First name must only contain letters'),
        body('location.type').optional().trim().escape().isIn(['Point']),
        body('location.coordinates')
          .optional()
          .isArray({ min: 2, max: 2 })
          .custom(this.bodyValidationMiddleware.validateCoordiantes)
          .withMessage('Invalid coordinates'),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'cityName',
          'location',
        ]),
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.imageUpdateMiddleware.updateImage('bus'),
        this.citiesController.updateCity
      )
      .delete(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.citiesController.deleteCity
      );

    return this.app;
  }
}
