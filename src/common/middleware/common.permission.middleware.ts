import express from 'express';
import { permissionsFlags } from './common.permissionflag.enum';
import debug from 'debug';

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
          res.status(403).json({ error: 'Permission denied!' });
        }
      } catch (err) {
        log(err);
        res.status(403).json({ error: 'Something went wrong!' });
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
        res.status(403).json({ error: 'Permission denied!' });
      }
    }
  }
}

export default new permissionMiddleware();
