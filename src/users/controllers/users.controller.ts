import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../services/users.service';
import AppError from '../../common/types/appError';
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
      error = new AppError(
        false,
        'listUsers_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async getUserById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await usersService.readById(req.body.id);
      res.status(200).json(user);
    } catch (error: any) {
      error = new AppError(
        false,
        'getUserById_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async createUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const UserId: string = await usersService.create(req.body);
      res.status(201).json({ _id: UserId });
    } catch (error: any) {
      error = new AppError(
        false,
        'createUser_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async patchUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      if (req.body.password) {
        req.body.password = bcrypt.hashSync(req.body.password, 10);
      }

      const UserId = await usersService.patchById(req.params.userId, req.body);
      res.status(204).send({ _id: UserId });
    } catch (error: any) {
      error = new AppError(
        false,
        'patchUser_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }

  async removeUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await usersService.deleteById(req.body.id);
      res.status(204).json('User deleted');
    } catch (error: any) {
      error = new AppError(
        false,
        'removeUser_Error',
        HttpStatusCode.BadRequest,
        error.message
      );
      next(error);
    }
  }
}

export default new UsersController();
