import express from 'express';
import debug from 'debug';
import authService from '../services/auth.service';

const log: debug.IDebugger = debug('app:auth-controller');

class AuthController {
  async logIn(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    authService.createJWT(req, res, next);
  }

  async logOut(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    authService.clearJWT(req, res, next);
  }
}

export default new AuthController();
