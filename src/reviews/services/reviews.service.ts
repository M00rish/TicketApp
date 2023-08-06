import reviewsDao from '../daos/reviews.dao';
import { CreateReviewDto } from '../dtos/create.review.dto';
import { PatchReviewDto } from '../dtos/patch.review.dto';

class ReviewsService {
  async getReviewsByTripId(tripId: string) {
    return await reviewsDao.getReviewsByTripId(tripId);
  }

  async getReviewsByUserId(userId: string) {
    return await reviewsDao.getReviewsByUserId(userId);
  }

  async getReviewById(reviewId: string) {
    return await reviewsDao.getReviewById(reviewId);
  }

  async createReview(reviewFields: CreateReviewDto) {
    return await reviewsDao.addReview(reviewFields);
  }

  async updateReviewById(reviewId: string, reviewFields: PatchReviewDto) {
    return await reviewsDao.updateReviewById(reviewId, reviewFields);
  }

  async removeReviewById(reviewId: string) {
    return await reviewsDao.removeReviewById(reviewId);
  }

  async removeReviewsByTripId(tripId: string) {
    return await reviewsDao.removeReviewsByTripId(tripId);
  }

  async removeReviewsByUserId(userId: string) {
    return await reviewsDao.removeReviewsByUserId(userId);
  }
}

export default new ReviewsService();
