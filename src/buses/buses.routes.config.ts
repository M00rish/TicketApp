import express from 'express';
import { body } from 'express-validator';
import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import busesController from './controllers/buses.controller';
import imageUpdateMiddleware from '../common/middleware/image.update.middleware';
import PermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class BusesRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'busesRoutes');
  }

  configureRoutes() {
    this.app
      .route(`/v1/buses`)
      .all(jwtMiddleware.checkValidToken)
      .get(
        PermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        busesController.listBuses
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
        bodyValidationMiddleware.verifyBodyFieldsError([
          'busModel',
          'seats',
          'image',
          'busType',
        ]),
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        busesController.addBus
      );

    this.app
      .route(`/v1/buses/:busId`)
      .all(jwtMiddleware.checkValidToken)
      .get(
        PermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        busesController.getBusById
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
        bodyValidationMiddleware.verifyBodyFieldsError([
          'busModel',
          'seats',
          'image',
          'busType',
        ]),
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        imageUpdateMiddleware.updateImage('bus'),
        busesController.updateBus
      )
      .delete(
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        busesController.deleteBus
      );

    return this.app;
  }
}
