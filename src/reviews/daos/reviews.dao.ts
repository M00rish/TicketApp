import debug from 'debug';

import { MongooseService } from '../../common/service/mongoose.service';
import shortid from 'shortid';
import { TripsDao } from '../../trips/daos/trips.dao';
import { UsersDao } from '../../users/daos/users.dao';
import { CommonService } from '../../common/service/common.service';

import { CreateReviewDto } from '../dtos/create.review.dto';
import { PatchReviewDto } from '../dtos/patch.review.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:reviews-dao');

class ReviewsDao {
  constructor(private commonService: CommonService) {
    log('Created new instance of ReviewsDao');
    this.Review = this.commonService.getOrCreateModel(
      'Review',
      this.reviewSchema
    );
  }

  /**
   * Creates a new review.
   * @param reviewFields - The fields of the review to be created.
   * @returns The ID of the created review.
   */
  async create(reviewFields: CreateReviewDto) {
    const reviewId = shortid.generate();
    const review = new this.Review({
      _id: reviewId,
      ...reviewFields,
    });

    await review.save();
    return reviewId;
  }

  /**
   * Retrieves reviews by trip ID.
   * @param tripId - The ID of the trip.
   * @returns A promise that resolves to an array of reviews.
   */
  async getReviewsByTripId(tripId: string) {
    return await this.Review.find({ tripId: tripId }).exec();
  }

  /**
   * Retrieves reviews by user ID.
   * @param {string} userId - The ID of the user.
   * @returns {Promise<Review[]>} - A promise that resolves to an array of reviews.
   */
  async getReviewsByUserId(userId: string) {
    return await this.Review.find({ userId: userId }).exec();
  }

  /**
   * Retrieves a review by its ID.
   * @param reviewId - The ID of the review to retrieve.
   * @returns A promise that resolves to the review object.
   */
  async getById(reviewId: string) {
    return await this.Review.findOne({ _id: reviewId }).exec();
  }

  /**
   * Deletes a review by its ID.
   * @param {string} reviewId - The ID of the review to delete.
   * @returns {Promise<void>} - A promise that resolves when the review is deleted.
   */
  async deleteById(reviewId: string) {
    await this.Review.findByIdAndDelete(reviewId).exec();
  }

  /**
   * Updates a review by its ID.
   * @param {string} reviewId - The ID of the review to update.
   * @param {PatchReviewDto} reviewFields - The fields to update in the review.
   * @returns {Promise<void>} - A promise that resolves when the update is complete.
   */
  async updateById(reviewId: string, reviewFields: PatchReviewDto) {
    await this.Review.findOneAndUpdate(
      { _id: reviewId },
      { $set: reviewFields },
      { new: true }
    ).exec();
  }

  /**
   * Retrieves a list of reviews.
   * @param limit - The maximum number of reviews to retrieve. Default is 25.
   * @param page - The page number of reviews to retrieve. Default is 0.
   * @returns A promise that resolves to an array of reviews.
   */
  async list(limit = 25, page = 0) {
    return await this.Review.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
  }

  /**
   * Removes reviews by trip ID.
   * @param {string} tripId - The ID of the trip.
   * @param {Array} reviews - The array of reviews to be removed.
   * @returns {Promise<void>} - A promise that resolves when all reviews are removed.
   */
  async removeReviewsByTripId(tripId: string, reviews) {
    await Promise.all(
      reviews.map(async (review) => {
        await this.Review.findByIdAndDelete(review._id).exec();
      })
    );
  }

  /**
   * Deletes reviews by user ID.
   * @param {string} userId - The ID of the user whose reviews should be deleted.
   * @returns {Promise<void>} - A promise that resolves when the reviews are deleted.
   */
  async deleteReviewsByUserId(userId: string) {
    await this.Review.deleteMany({ userId: userId }).exec();
  }

  schema = this.commonService.getMongoose().Schema;

  reviewSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      tripId: {
        type: this.schema.Types.String,
        ref: this.commonService.getOrCreateModel('Trip'),
        required: true,
      },
      userId: {
        type: this.schema.Types.String,
        ref: this.commonService.getOrCreateModel('User'),
        required: true,
      },
      reviewText: { type: String, required: true },
      ratings: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'rating must be above 0'],
        max: [5, 'rating must be below 5'],
      },
      createdAt: Date,
      updatedAt: Date,
    },
    { id: false }
  ).pre('save', function (next) {
    if (this) {
      const now = new Date();
      if (!this.createdAt) {
        this.createdAt = now;
      }
      this.updatedAt = now;
    }
    next();
  });

  Review = this.commonService.getOrCreateModel('Review', this.reviewSchema);
}

export { ReviewsDao };
