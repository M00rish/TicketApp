import express from 'express';
import { body } from 'express-validator';

import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import { CommonRoutesConfig } from '../common/common.routes.config';
import usersController from './controllers/users.controller';
import usersMiddleware from './middleware/users.middleware';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import permissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import authController from '../auth/controllers/auth.controller';

export class UsersRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'UsersRoutes');
  }

  configureRoutes(): express.Application {
    this.app
      .route('/v1/users')
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
      .route('/v1/users/:userId')
      .all(
        usersMiddleware.validateUserExists,
        jwtMiddleware.checkValidToken,
        permissionMiddleware.onlySameUserOrAdminCanAccess
      )
      .get(usersController.getUserById)
      .delete(usersController.removeUser);

    this.app.patch('/v1/users/:userId', [
      body('email').isEmail().optional(),
      body('password')
        .isLength({ min: 5 })
        .withMessage('Password must be 5+ characters')
        .optional(),
      body('firstName').isString().optional(),
      body('lastName').isString().optional(),
      bodyValidationMiddleware.verifyBodyFieldsError,
      usersMiddleware.validatePatchEmail,
      usersMiddleware.userCannotChangePermission,
      usersMiddleware.updateUserPhoto,
      usersController.patchUser,
    ]);

    this.app.patch('/v1/users/:userId/permissionFlags/:permissionFlags', [
      jwtMiddleware.checkValidToken,
      permissionMiddleware.onlySameUserOrAdminCanAccess,
      usersMiddleware.pathchPermissionFlags,
      jwtMiddleware.getPermissionsAndId,
      authController.logIn,
    ]);

    return this.app;
  }
}
