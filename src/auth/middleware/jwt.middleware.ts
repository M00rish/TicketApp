import express from 'express';
import jwt from 'jsonwebtoken';
import debug from 'debug';
import rateLimit from 'express-rate-limit';

import { Jwt } from '../../common/types/jwt';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { injectable } from 'inversify';

const log: debug.IDebugger = debug('app:Jwt-Middlware');

class JwtMiddleware {
  constructor() {
    log('Created new instance of JwtMiddleware');
  }
  /**
   * Middleware function to check the validity of a JWT token in the request header.
   * If the token is valid, it sets the decoded token in the response locals and calls the next middleware.
   * If the token is invalid or missing, it throws an error.
   *
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @param next - The Express next function.
   */
  public checkValidToken(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const authorizationHeader = req.headers['authorization'];

    if (!authorizationHeader) {
      return next(
        new AppError(
          true,
          'LoginError',
          HttpStatusCode.Unauthorized,
          'You are not logged in'
        )
      );
    }

    const [bearer, token] = authorizationHeader.split(' ');

    if (bearer !== 'Bearer') {
      return next(
        new AppError(
          true,
          'LoginError',
          HttpStatusCode.Unauthorized,
          'You are not logged in'
        )
      );
    }

    jwt.verify(token, process.env.ACCESS_SECRET, (err, decoded) => {
      if (err) {
        return next(err);
      }
      res.locals.jwt = decoded as Jwt;
      return next();
    });
  }

  /**
   * Middleware function to check the validity of a refresh token.
   * It extracts the refresh token from the request headers, verifies it, and calls the next middleware if valid.
   * If the refresh token is missing or invalid, it throws an error.
   *
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @param next - The next middleware function.
   * @returns Promise<void>
   */
  public async checkValidRefreshToken(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const refreshToken = req.headers['cookie']?.split(';')[0].split('=')[1];

      if (!refreshToken) {
        throw new AppError(
          true,
          'LoginError',
          HttpStatusCode.Unauthorized,
          'No refresh token provided'
        );
      }

      jwt.verify(refreshToken, process.env.REFRESH_SECRET, (err, decoded) => {
        if (err) {
          return next(
            new AppError(
              true,
              'LoginError',
              HttpStatusCode.Unauthorized,
              'Invalid refresh token'
            )
          );
        }
        return next();
      });
    } catch (err) {
      return next(err);
    }
  }

  /**
   * Middleware function to prepare the request body by extracting necessary information from the JWT payload.
   * If the request body exists, it will be modified to include the userId, refreshToken, and permissionFlags from the JWT payload.
   * If the request body does not exist, an error will be passed to the next middleware.
   * @param req - The Express request object.
   * @param res - The Express response object.
   * @param next - The next middleware function.
   */
  public prepareBody(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (req.body) {
      req.body = {
        userId: res.locals.jwt.payload.userId,
        refreshToken: res.locals.jwt.payload.refreshToken,
        permissionFlags: res.locals.jwt.payload.permissionFlags,
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

  public rateLimitRefreshTokenRequests = rateLimit({
    windowMs: 15 * 24 * 60 * 60 * 1000,
    max: 1,
    message: 'Too many requests, please try again after 15 days',
  });
}

export { JwtMiddleware };
export default new JwtMiddleware();
