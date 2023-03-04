import express from 'express';
import { validationResult } from 'express-validator';
import debug from 'debug';

const log: debug.IDebugger = debug('app:bodyValidationMiddleware');

class bodyValidationMiddleware {
  verifyBodyFieldsError(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      log(errors);
      return res.status(400).send({ errors });
    }
    next();
  }
}

export default new bodyValidationMiddleware();
