import { CRUD } from '../../common/interfaces/crud.interface';
import reviewsDao from '../daos/reviews.dao';
import { CreateReviewDto } from '../dtos/create.review.dto';
import { PatchReviewDto } from '../dtos/patch.review.dto';

class ReviewsService implements CRUD {
  async getReviewsByTripId(tripId: string) {
    return await reviewsDao.getReviewsByTripId(tripId);
  }

  async getReviewsByUserId(userId: string) {
    return await reviewsDao.getReviewsByUserId(userId);
  }

  async getById(reviewId: string) {
    return await reviewsDao.getReviewById(reviewId);
  }

  async create(reviewFields: CreateReviewDto) {
    return await reviewsDao.addReview(reviewFields);
  }

  async updateById(reviewId: string, reviewFields: PatchReviewDto) {
    return await reviewsDao.updateReviewById(reviewId, reviewFields);
  }

  async deleteById(reviewId: string) {
    return await reviewsDao.removeReviewById(reviewId);
  }

  async list() {
    return await reviewsDao.listReviews();
  }

  async removeReviewsByTripId(tripId: string) {
    return await reviewsDao.removeReviewsByTripId(tripId);
  }

  async removeReviewsByUserId(userId: string) {
    return await reviewsDao.removeReviewsByUserId(userId);
  }
}

export default new ReviewsService();
