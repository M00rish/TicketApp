import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';
import { inject, injectable } from 'inversify';

import { UsersService } from '../../users/services/users.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:Auth-Middlware');

class AuthMiddlware {
  /**
   * Creates a new instance of AuthMiddleware.
   * @param usersService The UsersService instance.
   */
  constructor(private usersService: UsersService) {
    log('Created new instance of AuthMiddlware');

    this.verifyUserPassword = this.verifyUserPassword.bind(this);
  }

  /**
   * Verifies the user's password and sets the request body with the user's ID and permission flags if the password is correct.
   * Otherwise, it throws an error indicating invalid email or password.
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The next middleware function.
   */
  public async verifyUserPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user: any = await this.usersService.getUserByEmailWithPassword(
        req.body.email
      );

      if (user && user.password) {
        const hashPassowrd = user.password;

        if (bcrypt.compareSync(req.body.password, hashPassowrd)) {
          req.body = {
            userId: user._id,
            refreshToken: user.refreshToken,
            permissionFlags: user.permissionFlags,
          };
          return next();
        }
      }
    } catch (error: any) {
      return next(error);
    }
  }
}

export { AuthMiddlware };
