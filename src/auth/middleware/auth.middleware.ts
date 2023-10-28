import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../../users/services/users.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:Auth-Middlware');

class AuthMiddlware {
  async verifyUserPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    log('verifyUserPassword', req.body.email);
    const user: any = await usersService.getUserByEmailWithPassword(
      req.body.email
    );

    if (user) {
      const hashPassowrd = user.password;

      if (bcrypt.compareSync(req.body.password, hashPassowrd)) {
        req.body = {
          userId: user._id,
          permissionFlags: user.permissionFlags,
        };
        return next();
      }
    }

    const error = new AppError(
      true,
      'LOGIN_ERROR',
      HttpStatusCode.NotFound,
      'Invalid email and/or password'
    );

    next(error);
  }
}

export default new AuthMiddlware();
