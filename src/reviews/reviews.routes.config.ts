import express from 'express';
import { body } from 'express-validator';

import { CommonRoutesConfig } from '../common/common.routes.config';
import PermissionMiddleware from '../common/middleware/common.permission.middleware';
import { permissionsFlags } from '../common/enums/common.permissionflag.enum';
import jwtMiddleware from '../auth/middleware/jwt.middleware';
import reviewsController from './controllers/reviews.controllers';
import bodyValidationMiddleware from '../common/middleware/body.validation.middleware';

export class ReviewsRoutes extends CommonRoutesConfig {
  constructor(app: express.Application) {
    super(app, 'ReviewsRoutes');
  }

  configureRoutes(): express.Application {
    this.app
      .route(`/v1/trips/:tripId/reviews`)
      .get([
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.USER),
        reviewsController.getReviewsByTripId,
      ])
      .post([
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.USER),
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
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.ADMIN),
        reviewsController.removeReviewsByTripId,
      ]);

    this.app
      .route(`/v1/users/:userId/reviews`)
      .get([
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.onlySameUserOrAdminCanAccess,
        reviewsController.getReviewsByUserId,
      ])
      .delete([
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.onlySameUserOrAdminCanAccess,
        reviewsController.removeReviewsByUserId,
      ]);

    this.app
      .route(`/v1/reviews/:reviewId`)
      .get([
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.permissionsFlagsRequired(permissionsFlags.USER),
        reviewsController.getReviewById,
      ])
      .patch([
        jwtMiddleware.checkValidToken,
        PermissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess,
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
        PermissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess,
        reviewsController.removeReviewById,
      ]);

    return this.app;
  }
}
