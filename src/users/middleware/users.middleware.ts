import express from 'express';
import debug from 'debug';

import usersService from '../services/users.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:users-middleware');

class UsersMiddleware {
  async validateSameEmailDoesntExist(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await usersService.getUserByEmail(req.body.email);

    if (!user) {
      next();
    } else {
      const error = new AppError(
        true,
        'validateSameEmailDoesntExistError',
        HttpStatusCode.BadRequest,
        'user email already exist'
      );

      next(error);
    }
  }

  async validateSameEmailBelongToSameUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (res.locals.user && res.locals.user._id === req.params.userId) {
      next();
    } else {
      const error = new AppError(
        true,
        'validateSameEmailBelongToSameUserError',
        HttpStatusCode.BadRequest,
        'invalid email'
      );
      next(error);
    }
  }

  validatePatchEmail = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body.email) {
      this.validateSameEmailBelongToSameUser(req, res, next);
    } else {
      next();
    }
  };

  async validateUserExists(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const user = await usersService.getById(req.body.id);
    if (user) {
      res.locals.user = user;
      next();
    } else {
      const error = new AppError(
        true,
        'RessourceNotFoundError',
        HttpStatusCode.NotFound,
        'user not found'
      );
      next(error);
    }
  }

  async extractUserId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    req.body.id = req.params.userId;
    next();
  }

  async userCannotChangePermission(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    if (
      'permissionFlags' in req.body &&
      req.body.permissionFlags != res.locals.jwt.permissionFlags
    ) {
      const error = new AppError(
        true,
        'permissionFlagsError',
        HttpStatusCode.Forbidden,
        'you cannot change permissions'
      );
      next(error);
    } else {
      next();
    }
  }
}

export default new UsersMiddleware();
