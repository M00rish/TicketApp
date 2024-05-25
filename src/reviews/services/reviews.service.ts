import debug from 'debug';
import { inject, injectable } from 'inversify';

import { CRUD } from '../../common/interfaces/crud.interface';
import { ReviewsDao } from '../daos/reviews.dao';
import { CreateReviewDto } from '../dtos/create.review.dto';
import { PatchReviewDto } from '../dtos/patch.review.dto';
import { TYPES } from '../../ioc/types';
import { TripsService } from '../../trips/services/trips.service';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:reviews-service');

class ReviewsService implements CRUD {
  constructor(
    private reviewsDao: ReviewsDao,
    private tripsService: TripsService
  ) {
    log('Created new instance of ReviewsService');
  }

  /**
   * Creates a new review.
   *
   * @param reviewFields - The data for the review to be created.
   * @returns The ID of the created review.
   * @throws If an error occurs while creating the review.
   */
  async create(reviewFields: CreateReviewDto) {
    try {
      const reviewId = await this.reviewsDao.create(reviewFields);
      this.tripsService.updateTripRating(reviewFields.tripId);
      return reviewId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves reviews by trip ID.
   * @param tripId - The ID of the trip.
   * @returns A promise that resolves to the reviews for the specified trip.
   * @throws {AppError} If no reviews are found for the specified trip.
   */
  async getReviewsByTripId(tripId: string) {
    try {
      const reviews = await this.reviewsDao.getReviewsByTripId(tripId);
      if (!reviews)
        throw new AppError(
          true,
          'getReviewsByTripId_Error',
          HttpStatusCode.NotFound,
          'No Reviews found for this trip'
        );
      return reviews;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves reviews by user ID.
   * @param userId - The ID of the user.
   * @returns A promise that resolves to the reviews for the specified user.
   * @throws {AppError} If no reviews are found for the user.
   */
  async getReviewsByUserId(userId: string) {
    try {
      const reviews = await this.reviewsDao.getReviewsByUserId(userId);
      if (!reviews)
        throw new AppError(
          true,
          'getReviewsByUserId_Error',
          HttpStatusCode.NotFound,
          'No Reviews found for this user'
        );
      return reviews;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a review by its ID.
   * @param reviewId - The ID of the review to retrieve.
   * @returns The review object if found, otherwise throws an error.
   * @throws {AppError} If the review is not found.
   */
  async getById(reviewId: string) {
    try {
      const review = await this.reviewsDao.getById(reviewId);
      if (!review)
        throw new AppError(
          true,
          'getById_Error',
          HttpStatusCode.NotFound,
          'Review not found'
        );
      return review;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a review by its ID.
   * @param reviewId - The ID of the review to delete.
   * @returns The ID of the deleted review.
   * @throws {AppError} If the review is not found.
   * @throws {Error} If an error occurs while deleting the review.
   */
  async deleteById(reviewId: string) {
    try {
      const review = await this.reviewsDao.getById(reviewId);
      if (!review)
        throw new AppError(
          true,
          'deleteById_Error',
          HttpStatusCode.NotFound,
          'Review not found'
        );
      await this.reviewsDao.deleteById(reviewId);
      await this.tripsService.updateTripRating(review.tripId);
      return;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a review by its ID.
   *
   * @param {string} reviewId - The ID of the review to update.
   * @param {PatchReviewDto} reviewFields - The fields to update in the review.
   * @returns {Promise<string>} The ID of the updated review.
   * @throws {AppError} If the review is not found.
   * @throws {Error} If an error occurs while updating the review.
   */
  async updateById(reviewId: string, reviewFields: PatchReviewDto) {
    try {
      const review = await this.reviewsDao.getById(reviewId);
      if (!review)
        throw new AppError(
          true,
          'updateById_Error',
          HttpStatusCode.NotFound,
          'Review not found'
        );
      await this.reviewsDao.updateById(reviewId, reviewFields);
      await this.tripsService.updateTripRating(review.tripId);
      return reviewId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a list of reviews.
   *
   * @param limit - The maximum number of reviews to retrieve.
   * @param page - The page number of the reviews to retrieve.
   * @returns A Promise that resolves to an array of reviews.
   * @throws If an error occurs while retrieving the reviews.
   */
  async list(limit: number, page: number) {
    try {
      const reviews = await this.reviewsDao.list(limit, page);
      return reviews;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes reviews by trip ID.
   * @param tripId - The ID of the trip.
   * @throws {AppError} If no reviews are found for the specified trip.
   */
  async deleteReviewsByTripId(tripId: string) {
    try {
      const reviews = await this.reviewsDao.getReviewsByTripId(tripId);
      if (!reviews || reviews.length === 0)
        throw new AppError(
          true,
          'deleteReviewsByTripId_Error',
          HttpStatusCode.NotFound,
          'No Reviews found for this trip'
        );

      await this.reviewsDao.removeReviewsByTripId(tripId, reviews);
      await this.tripsService.updateTripRating(tripId);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes reviews by user ID.
   * @param {string} userId - The ID of the user.
   * @throws {AppError} If no reviews are found for the user.
   */
  async deleteReviewsByUserId(userId: string) {
    const deletedReviews = await this.getById(userId);

    if (!deletedReviews || deletedReviews.length === 0)
      throw new AppError(
        true,
        'getReviewsByUserId_Error',
        HttpStatusCode.NotFound,
        'No Reviews found for this user'
      );

    await this.reviewsDao.deleteReviewsByUserId(userId);

    const tripIdsToUpdate = [
      ...new Set(deletedReviews.map((review) => review.tripId)),
    ];

    for (const tripId of tripIdsToUpdate) {
      await this.tripsService.updateTripRating(tripId as string); //TODO: to come back to this
    }
  }
}

export { ReviewsService };
