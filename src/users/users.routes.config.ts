import express from 'express';
import { body } from 'express-validator';

import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import { CommonRoutesConfig } from '../common/common.routes.config';
import usersController from './controllers/users.controller';
import usersMiddleware from './middleware/users.middleware';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import commonPermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import authController from '../auth/controllers/auth.controller';
import imageUpdateMiddleware from '../common/middleware/image.update.middleware';

export class UsersRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'UsersRoutes');
  }

  configureRoutes(): express.Application {
    this.app
      .route('/v1/users')
      .get(
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        usersController.listUsers
      )
      .post(
        body('email').isEmail(),
        body('password')
          .isLength({ min: 5 })
          .withMessage('Must include password (5+ characters)'),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'id',
          'email',
          'password',
          'firstName',
          'lastName',
          'image',
        ]),
        usersMiddleware.validateSameEmailDoesntExist,
        usersController.createUser
      );

    this.app.param(`userId`, usersMiddleware.extractUserId);

    this.app
      .route('/v1/users/:userId')
      .all(
        usersMiddleware.validateUserExists,
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.onlySameUserOrAdminCanAccess
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
      bodyValidationMiddleware.verifyBodyFieldsError([
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'image',
        'permissionFlags',
      ]),
      usersMiddleware.validatePatchEmail,
      usersMiddleware.userCannotChangePermission,
      imageUpdateMiddleware.updateImage('user'),
      usersController.patchUser,
    ]);

    this.app.patch('/v1/users/:userId/permissionFlags/:permissionFlags', [
      jwtMiddleware.checkValidToken,
      commonPermissionMiddleware.onlySameUserOrAdminCanAccess, // TODO: check the case where admin elevate another user to admin
      usersMiddleware.pathchPermissionFlags,
      jwtMiddleware.getPermissionsAndId,
      authController.logIn,
    ]);

    return this.app;
  }
}
