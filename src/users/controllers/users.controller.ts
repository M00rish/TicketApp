import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService from '../services/users.service';

const log: debug.IDebugger = debug('app:user-controller');

class UsersController {
  async listUsers(req: express.Request, res: express.Response) {
    const users = await usersService.list(100, 0);
    res.status(200).json(users);
  }

  async getUserById(req: express.Request, res: express.Response) {
    const user = await usersService.readById(req.body.id);
    res.status(200).json(user);
  }

  async createUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    req.body.password = bcrypt.hashSync(req.body.password, 10);

    const UserId: string = await usersService.create(req.body);
    res.status(201).json({ _id: UserId });
  }

  async patch(req: express.Request, res: express.Response) {
    if (req.body.password) {
      req.body.password = bcrypt.hashSync(req.body.password, 10); // to be checked
    }

    const UserId = await usersService.patchById(req.params.userId, req.body);
    res.status(204).send({ _id: UserId });
  }

  async removeUser(req: express.Request, res: express.Response) {
    log(await usersService.deleteById(req.body.id));
    res.status(204).json();
  }
}

export default new UsersController();
