import express from 'express';
import { body } from 'express-validator';
import { CommonRoutesConfig } from '../common/common.routes.config';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import citiesController from './controllers/cities.controller';
import imageUpdateMiddleware from '../common/middleware/image.update.middleware';
import commonPermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class CitiesRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'busesRoutesConfig');
  }

  configureRoutes() {
    this.app
      .route(`/v1/cities`)
      .all(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get([citiesController.listcities])
      .post([
        body('cityName').isString(),
        bodyValidationMiddleware.verifyBodyFieldsError(['cityName']),
        citiesController.addcity,
      ]);

    this.app
      .route(`/v1/cities/:cityId`)
      .all(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        )
      )
      .get(citiesController.getcityById)
      .patch([
        body('cityName').isString().optional(),
        body('location').isString().optional(),
        bodyValidationMiddleware.verifyBodyFieldsError(['cityName']),
        imageUpdateMiddleware.updateImage('bus'),
        citiesController.updatecity,
      ])
      .delete([citiesController.deletecity]);

    return this.app;
  }
}
