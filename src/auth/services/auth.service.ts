import express from 'express';
import debug from 'debug';
import Jwt from 'jsonwebtoken';

import usersService from '../../users/services/users.service';

const log: debug.IDebugger = debug('app:auth-controller');

class AuthService {
  async createJWT(req: express.Request, res: express.Response) {
    try {
      const refreshToken = Jwt.sign(req.body, process.env.REFRESH_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_LIFE,
      });

      const accessToken = Jwt.sign(req.body, process.env.ACCESS_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_LIFE,
      });

      await usersService.updateUserRefreshTokenById(
        req.body.userId,
        refreshToken
      );

      return res
        .cookie('jwt', refreshToken, {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 15 * 24 * 60 * 60 * 1000,
        })
        .status(201)
        .send({ accessToken });
    } catch (err) {
      log('createJWT error: %O', err);
      return res.status(500).send();
    }
  }

  async clearJWT(req: express.Request, res: express.Response) {
    try {
      await usersService.updateUserRefreshTokenById(res.locals.jwt.userId, '');
      res.locals.jwt = null;
      res.clearCookie('jwt', {
        httpOnly: true,
        secure: true,
      });

      return res.status(204).send();
    } catch (err) {
      log('clearJWT error: %O', err);
      return res.status(500).send();
    }
  }
}

export default new AuthService();
