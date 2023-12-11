import express from 'express';
import { body } from 'express-validator';

import BodyValidationMiddleware from '../common/middleware/body.validation.middleware';
import { CommonRoutesConfig } from '../common/common.routes.config';
import usersController from './controllers/users.controller';
import usersMiddleware from './middleware/users.middleware';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import PermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
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
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        usersController.listUsers
      )
      .post(
        body('firstName')
          .exists()
          .withMessage('First Name is required')
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('First name must only contain letters'),
        body('lastName')
          .exists()
          .withMessage('Last Name is required')
          .trim()
          .escape()
          .matches(/^[A-Za-z]+$/)
          .withMessage('Last name must only contain letters'),
        body('email')
          .exists()
          .withMessage('Email is required')
          .trim()
          .escape()
          .isEmail(),
        body('password')
          .exists()
          .withMessage('password is required')
          .trim()
          .escape()
          .isLength({ min: 5 })
          .withMessage('Must include password (5+ characters)'),
        BodyValidationMiddleware.verifyBodyFieldsError([
          'email',
          'password',
          'firstName',
          'lastName',
        ]),
        usersMiddleware.validateSameEmailDoesntExist,
        usersController.createUser
      )
      .delete(
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        usersController.deleteAllUsers
      );

    this.app.param(`userId`, usersMiddleware.extractUserId);

    this.app
      .route('/v1/users/:userId')
      .all(jwtMiddleware.checkValidToken)
      .get(
        PermissionMiddleware.onlySameUserOrAdminCanAccess,
        usersController.getUserById
      )
      .delete(
        PermissionMiddleware.onlySameUserOrAdminCanAccess,
        usersController.deleteUser
      );

    this.app.patch(
      '/v1/users/:userId',
      body('email').optional().isEmail().normalizeEmail().trim().escape(),
      body('password')
        .optional()
        .isLength({ min: 5 })
        .withMessage('Password must be 5+ characters')
        .trim()
        .escape(),
      body('firstName')
        .optional()
        .trim()
        .escape()
        .matches(/^[A-Za-z]+$/)
        .withMessage('First name must only contain letters'),
      body('lastName')
        .optional()
        .trim()
        .escape()
        .matches(/^[A-Za-z]+$/)
        .withMessage('Last name must only contain letters'),
      BodyValidationMiddleware.verifyBodyFieldsError([
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'image',
      ]),
      PermissionMiddleware.onlySameUserOrAdminCanAccess,
      usersMiddleware.validatePatchEmail,
      usersMiddleware.userCannotChangePermission,
      imageUpdateMiddleware.updateImage('user'), //TODO: wrong field names are not handled when sent through the form
      usersController.patchUserById
    );

    this.app.patch('/v1/users/:userId/permissionFlags/:permissionFlags', [
      jwtMiddleware.checkValidToken,
      PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
      usersController.patchPermissionFlags,
    ]);

    return this.app;
  }
}
