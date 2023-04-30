import express from 'express';
import debug from 'debug';
import authService from '../services/auth.service';

const log: debug.IDebugger = debug('app:auth-controller');

class AuthController {
  async logIn(req: express.Request, res: express.Response) {
    authService.createJWT(req, res);
  }

  async logOut(req: express.Request, res: express.Response) {
    authService.clearJWT(req, res);
  }
}

export default new AuthController();
