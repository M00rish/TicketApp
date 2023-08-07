import express from 'express';
import { body } from 'express-validator';
import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import busesController from './controllers/buses.controller';
import imageUpdateMiddleware from '../common/middleware/image.update.middleware';
import commonPermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class BusesRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'busesRoutes');
  }

  configureRoutes() {
    this.app
      .route(`/v1/buses`)
      .all(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get([busesController.listBuses])
      .post([
        body('busModel').isString(),
        body('seats').isNumeric(),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'busModel',
          'seats',
          'image',
          'busType',
        ]),
        busesController.addBus,
      ]);

    this.app
      .route(`/v1/buses/:busId`)
      .all(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get(busesController.getBusById)
      .patch([
        body('busModel').isString().optional(),
        body('seats').isNumeric().optional(),
        body('image').isNumeric().optional(),
        body('busType').isNumeric().optional(),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'busModel',
          'seats',
          'image',
          'busType',
        ]),
        imageUpdateMiddleware.updateImage('bus'),
        busesController.updateBus,
      ])
      .delete([busesController.deleteBus]);

    return this.app;
  }
}
