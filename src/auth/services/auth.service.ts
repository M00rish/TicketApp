import express from 'express';
import debug from 'debug';
import Jwt from 'jsonwebtoken';

import { UsersService } from '../../users/services/users.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:auth-controller');

@injectable()
class AuthService {
  /**
   * Creates a new instance of the AuthService.
   * @param usersService The UsersService instance used for authentication.
   */
  constructor(@inject(TYPES.UsersService) private usersService: UsersService) {
    log('Created new instance of AuthService');
  }

  /**
   * Creates a JSON Web Token (JWT) for authentication.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   * @returns A Promise that resolves to the access token.
   * @throws {AppError} If the user ID is missing or if there is an error creating the JWT.
   */
  public async createJWT(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (!req.body.userId || !req.body.permissionFlags) {
        throw new AppError(
          false,
          'InputValidationError',
          HttpStatusCode.BadRequest,
          'User ID and PermissionFlags are required'
        );
      }

      const refreshToken = this.createToken(
        req.body,
        process.env.REFRESH_SECRET,
        process.env.REFRESH_TOKEN_LIFE
      );
      const accessToken = this.createToken(
        req.body,
        process.env.ACCESS_SECRET,
        process.env.ACCESS_TOKEN_LIFE
      );

      await this.usersService.updateUserRefreshTokenById(
        req.body.userId,
        refreshToken
      );

      this.setCookie(res, 'jwt', refreshToken);

      return accessToken;
    } catch (err) {
      if (err instanceof AppError) {
        throw err;
      }

      const error = new AppError(
        false,
        'LoginError',
        HttpStatusCode.InternalServerError,
        'Failed to create JWT'
      );
      throw error;
    }
  }

  /**
   * Creates a JWT token with the given payload, secret, and expiration time.
   * @param payload - The payload to be included in the token.
   * @param secret - The secret key used to sign the token.
   * @param expiresIn - The expiration time for the token.
   * @returns The generated JWT token.
   */
  public createToken(payload: string, secret: string, expiresIn: string) {
    return Jwt.sign({ payload }, secret, { expiresIn });
  }

  /**
   * Sets a cookie in the response object.
   * @param res - The express response object.
   * @param name - The name of the cookie.
   * @param value - The value of the cookie.
   */
  public setCookie(res: express.Response, name: string, value: string) {
    res.cookie(name, value, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 15 * 24 * 60 * 60 * 1000,
    });
  }

  /**
   * Clears the JWT token and refresh token for the authenticated user.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   * @returns A 204 status code if the JWT is successfully cleared.
   * @throws AppError if there is an error clearing the JWT.
   */
  public async clearJWT(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const { userId } = res.locals.jwt.payload;
      if (!userId) {
        throw new AppError(
          false,
          'INVALID_USER',
          HttpStatusCode.BadRequest,
          'User ID is required'
        );
      }

      await this.usersService.updateUserRefreshTokenById(userId, '');
      res.locals.jwt = null;

      res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });
    } catch (err) {
      if (err instanceof AppError) {
        return next(err);
      }

      const error = new AppError(
        false,
        'CLEAR_JWT_ERROR',
        HttpStatusCode.InternalServerError,
        'Failed to clear JWT'
      );
      return next(error);
    }
  }
}

export { AuthService };
