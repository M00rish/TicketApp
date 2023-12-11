import express from 'express';

import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import PermissionMiddleware from '../common/middleware/common.permission.middleware';
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
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.USER),
        tripsController.listTrips,
      ])
      .post([
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        body('departureCity').isString(),
        body('arrivalCity').isString(),
        body('departureTime').isString(),
        body('arrivalTime').isString(),
        body('price').isNumeric(),
        body('busId').isString(),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'departureCity',
          'arrivalCity',
          'departureTime',
          'arrivalTime',
          'price',
          'busId',
        ]),
        tripsController.createTrip,
      ])
      .delete([
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        tripsController.deleteAllTrips,
      ]);

    this.app
      .route(`/v1/trips/:tripId`)
      .all([jwtMiddleware.checkValidToken])
      .get(tripsController.getTripById)
      .delete([
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        tripsController.deleteTripById,
      ])
      .patch([
        PermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        body('departureCity').isString().optional(),
        body('arrivalCity').isString().optional(),
        body('departureTime').isString().optional(),
        body('arrivalTime').isString().optional(),
        body('price').isNumeric().optional(),
        body('busId').isString().optional(),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'departureCity',
          'arrivalCity',
          'departureTime',
          'arrivalTime',
          'price',
          'busId',
        ]),
        tripsController.patchTripById,
      ]);

    this.app.post(`/v1/trips/search`, []); // TODO

    return this.app;
  }
}
