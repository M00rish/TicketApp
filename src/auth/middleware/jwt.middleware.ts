import express from 'express';
import jwt from 'jsonwebtoken';
import debug from 'debug';
import rateLimit from 'express-rate-limit';

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
        return res.status(403).send();
      }
    } else {
      return res.status(401).send();
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
        log(req.headers['cookie']);
        return next();
      } else {
        return res.status(400).send({ errors: ['Invalid refresh token'] });
      }
    } catch (err) {
      log('checkValidRefreshToken error: %O', err);
      return res.status(403).send();
    }
  }

  rateLimitRefreshTokenRequests = rateLimit({
    windowMs: 15 * 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Too many requests, please try again later',
  });
}

export default new JwtMiddleware();
