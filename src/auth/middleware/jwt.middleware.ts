import express from 'express';
import jwt from 'jsonwebtoken';
import debug from 'debug';
import rateLimit from 'express-rate-limit';
import usersService from '../../users/services/users.service';

import { Jwt } from '../../common/types/jwt';

const log: debug.IDebugger = debug('app:Jwt-Middlware');

class JwtMiddleware {
  checkValidToken(
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
            process.env.ACCESS_SECRET
          ) as Jwt;

          next();
        }
      } catch (err) {
        log('checkValidToken error: %O', err);
        return res.status(403).send('Invalid token');
      }
    } else {
      return res.status(401).send('No token provided');
    }
  }

  async checkValidRefreshToken(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const refreshToken = req.headers['cookie']?.split(';')[0].split('=')[1];

      if (
        refreshToken &&
        jwt.verify(refreshToken, process.env.REFRESH_SECRET)
      ) {
        return next();
      } else {
        return res.status(400).send('Invalid refresh token');
      }
    } catch (err) {
      log('checkValidRefreshToken error: %O', err);
      return res.status(403).send('no refresh token provided');
    }
  }

  async perpareBody(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    req.body = {
      userId: res.locals.jwt.userId,
      permissionFlags: res.locals.jwt.permissionFlags,
    };
    next();
  }
  async getPermissionsAndId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user: any = await usersService.readById(res.locals.jwt.userId);
    log('user: %O', user);
    if (user) {
      req.body = {
        userId: user._id,
        permissionFlags: user.permissionFlags,
      };
    }
    return next();
  }

  rateLimitRefreshTokenRequests = rateLimit({
    windowMs: 15 * 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Too many requests, please try again after 15 days',
  });
}

export default new JwtMiddleware();
