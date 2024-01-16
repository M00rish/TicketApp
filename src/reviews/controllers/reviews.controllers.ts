import express from 'express';
import debug from 'debug';

import { injectable, inject } from 'inversify';
import reviewsService, { ReviewsService } from '../services/reviews.service';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:reviews-dao');

class ReviewsController {
  constructor(private reviewsService: ReviewsService) {
    log('Created new instance of ReviewsController');
  }
  async getReviewsByTripId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      const reviews = await this.reviewsService.getReviewsByTripId(tripId);
      res.status(HttpStatusCode.Ok).json(reviews);
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'getReviewsByTripId_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async getReviewsByUserId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const userId = req.params.userId;
    try {
      const reviews = await this.reviewsService.getReviewsByUserId(userId);
      res.status(HttpStatusCode.Ok).json(reviews);
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'getReviewsByUserId_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async getReviewById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const reviewId = req.params.reviewId;
    try {
      const review = await this.reviewsService.getById(reviewId);
      res.status(HttpStatusCode.Ok).json(review);
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'getReviewById_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async createReview(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const reviewFields = req.body;
    reviewFields.tripId = req.params.tripId;
    reviewFields.userId = res.locals.jwt.userId;
    try {
      const reviewId = await this.reviewsService.create(reviewFields);
      res.status(HttpStatusCode.Created).json({ _id: reviewId });
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'createReview_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async updateReviewById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const reviewId = req.params.reviewId;
    const reviewFields = req.body;
    try {
      const review = await this.reviewsService.updateById(
        reviewId,
        reviewFields
      );
      res.status(HttpStatusCode.NoContent).json({ _id: review });
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'updateReviewById_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async removeReviewById(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const reviewId = req.params.reviewId;
    try {
      await this.reviewsService.deleteById(reviewId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'removeReviewById_error',
          error.statusCode,
          error.message
        );
        next(error);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async removeReviewsByTripId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const tripId = req.params.tripId;
    try {
      await this.reviewsService.removeReviewsByTripId(tripId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'removeReviewsByTripId_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }

  async removeReviewsByUserId(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    const userId = req.params.userId;
    try {
      await this.reviewsService.removeReviewsByUserId(userId);
      res.status(HttpStatusCode.NoContent).json();
    } catch (error: any) {
      if (error instanceof AppError) {
        const appError = new AppError(
          error.isOperational,
          'removeReviewsByUserId_error',
          error.statusCode,
          error.message
        );
        next(appError);
      } else {
        res
          .status(HttpStatusCode.InternalServerError)
          .json('Internal Server Error');
      }
    }
  }
}

export { ReviewsController };
export default new ReviewsController(reviewsService);
