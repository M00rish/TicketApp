import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../../users/services/users.service';

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
          email: user.email,
          permissionFlags: user.permissionFlags,
        };
        return next();
      }
    }

    res.status(400).send({ errors: ['Invalid email and/or password'] });
  }
}

export default new AuthMiddlware();
