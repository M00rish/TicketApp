import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import authController from './controllers/auth.controller';
import authMiddleware from './middleware/auth.middleware';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import jwtMiddleware from './middleware/jwt.middleware';

export class AuthRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'AuthRoutes');
  }

  configureRoutes(): express.Application {
    this.app.post('/login', [
      body('email').isEmail(),
      body('password').isString(),
      bodyValidationMiddleware.verifyBodyFieldsError,
      authMiddleware.verifyUserPassword,
      authController.logIn,
    ]);

    this.app.get('/logout', [
      jwtMiddleware.checkValidToken,
      authController.logOut,
    ]);

    this.app.post('/refresh-token', [
      jwtMiddleware.rateLimitRefreshTokenRequests,
      jwtMiddleware.checkValidToken,
      jwtMiddleware.checkValidRefreshToken,
      authController.logIn,
    ]);

    return this.app;
  }
}
