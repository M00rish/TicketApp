import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../services/users.service';
import AppError from '../../common/types/appError';

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
      if (error instanceof AppError) {
        next(error);
      } else {
        res.status(500).json('Internal Server Error');
      }
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
      if (error instanceof AppError) {
        next(error);
      } else {
        res.status(500).json('Internal Server Error');
      }
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
      if (error instanceof AppError) {
        next(error);
      } else {
        res.status(500).json('Internal Server Error');
      }
    }
  }

  async patchUser(
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
      const UserId = await usersService.patchById(req.params.userId, req.body);
      res.status(204).json({ _id: UserId });
    } catch (error: any) {
      if (error instanceof AppError) {
        next(error);
      } else {
        res.status(500).json('Internal Server Error');
      }
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
      res.status(204).json('User deleted successfully');
    } catch (error: any) {
      if (error instanceof AppError) {
        next(error);
      } else {
        res.status(500).json('Internal Server Error');
      }
    }
  }
}

export default new UsersController();
