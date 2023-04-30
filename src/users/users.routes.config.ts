import express from 'express';
import { body } from 'express-validator';

import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import { CommonRoutesConfig } from '../common/common.routes.config';
import usersController from './controllers/users.controller';
import usersMiddleware from './middleware/users.middleware';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import permissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/middleware/common.permissionflag.enum';

export class UsersRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'UsersRoutes');
  }

  configureRoutes(): express.Application {
    this.app
      .route('/users')
      .get(
        jwtMiddleware.checkValidToken,
        permissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        usersController.listUsers
      )
      .post(
        body('email').isEmail(),
        body('password')
          .isLength({ min: 5 })
          .withMessage('Must include password (5+ characters)'),
        bodyValidationMiddleware.verifyBodyFieldsError,
        usersMiddleware.validateSameEmailDoesntExist,
        usersController.createUser
      );

    this.app.param(`userId`, usersMiddleware.extractUserId);

    this.app
      .route('/users/:userId')
      .all(
        usersMiddleware.validateUserExists,
        jwtMiddleware.checkValidToken,
        permissionMiddleware.onlySameUserOrAdminCanAccess
      )
      .get(usersController.getUserById)
      .delete(usersController.removeUser);

    this.app.put('/users/:userId', [
      body('email').isEmail(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Must include password (5+ characters)'),
      body('firstName').isString(),
      body('lastName').isString(),
      body('permissionFlags').isInt(),
      bodyValidationMiddleware.verifyBodyFieldsError,
      usersMiddleware.validateSameEmailBelongToSameUser,
      usersMiddleware.userCannotChangePermission,
      usersController.put,
    ]);

    this.app.patch('/users/:userId', [
      body('email').isEmail().optional(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Password must be 5+ characters')
        .optional(),
      body('firstName').isString().optional(),
      body('lastName').isString().optional(),
      body('permissionFlags').isInt().optional(),
      bodyValidationMiddleware.verifyBodyFieldsError,
      usersMiddleware.validatePatchEmail,
      usersMiddleware.userCannotChangePermission,
      usersController.patch,
    ]);

    return this.app;
  }
}
