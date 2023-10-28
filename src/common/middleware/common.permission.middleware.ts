import express from 'express';
import { permissionsFlags } from '../enums/common.permissionflag.enum';
import debug from 'debug';
import AppError from '../types/appError';
import HttpStatusCode from '../enums/HttpStatusCode.enum';
import reviewsService from '../../reviews/services/reviews.service';

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
          return next();
        } else {
          const error = new AppError(
            true,
            'permissionFlagsError',
            HttpStatusCode.Unauthorized,
            "you're not authorized to perform this operation"
          );
          next(error);
        }
      } catch (err) {
        next(err);
      }
    };
  }

  onlySameUserOrAdminCanAccess(
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
      return next();
    } else {
      if (userPermissionFlag & permissionsFlags.ADMIN) {
        next();
      } else {
        const error = new AppError(
          true,
          'permissionFlagsError',
          HttpStatusCode.Unauthorized,
          "you're not authorized to perform this operation"
        );
        next(error);
      }
    }
  }

  async onlyAdminOrUserWhoCreatedReviewCanAccess(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const userPermissionFlag = parseInt(res.locals.jwt.permissionFlags);
    const reviewId = req.params.reviewId;
    const userId = res.locals.jwt.userId;

    if (userPermissionFlag & permissionsFlags.ADMIN) {
      return next();
    }

    const review = await reviewsService.getById(reviewId);
    if (review.userId === userId) {
      return next();
    } else {
      const error = new AppError(
        true,
        'permissionFlagsError',
        HttpStatusCode.Unauthorized,
        "you're not authorized to perform this operation"
      );
      next(error);
    }
  }
}

export default new permissionMiddleware();
