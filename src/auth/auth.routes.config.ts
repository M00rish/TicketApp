import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import authController from './controllers/auth.controller';
import authMiddleware from './middleware/auth.middleware';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class AuthRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'AuthRoutes');
  }

  configureRoutes(): express.Application {
    this.app.post('/auth', [
      body('email').isEmail(),
      body('password').isString(),
      bodyValidationMiddleware.verifyBodyFieldsError,
      authMiddleware.verifyUserPassword,
      authController.createJWT,
    ]);

    return this.app;
  }
}
