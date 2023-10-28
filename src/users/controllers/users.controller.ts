import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../services/users.service';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:user-controller');

class UsersController {
  async listUsers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const users = await usersService.list(100, 0);
      res.status(200).json(users);
    } catch (error: any) {
      next(error);
    }
  }

  async getUserById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      log(req.body);
      const user = await usersService.getById(req.body.id);
      res.status(200).json(user);
    } catch (error: any) {
      next(error);
    }
  }

  async createUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const UserId = await usersService.create(req.body);
      res.status(201).json({ _id: UserId });
    } catch (error: any) {
      next(error);
    }
  }

  async patchUserById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (req.body.password) {
        //TODO: check if password is correct
        req.body.password = bcrypt.hashSync(req.body.password, 10);
      }
      // TODO: check if body params are valid
      const UserId = await usersService.updateById(req.params.userId, req.body);
      res.status(HttpStatusCode.Ok).json({ _id: UserId });
    } catch (error: any) {
      return next(error);
    }
  }

  async deleteUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await usersService.deleteById(req.body.id);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      next(error);
    }
  }

  async pathchPermissionFlags(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const permissionflag = parseInt(req.params.permissionFlags);
    req.body.permissionFlags = permissionflag;

    try {
      const userId = await usersService.updateById(req.body.id, req.body);
      if (userId) res.status(HttpStatusCode.Ok).send({ _id: userId });
    } catch (error: any) {
      next(error);
    }
  }
}

export default new UsersController();
