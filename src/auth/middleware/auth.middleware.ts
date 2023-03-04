import express from 'express';
import * as argon from 'argon2';
import usersService from '../../users/services/users.service';
import debug from 'debug';

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

    log(user);

    if (user) {
      const hashPassowrd = user.password;
      if (await argon.verify(hashPassowrd, req.body.password)) {
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
