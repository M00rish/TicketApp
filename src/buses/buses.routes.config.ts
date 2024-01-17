import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import { imageUpdateMiddleware } from '../common/middlewares/image.update.middleware';
import permissionMiddleware from '../common/middlewares/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import { BodyValidationMiddleware } from '../common/middlewares/body.validation.middleware';
import busesController from './controllers/buses.controller';

export class BusesRoutes extends CommonRoutesConfig {
  private jwtMiddleware;
  private permissionMiddleware;
  private bodyValidationMiddleware;
  private imageUpdateMiddleware;
  private busesController;

  constructor(app: express.Application) {
    super(app, 'busesRoutes');

    this.jwtMiddleware = jwtMiddleware;
    this.permissionMiddleware = permissionMiddleware;
    this.bodyValidationMiddleware = BodyValidationMiddleware;
    this.imageUpdateMiddleware = imageUpdateMiddleware;
    this.busesController = busesController;
  }

  configureRoutes() {
    this.app
      .route(`/v1/buses`)
      .all(this.jwtMiddleware.checkValidToken)
      .get(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        this.busesController.listBuses
      )
      .post(
        body('busModel')
          .exists()
          .withMessage('Bus Model is required')
          .trim()
          .escape()
          .matches(/^[A-Za-z0-9]+$/),
        body('seats')
          .exists()
          .withMessage('seat number is required')
          .trim()
          .escape()
          .matches(/^[0-9]+$/),
        body('busType').optional().trim().escape().isString(),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'busModel',
          'seats',
          'image',
          'busType',
        ]),
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.busesController.addBus
      );

    this.app
      .route(`/v1/buses/:busId`)
      .all(this.jwtMiddleware.checkValidToken)
      .get(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        this.busesController.getBusById
      )
      .patch(
        body('busModel')
          .optional()
          .trim()
          .escape()
          .matches(/^[A-Za-z0-9]+$/)
          .withMessage('Bus Model must only contain letters and numbers'),
        body('seats')
          .optional()
          .trim()
          .escape()
          .matches(/^[0-9]+$/)
          .withMessage('seat number must only contain numbers'),
        body('busType').optional().trim().escape().isString(),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'busModel',
          'seats',
          'image',
          'busType',
        ]),
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.imageUpdateMiddleware.updateImage('bus'),
        this.busesController.updateBus
      )
      .delete(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.busesController.deleteBus
      );

    return this.app;
  }
}
