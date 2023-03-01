import express from 'express';
import { validationResult } from 'express-validator';

class bodyValidationMiddleware {
  verifyBodyFieldsError(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).send({ errors: errors.array });
    }
    next();
  }
}

export default new bodyValidationMiddleware();
