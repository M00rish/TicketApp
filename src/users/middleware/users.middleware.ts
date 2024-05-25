import express from 'express';
import debug from 'debug';

import { injectable, inject } from 'inversify';
import { UsersService } from '../services/users.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:Users-Middleware');

class UsersMiddleware {
  constructor(private usersService: UsersService) {
    this.usersService = usersService;
    this.validateSameEmailDoesntExist =
      this.validateSameEmailDoesntExist.bind(this);
    this.validatePatchEmail = this.validatePatchEmail.bind(this);
    this.extractUserId = this.extractUserId.bind(this);
    this.userCannotChangePermission =
      this.userCannotChangePermission.bind(this);
    log('Created new instance of UsersMiddleware');
  }

  /**
   * Validates that the same email doesn't already exist in the database.
   * If the email doesn't exist, the middleware calls the next function.
   * If the email exists, it throws an error with the message 'user email already exist'.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  public async validateSameEmailDoesntExist(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await this.usersService.getUserByEmail(req.body.email);

      if (user.email)
        throw new AppError(
          true,
          'EmailValidationError',
          HttpStatusCode.BadRequest,
          'user email already exist'
        );
    } catch (error) {
      if (
        error instanceof AppError &&
        error.name === 'RessourceNotFoundError'
      ) {
        return next();
      }

      return next(error);
    }
  }

  /**
   * Validates the patch email request.
   * If the request body contains an email, it calls the validateSameEmailBelongToSameUser function.
   * Otherwise, it calls the next middleware function.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  public validatePatchEmail = (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body.email) {
      this.validateSameEmailDoesntExist(req, res, next);
    } else {
      next();
    }
  };

  /**
   * Middleware function to extract the user ID from the request parameters and assign it to the request body.
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @param next - The next middleware function.
   */
  public extractUserId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    req.body.id = req.params.userId;
    next();
  }

  /**
   * Middleware function to check if the user can change permissions.
   * If the user tries to change the permissionFlags and it's different from the current user's permissionFlags,
   * it throws an error indicating that the user cannot change permissions.
   * Otherwise, it calls the next middleware function.
   *
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @param next - The next middleware function.
   */
  public userCannotChangePermission(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (
      'permissionFlags' in req.body &&
      req.body.permissionFlags != res.locals.jwt.permissionFlags
    ) {
      const error = new AppError(
        true,
        'PermissionFlagsError',
        HttpStatusCode.Forbidden,
        'you cannot change permissions'
      );
      next(error);
    } else {
      next();
    }
  }
}

export { UsersMiddleware };
