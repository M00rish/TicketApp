import express from 'express';
import { permissionsFlags } from '../enums/common.permissionflag.enum';
import debug from 'debug';
import AppError from '../types/appError';

const log: debug.IDebugger = debug('app:common-permission-middleware');

class permissionMiddleware {
  permissionsFlagsRequired(requiredPermissionFlags: permissionsFlags) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        const userPermissionFlag = parseInt(res.locals.jwt.permissionFlags);

        if (requiredPermissionFlags & userPermissionFlag) {
          next();
        } else {
          const error = new AppError(
            true,
            'permissionsFlagsRequired_Error',
            403,
            "you're not authorized to perform this operation"
          );
          next(error);
        }
      } catch (err) {
        const error = new AppError(
          false,
          'permissionsFlagsRequired_Error',
          403,
          'Something went wrong!'
        );
        next(error);
      }
    };
  }

  async onlySameUserOrAdminCanAccess(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const userPermissionFlag = parseInt(res.locals.jwt.permissionFlags);
    if (
      req.params &&
      req.params.userId &&
      req.params.userId === res.locals.jwt.userId
    ) {
      next();
    } else {
      if (userPermissionFlag & permissionsFlags.ADMIN) {
        next();
      } else {
        const error = new AppError(
          true,
          'onlySameUserOrAdminCanAccess_Error',
          403,
          "you're not authorized to perform this operation"
        );
        next(error);
      }
    }
  }
}

export default new permissionMiddleware();
