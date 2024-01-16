import debug from 'debug';
import { inject, injectable } from 'inversify';

import { CRUD } from '../../common/interfaces/crud.interface';
import reviewsDao, { ReviewsDao } from '../daos/reviews.dao';
import { CreateReviewDto } from '../dtos/create.review.dto';
import { PatchReviewDto } from '../dtos/patch.review.dto';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:reviews-service');

class ReviewsService implements CRUD {
  constructor(private reviewsDao: ReviewsDao) {
    log('Created new instance of ReviewsService');
  }
  async getReviewsByTripId(tripId: string) {
    return await this.reviewsDao.getReviewsByTripId(tripId);
  }

  async getReviewsByUserId(userId: string) {
    return await this.reviewsDao.getReviewsByUserId(userId);
  }

  async getById(reviewId: string) {
    return await this.reviewsDao.getReviewById(reviewId);
  }

  async create(reviewFields: CreateReviewDto) {
    return await this.reviewsDao.addReview(reviewFields);
  }

  async updateById(reviewId: string, reviewFields: PatchReviewDto) {
    return await this.reviewsDao.updateReviewById(reviewId, reviewFields);
  }

  async deleteById(reviewId: string) {
    return await this.reviewsDao.removeReviewById(reviewId);
  }

  async list() {
    return await this.reviewsDao.listReviews();
  }

  async removeReviewsByTripId(tripId: string) {
    return await this.reviewsDao.removeReviewsByTripId(tripId);
  }

  async removeReviewsByUserId(userId: string) {
    return await this.reviewsDao.removeReviewsByUserId(userId);
  }
}

export { ReviewsService };
export default new ReviewsService(reviewsDao);
