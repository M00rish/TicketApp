import express from 'express';
import jwt from 'jsonwebtoken';
import debug from 'debug';
import rateLimit from 'express-rate-limit';

import { Jwt } from '../../common/types/jwt';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

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
          const error = new AppError(
            true,
            'NoTokenError',
            HttpStatusCode.Unauthorized,
            'you are not logged in,'
          );
          next(error);
        } else {
          res.locals.jwt = jwt.verify(
            authorization[1],
            process.env.ACCESS_SECRET
          ) as Jwt;

          next();
        }
      } catch (err) {
        next(err);
      }
    } else {
      const error = new AppError(
        true,
        'NoTokenError',
        HttpStatusCode.Unauthorized,
        'you are not logged in'
      );
      next(error);
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
        const error = new AppError(
          true,
          'InvalidRefreshTokenError',
          HttpStatusCode.Unauthorized,
          'Invalid refresh token'
        );
        next(error);
      }
    } catch (err) {
      return next(err);
    }
  }

  perpareBody(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.body) {
      req.body = {
        userId: res.locals.jwt.userId,
        permissionFlags: res.locals.jwt.permissionFlags,
      };
      next();
    } else {
      const error = new AppError(
        false,
        'PREPARE_BODY_ERROR',
        HttpStatusCode.Unauthorized,
        'Something went wrong...'
      );
      next(error);
    }
  }

  rateLimitRefreshTokenRequests = rateLimit({
    windowMs: 15 * 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Too many requests, please try again after 15 days',
  });
}

export default new JwtMiddleware();
