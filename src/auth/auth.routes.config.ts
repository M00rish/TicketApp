import express from 'express';
import { body } from 'express-validator';

import { BodyValidationMiddleware } from '../common/middlewares/body.validation.middleware';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { TYPES } from '../ioc/types';
import authMiddlware from './middleware/auth.middleware';
import authController from './controllers/auth.controller';
import jwtMiddleware from './middleware/jwt.middleware';

export class AuthRoutes extends CommonRoutesConfig {
  private authMiddleware;
  private authController;
  private jwtMiddleware;
  private bodyValidationMiddleware;

  constructor(app: express.Application) {
    super(app, 'AuthRoutes');

    this.authMiddleware = authMiddlware;
    this.authController = authController;
    this.jwtMiddleware = jwtMiddleware;
    this.bodyValidationMiddleware = BodyValidationMiddleware;
  }

  configureRoutes(): express.Application {
    this.app.post('/v1/login', [
      body('email').isEmail(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Must include password (5+ characters)'),
      this.bodyValidationMiddleware.verifyBodyFieldsError([
        'email',
        'password',
      ]),
      this.authMiddleware.verifyUserPassword,
      this.authController.logIn,
    ]);

    this.app.get('/v1/logout', [
      this.jwtMiddleware.checkValidToken,
      this.authController.logOut,
    ]);

    this.app.post('/v1/refresh-token', [
      // this.jwtMiddleware.rateLimitRefreshTokenRequests,
      this.jwtMiddleware.checkValidToken,
      this.jwtMiddleware.checkValidRefreshToken,
      this.jwtMiddleware.prepareBody,
      this.authController.logIn,
    ]);

    return this.app;
  }
}
