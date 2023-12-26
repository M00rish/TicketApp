import express from 'express';
import { body } from 'express-validator';
import { container } from '../ioc/inversify.config';

import { CommonRoutesConfig } from '../common/common.routes.config';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { BodyValidationMiddleware } from '../common/middlewares/body.validation.middleware';
import { PermissionMiddleware } from '../common/middlewares/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import { TripsController } from './controllers/trips.controller';

export class TripsRoutes extends CommonRoutesConfig {
  private tripsController;
  private jwtMiddleware;
  private permissionMiddleware;
  private bodyValidationMiddleware;

  constructor(app: express.Application) {
    super(app, 'TripsRoutes');

    this.tripsController = container.resolve(TripsController);
    this.jwtMiddleware = container.resolve(JwtMiddleware);
    this.permissionMiddleware = container.resolve(PermissionMiddleware);
    this.bodyValidationMiddleware = container.resolve(BodyValidationMiddleware);
  }

  configureRoutes(): express.Application {
    this.app
      .route(`/v1/trips`)
      .all(this.jwtMiddleware.checkValidToken)
      .get(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        this.tripsController.listTrips
      )
      .post(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        body('departureCity')
          .exists()
          .withMessage('departureCity is required')
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('departureCity must only contain letters'),
        body('arrivalCity')
          .exists()
          .withMessage('arrivalCity is required')
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('arrivalCity must only contain letters'),
        body('departureTime')
          .exists()
          .withMessage('departureTime is required')
          .trim()
          .escape()
          .matches(
            /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/
          )
          .withMessage(
            'departureTime must be in format YYYY-MM-DDTHH:mm:ss.SSSZ'
          ),
        body('arrivalTime')
          .exists()
          .withMessage('arrivalTime is required')
          .trim()
          .escape()
          .matches(
            /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/
          )
          .withMessage(
            'arrivalTime must be in format YYYY-MM-DDTHH:mm:ss.SSSZ'
          ),
        body('price')
          .exists()
          .withMessage('price is required')
          .trim()
          .escape()
          .matches(/^[0-9]+$/)
          .withMessage('price must only contain numbers'),
        body('busId')
          .exists()
          .withMessage('busId is required')
          .matches(/^[A-Za-z0-9]+$/)
          .withMessage('busId must only contain numbers and letters'),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'departureCity',
          'arrivalCity',
          'departureTime',
          'arrivalTime',
          'price',
          'busId',
        ]),
        this.tripsController.createTrip
      );
    // .delete(
    //   this.permissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
    //   this.tripsController.deleteAllTrips
    // );

    this.app
      .route(`/v1/trips/:tripId`)
      .all(this.jwtMiddleware.checkValidToken)
      .get(this.tripsController.getTripById)
      .delete(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.tripsController.deleteTripById
      )
      .patch(
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.TRIP_GUIDE
        ),
        body('departureCity')
          .optional()
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('departureCity must only contain letters'),
        body('arrivalCity')
          .optional()
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('arrivalCity must only contain letters'),
        body('departureTime')
          .optional()
          .trim()
          .escape()
          .matches(
            /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/
          )
          .withMessage(
            'arrivalTime must be in format YYYY-MM-DDTHH:mm:ss.SSSZ'
          ),
        body('arrivalTime')
          .optional()
          .trim()
          .escape()
          .matches(
            /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}\.[0-9]{3}Z$/
          )
          .withMessage(
            'arrivalTime must be in format YYYY-MM-DDTHH:mm:ss.SSSZ'
          ),
        body('price')
          .optional()
          .trim()
          .escape()
          .matches(/^[0-9]+$/)
          .withMessage('price must only contain numbers'),
        body('busId')
          .optional()
          .matches(/^[A-Za-z0-9]+$/)
          .withMessage('busId must only contain numbers and letters'),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'departureCity',
          'arrivalCity',
          'departureTime',
          'arrivalTime',
          'price',
          'busId',
        ]),
        this.tripsController.patchTripById
      );

    this.app.post(`/v1/trips/search`, []); // TODO

    return this.app;
  }
}
