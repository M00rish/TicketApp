import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import commonPermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import reviewsController from './controllers/reviews.controllers';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class ReviewsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'TripReviews');
  }

  configureRoutes(): express.Application {
    this.app
      .route(`/v1/trips/:tripId/reviews`)
      .get([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        reviewsController.getReviewsByTripId,
      ])
      .post([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        body('ratings').isNumeric(),
        body('reviewText').isString(),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'ratings',
          'reviewText',
        ]),
        reviewsController.createReview,
      ])
      .delete([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.ADMIN
        ),
        reviewsController.removeReviewsByTripId,
      ]);

    this.app
      .route(`/v1/users/:userId/reviews`)
      .get([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.onlySameUserOrAdminCanAccess,
        reviewsController.getReviewsByUserId,
      ])
      .delete([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.onlySameUserOrAdminCanAccess,
        reviewsController.removeReviewsByUserId,
      ]);

    this.app
      .route(`/v1/reviews/:reviewId`)
      .get([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.permissionsFlagsRequired(
          permissionsFlags.USER
        ),
        reviewsController.getReviewById,
      ])
      .patch([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess,
        body('ratings').isNumeric(),
        body('reviewText').isString(),
        bodyValidationMiddleware.verifyBodyFieldsError([
          'ratings',
          'reviewText',
        ]),
        reviewsController.updateReviewById,
      ])
      .delete([
        jwtMiddleware.checkValidToken,
        commonPermissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess,
        reviewsController.removeReviewById,
      ]);

    return this.app;
  }
}
