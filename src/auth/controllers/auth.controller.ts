import express from 'express';
import debug from 'debug';
import Jwt from 'jsonwebtoken';
import crypto from 'crypto';

const log: debug.IDebugger = debug('app:auth-controller');

class AuthController {
  async createJWT(req: express.Request, res: express.Response) {
    try {
      const refreshId = req.body.userId + process.env.JWT_SECRET;
      const salt = crypto.createSecretKey(crypto.randomBytes(16));
      const hash = crypto
        .createHmac('sha512', salt)
        .update(refreshId)
        .digest('base64');
      req.body.refreshkey = salt.export();
      const token = Jwt.sign(req.body, process.env.JWT_SECRET, {
        expiresIn: process.env.TOKEN_EXPERITION_INSECONDS,
      });
      return res.status(201).send({ accessToken: token, refreshToken: hash });
    } catch (err) {
      log('createJWT error: %O', err);

      return res.status(500).send();
    }
  }
}

export default new AuthController();
