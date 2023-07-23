import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../../users/services/users.service';
import AppError from '../../common/types/appError';

const log: debug.IDebugger = debug('app:Auth-Middlware');

class AuthMiddlware {
  async verifyUserPassword(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
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
      400,
      'Invalid email and/or password'
    );

    next(error);
  }
}

export default new AuthMiddlware();
