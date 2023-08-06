import express from 'express';

import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import commonPermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import tripsController from './controllers/trips.controller';
import { body } from 'express-validator';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class TripsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'TripsRoutes');
  }

  configureRoutes(): express.Application {
    this.app
      .route(`/v1/trips`)
      .all(jwtMiddleware.checkValidToken)
      .get([
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        tripsController.listTrips,
      ])
      .post([
        body('startCity').isString(),
        body('finishCity').isString(),
        body('startDate').isString(),
        body('finishDate').isString(),
        body('price').isNumeric(),
        body('seats').isNumeric(),
        body('busId').isString(),
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'startCity',
          'finishCity',
          'startDate',
          'finishDate',
          'price',
          'seats',
          'busId',
        ]),
        tripsController.createTrip,
      ]);

    this.app
      .route(`/v1/trips/:tripId`)
      .all([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
      ])
      .get(tripsController.getTripById)
      .delete([
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        tripsController.removeTripById,
      ]);

    this.app.patch(`/v1/trips/:tripId`, [
      body('startCity').isString().optional(),
      body('finishCity').isString().optional(),
      body('startDate').isDate().optional(),
      body('finishDate').isDate().optional(),
      body('price').isNumeric().optional(),
      body('seats').isNumeric().optional(),
      body('busId').isString().optional(),
      commonPermissionMiddleware.permissionsFlagsRequired(
        permissionsFlags.ADMIN | permissionsFlags.TRIP_GUIDE
      ),
      bodyValidationMiddleware.verifyBodyFieldsError([
        'startCity',
        'finishCity',
        'startDate',
        'finishDate',
        'price',
        'seats',
        'busId',
      ]),
      tripsController.patchTripById,
    ]);

    this.app.put(`/v1/trips/search`, []); // TODO

    return this.app;
  }
}
