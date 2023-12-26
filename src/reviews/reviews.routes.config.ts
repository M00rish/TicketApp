import express from 'express';
import { body } from 'express-validator';

import { container } from '../ioc/inversify.config';
import { CommonRoutesConfig } from '../common/common.routes.config';
import { PermissionMiddleware } from '../common/middlewares/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import { JwtMiddleware } from '../auth/middleware/jwt.middleware';
import { ReviewsController } from './controllers/reviews.controllers';
import { BodyValidationMiddleware } from '../common/middlewares/body.validation.middleware';

export class ReviewsRoutes extends CommonRoutesConfig {
  private jwtMiddleware;
  private reviewsController;
  private bodyValidationMiddleware;
  private permissionMiddleware;

  constructor(app: express.Application) {
    super(app, 'ReviewsRoutes');

    this.jwtMiddleware = container.resolve(JwtMiddleware);
    this.reviewsController = container.resolve(ReviewsController);
    this.bodyValidationMiddleware = container.resolve(BodyValidationMiddleware);
    this.permissionMiddleware = container.resolve(PermissionMiddleware);
  }

  configureRoutes(): express.Application {
    this.app
      .route(`/v1/trips/:tripId/reviews`)
      .get([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        this.reviewsController.getReviewsByTripId,
      ])
      .post([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        body('ratings').isNumeric(),
        body('reviewText').isString(),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'ratings',
          'reviewText',
        ]),
        this.reviewsController.createReview,
      ])
      .delete([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        this.reviewsController.removeReviewsByTripId,
      ]);

    this.app
      .route(`/v1/users/:userId/reviews`)
      .get([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.onlySameUserOrAdminCanAccess,
        this.reviewsController.getReviewsByUserId,
      ])
      .delete([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.onlySameUserOrAdminCanAccess,
        this.reviewsController.removeReviewsByUserId,
      ]);

    this.app
      .route(`/v1/reviews/:reviewId`)
      .get([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        this.reviewsController.getReviewById,
      ])
      .patch([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess,
        body('ratings').isNumeric(),
        body('reviewText').isString(),
        this.bodyValidationMiddleware.verifyBodyFieldsError([
          'ratings',
          'reviewText',
        ]),
        this.reviewsController.updateReviewById,
      ])
      .delete([
        this.jwtMiddleware.checkValidToken,
        this.permissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess,
        this.reviewsController.removeReviewById,
      ]);

    return this.app;
  }
}
