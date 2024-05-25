import express from 'express';
import debug from 'debug';
import { AuthService } from '../services/auth.service';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:auth-controller');

class AuthController {
  constructor(private authService: AuthService) {
    log('Created new instance of AuthController');
    this.logIn = this.logIn.bind(this);
    this.logOut = this.logOut.bind(this);
  }

  async logIn(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const accessToken = await this.authService.createJWT(req, res, next);

    res.status(HttpStatusCode.Ok).send({ accessToken });
  }

  async logOut(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    await this.authService.clearJWT(req, res, next);

    res.status(HttpStatusCode.Ok).send();
  }
}

export { AuthController };
