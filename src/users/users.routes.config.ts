import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';

import BodyValidationMiddleware from '../common/middlewares/body.validation.middleware';
import usersController from './controllers/users.controller';
import usersMiddleware from './middleware/users.middleware';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import permissionMiddleware from '../common/middlewares/common.permission.middleware';
import { imageUpdateMiddleware } from '../common/middlewares/image.update.middleware';

export class UsersRoutes extends CommonRoutesConfig {
  private jwtMiddleware;
  private usersController;
  private usersMiddleware;
  private permissionMiddleware;
  private bodyValidationMiddleware;
  private imageUpdateMiddleware;

  constructor(app: express.Application) {
    super(app, 'UsersRoutes');

    this.jwtMiddleware = jwtMiddleware;
    this.usersController = usersController;
    this.usersMiddleware = usersMiddleware;
    this.permissionMiddleware = permissionMiddleware;
    this.bodyValidationMiddleware = BodyValidationMiddleware;
    this.imageUpdateMiddleware = imageUpdateMiddleware;
  }

  configureRoutes(): express.Application {
    this.app
      .route(`/v1/users`)
      .get(
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.usersController.listUsers
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
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'email',
          'password',
          'firstName',
          'lastName',
        ]),
        this.usersMiddleware.validateSameEmailDoesntExist,
        this.usersController.createUser
      )
      .delete(
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.usersController.deleteAllUsers
      );

    this.app.param(`userId`, this.usersMiddleware.extractUserId);

    this.app
      .route(`/v1/users/:userId`)
      .all(this.jwtMiddleware.checkValidToken)
      .get(
        this.permissionMiddleware.onlySameUserOrAdminCanAccess,
        this.usersController.getUserById
      )
      .delete(
        this.permissionMiddleware.onlySameUserOrAdminCanAccess,
        this.usersController.deleteUser
      );

    this.app.patch(
      `/v1/users/:userId`,
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
      this.bodyValidationMiddleware.verifyBodyFieldsError([
        'id',
        'email',
        'password',
        'firstName',
        'lastName',
        'image',
      ]),
      this.permissionMiddleware.onlySameUserOrAdminCanAccess,
      this.usersMiddleware.validatePatchEmail,
      this.usersMiddleware.userCannotChangePermission,
      this.imageUpdateMiddleware.updateImage('user'), //TODO: wrong field names are not handled when sent through the form
      this.usersController.patchUserById
    );

    this.app.patch(`/v1/users/:userId/permissionFlags/:permissionFlags`, [
      this.jwtMiddleware.checkValidToken,
      this.permissionMiddleware.permissionsFlagsRequired(
        permissionsFlags.ADMIN
      ),
      this.usersController.patchPermissionFlags,
    ]);

    return this.app;
  }
}
