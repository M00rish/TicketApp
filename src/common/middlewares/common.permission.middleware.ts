import express from 'express';
import { permissionsFlags } from '../enums/common.permissionflag.enum';
import debug from 'debug';
import AppError from '../types/appError';
import HttpStatusCode from '../enums/HttpStatusCode.enum';
import reviewsService, {
  ReviewsService,
} from '../../reviews/services/reviews.service';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:common-permission-middleware');

class PermissionMiddleware {
  constructor(private reviewsService: ReviewsService) {
    log('Created instance of CommonPermissionMiddleware');
  }

  /**
   * Middleware function that checks if the user has the required permission flags.
   * If the user has the required permission flags, the next middleware function is called.
   * Otherwise, an error is passed to the next middleware function.
   * @param requiredPermissionFlags The required permission flags.
   * @returns The middleware function.
   */
  permissionsFlagsRequired(requiredPermissionFlags: permissionsFlags) {
    return (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      try {
        const userPermissionFlag = parseInt(
          res.locals.jwt.payload.permissionFlags
        );
        if (requiredPermissionFlags & userPermissionFlag) {
          return next();
        } else {
          const error = new AppError(
            true,
            'PermissionFlagsError',
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

  /**
   * Middleware function that allows only the same user or an admin to access the route.
   * @param req - The express Request object.
   * @param res - The express Response object.
   * @param next - The express NextFunction object.
   */
  onlySameUserOrAdminCanAccess(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const userPermissionFlag = parseInt(res.locals.jwt.payload.permissionFlags);
    if (
      req.params &&
      req.params.userId &&
      req.params.userId === res.locals.jwt.payload.userId
    ) {
      return next();
    } else {
      if (userPermissionFlag & permissionsFlags.ADMIN) {
        return next();
      } else {
        const error = new AppError(
          true,
          'PermissionFlagsError',
          HttpStatusCode.Unauthorized,
          "you're not authorized to perform this operation"
        );

        next(error);
      }
    }
  }

  /**
   * Middleware that allows only the admin or the user who created the review to access the route.
   * @param req - The express request object.
   * @param res - The express response object.
   * @param next - The next middleware function.
   */
  async onlyAdminOrUserWhoCreatedReviewCanAccess(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const userPermissionFlag = parseInt(res.locals.jwt.payload.permissionFlags);
    const reviewId = req.params.reviewId;
    const userId = res.locals.jwt.payload.userId;

    if (userPermissionFlag & permissionsFlags.ADMIN) {
      return next();
    }

    const review = await this.reviewsService.getById(reviewId);
    if (review.userId === userId) {
      return next();
    } else {
      const error = new AppError(
        true,
        'PermissionFlagsError',
        HttpStatusCode.Unauthorized,
        "you're not authorized to perform this operation"
      );
      next(error);
    }
  }
}

export { PermissionMiddleware };
export default new PermissionMiddleware(reviewsService);
