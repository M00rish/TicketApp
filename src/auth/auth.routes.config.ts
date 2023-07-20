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
    this.app.post('/v1/login', [
      body('email').isEmail(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Must include password (5+ characters)'),
      bodyValidationMiddleware.verifyBodyFieldsError,
      authMiddleware.verifyUserPassword,
      authController.logIn,
    ]);

    this.app.get('/v1/logout', [
      jwtMiddleware.checkValidToken,
      authController.logOut,
    ]);

    this.app.post('/v1/refresh-token', [
      jwtMiddleware.rateLimitRefreshTokenRequests,
      jwtMiddleware.checkValidToken,
      jwtMiddleware.checkValidRefreshToken,
      jwtMiddleware.perpareBody,
      authController.logIn,
    ]);

    return this.app;
  }
}
