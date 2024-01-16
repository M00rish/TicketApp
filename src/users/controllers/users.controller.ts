import express from 'express';
import debug from 'debug';
import bcrypt from 'bcryptjs';

import usersService, { UsersService } from '../services/users.service';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:users-controller');

class UsersController {
  /**
   * Creates a new instance of UsersController.
   * @param usersService - The users service.
   */
  constructor(private usersService: UsersService) {
    this.usersService = usersService; // TODO : check if needed
    this.createUser = this.createUser.bind(this);
    this.getUserById = this.getUserById.bind(this);
    this.deleteUser = this.deleteUser.bind(this);
    this.listUsers = this.listUsers.bind(this);
    this.patchUserById = this.patchUserById.bind(this);
    this.patchPermissionFlags = this.patchPermissionFlags.bind(this);
    this.deleteAllUsers = this.deleteAllUsers.bind(this);

    log('Created new instance of UsersController');
  }

  /**
   * Retrieves a list of users.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  public async listUsers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const users = await this.usersService.list(100, 0);
      res.status(HttpStatusCode.Ok).json(users);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Retrieves a user by their ID.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  public async getUserById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const user = await this.usersService.getById(req.body.id);
      res.status(HttpStatusCode.Ok).json(user);
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Creates a new user.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  public async createUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const UserId = await this.usersService.create(req.body);
      res.status(HttpStatusCode.Created).json({ _id: UserId });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Updates a user by their ID.
   * If a new password is provided, it will be hashed before updating the user.
   * @param req - The request object.
   * @param res - The response object.
   * @param next - The next function.
   */
  public async patchUserById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const UserId = await this.usersService.updateById(
        req.params.userId,
        req.body
      );
      res.status(HttpStatusCode.Ok).json({ _id: UserId });
    } catch (error: any) {
      return next(error);
    }
  }

  /**
   * Deletes a user.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  public async deleteUser(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await this.usersService.deleteById(req.body.id);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Updates the permission flags of a user.
   *
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   * @returns Promise<void>
   */
  public async patchPermissionFlags(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const permissionflag = parseInt(req.params.permissionFlags);
    req.body.permissionFlags = permissionflag;

    try {
      const userId = await this.usersService.updateById(req.body.id, req.body);
      if (userId) res.status(HttpStatusCode.Ok).json({ _id: userId });
    } catch (error: any) {
      next(error);
    }
  }

  /**
   * Deletes all users.
   *
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The express next function.
   */
  public async deleteAllUsers(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      await this.usersService.deleteAllUsers();
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      next(error);
    }
  }
}

export { UsersController };
export default new UsersController(usersService);
