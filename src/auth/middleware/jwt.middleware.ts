import express from 'express';
import jwt from 'jsonwebtoken';
import debug from 'debug';
import rateLimit from 'express-rate-limit';
import usersService from '../../users/services/users.service';

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
          const jwtError = new AppError(
            true,
            'NO_TOKEN_ERROR',
            HttpStatusCode.Unauthorized,
            'you are not logged in,'
          );
          next(jwtError);
          return res.status(401).send();
        } else {
          res.locals.jwt = jwt.verify(
            authorization[1],
            process.env.ACCESS_SECRET
          ) as Jwt;

          next();
        }
      } catch (err) {
        const jwtError = new AppError(
          true,
          'INVALID_TOKEN_ERROR',
          HttpStatusCode.Unauthorized,
          'something went wrong... please login again'
        );
        next(jwtError);
      }
    } else {
      const jwtError = new AppError(
        true,
        'NO_TOKEN_ERROR',
        HttpStatusCode.Unauthorized,
        'you are not logged in'
      );
      next(jwtError);
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
        const refreshTokenError = new AppError(
          true,
          'INVALID_REFRESH_TOKEN_ERROR',
          HttpStatusCode.Unauthorized,
          'Invalid refresh token'
        );
        next(refreshTokenError);
      }
    } catch (err) {
      const refreshTokenError = new AppError(
        false,
        'REFRESH_TOKEN_ERROR',
        HttpStatusCode.Unauthorized,
        'Something went wrong...'
      );
      next(refreshTokenError);
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
      const jwtError = new AppError(
        false,
        'PREPARE_BODY_ERROR',
        HttpStatusCode.Unauthorized,
        'Something went wrong...'
      );
      next(jwtError);
    }
  }

  async getPermissionsAndId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user: any = await usersService.readById(res.locals.jwt.userId);
      if (user) {
        req.body = {
          userId: user._id,
          permissionFlags: user.permissionFlags,
        };
      }
      next();
    } catch (err) {
      const permissionError = new AppError(
        false,
        'GET_PERMISSIONS_AND_ID_ERROR',
        HttpStatusCode.Unauthorized,
        'Something went wrong...'
      );
      next(permissionError);
    }
  }

  rateLimitRefreshTokenRequests = rateLimit({
    windowMs: 15 * 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Too many requests, please try again after 15 days',
  });
}

export default new JwtMiddleware();
