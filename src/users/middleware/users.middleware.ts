import express from 'express';
import debug from 'debug';
import userService from '../services/users.service';
import usersService from '../services/users.service';

const log: debug.IDebugger = debug('app:users-controller');

class UsersMiddleware {
  async validateSameEmailDoesntExist(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    log('validateSameEmailDoesntExist');
    const user = await userService.getUserByEmail(req.body.email);
    log('user', user);
    if (!user) {
      next();
    } else {
      return { error: 'user email already exist' };
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
      res.status(400).send({ error: 'invalid email' });
    }
  }

  validatePatchEmail = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    if (req.body.email) {
      log('Validating email', req.body.email);
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
    const user = await userService.readById(req.body.id);
    if (user) {
      res.locals.user = user;
      next();
    } else {
      res.status(404).send({
        error: `User not found`,
      });
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
      if (res.locals.jwt.permissionFlags < 4) {
        return res.status(403).send('user cannot change permission levels');
      }
      usersService.patchById(res.locals.user._id, {
        permissionFlags: req.body.permissionFlags,
      });
    } else {
      next();
    }
  }
}

export default new UsersMiddleware();
