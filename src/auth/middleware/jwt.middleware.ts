import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import debug from 'debug';

import usersService from '../../users/services/users.service';
import { Jwt } from '../../common/types/jwt';

const log: debug.IDebugger = debug('app:Jwt-Middlware');

class JwtMiddleware {
  validJwtNeeded(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.headers['authorization']) {
      try {
        const authorization = req.headers['authorization'].split(' ');
        if (authorization[0] !== 'Bearer') {
          return res.status(401).send();
        } else {
          res.locals.jwt = jwt.verify(
            authorization[1],
            process.env.JWT_SECRET
          ) as Jwt;
          next();
        }
      } catch (err) {
        log(err);
        return res.status(403).send();
      }
    } else {
      return res.status(401).send();
    }
  }

  verfiyRefreshBodyField(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.body && req.body.refreshToken) {
      return next();
    } else {
      return res
        .status(400)
        .send({ errors: ['Missing required field: refresh Token'] });
    }
  }

  async validRefreshNeeded(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user: any = await usersService.getUserByEmailWithPassword(
      res.locals.jwt.email
    );
    const salt = crypto.createSecretKey(
      Buffer.from(res.locals.jwt.refreshkey.data)
    );
    const hash = crypto
      .createHmac('sha512', salt)
      .update(res.locals.jwt.userId + process.env.JWT_SECRET)
      .digest('base64');

    if (hash === req.body.refreshToken) {
      req.body = {
        userId: user._id,
        email: user.email,
        permissionFlags: user.permissionFlags,
      };
      return next();
    } else {
      return res.status(400).send({ errors: ['Invalid refresh token'] });
    }
  }
}

export default new JwtMiddleware();
