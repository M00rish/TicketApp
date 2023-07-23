import express from 'express';
import debug from 'debug';
import multer from 'multer';
import path from 'path';

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
        'validateSameEmailDoesntExist_Error',
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
        'validateSameEmailBelongToSameUser_Error',
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
    const user = await usersService.readById(req.body.id);
    if (user) {
      res.locals.user = user;
      next();
    } else {
      const error = new AppError(
        true,
        'validateUserExists_Error',
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
      if (res.locals.jwt.permissionFlags < 4) {
        const error = new AppError(
          true,
          'userCannotChangePermission_Error',
          HttpStatusCode.Forbidden,
          'user cannot change permission levels'
        );
        next(error);
      }
      usersService.patchById(res.locals.user._id, {
        permissionFlags: req.body.permissionFlags,
      });
    } else {
      next();
    }
  }

  async pathchPermissionFlags(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    await usersService.patchById(req.body.id, req.body);
    next();
  }

  async updateUserPhoto(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const assetsFolderPath = path.join(__dirname, '../../public/images');

    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, assetsFolderPath);
      },
      filename: function (req, file, cb) {
        const extension = file.mimetype.split('/')[1];

        cb(null, `${file.fieldname}-${Date.now()}.${extension}`);
      },
    });

    const multerFilter = (
      req: express.Request,
      file: Express.Multer.File,
      cb: any
    ) => {
      if (file.mimetype.startsWith('image')) {
        cb(null, true);
      } else {
        const error = new AppError(
          true,
          'MULTER_ERROR',
          HttpStatusCode.BadRequest,
          'Not an image. Please upload only images.'
        );

        cb(error, false);
      }
    };

    const upload = multer({
      storage: storage,
      fileFilter: multerFilter,
    }).single('image');

    upload(req, res, function (err) {
      if (err) {
        return next(err);
      }

      req.body.image = req.file?.filename;
      next();
    });
  }
}

export default new UsersMiddleware();
