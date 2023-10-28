import debug from 'debug';

import mongooseService from '../../common/service/mongoose.service';
import shortid from 'shortid';
import tripsDao from '../../trips/daos/trips.dao';
import usersDao from '../../users/daos/users.dao';
import { CreateReviewDto } from '../dtos/create.review.dto';
import { PatchReviewDto } from '../dtos/patch.review.dto';
import AppError from '../../common/types/appError';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';

const log: debug.IDebugger = debug('app:reviews-dao');

class ReviewsDao {
  constructor() {
    log('created new instance of ReviewsDao');
  }

  async addReview(reviewFields: CreateReviewDto) {
    try {
      const reviewId = shortid.generate();
      const review = new this.Review({
        _id: reviewId,
        ...reviewFields,
      });

      await review.save();
      this.updateTripRating(review.tripId);
      return reviewId;
    } catch (error: any) {
      const err = new AppError(
        false,
        'addReview_Error',
        HttpStatusCode.InternalServerError,
        error.message
      );
      throw err;
    }
  }

  async getReviewsByTripId(tripId: string) {
    try {
      const reviews = await this.Review.find({ tripId: tripId }).exec();
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

  async getReviewsByUserId(userId: string) {
    try {
      const reviews = await this.Review.find({ userId: userId }).exec();
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

  async getReviewById(reviewId: string) {
    try {
      const review = await this.Review.findOne({ _id: reviewId }).exec();
      if (!review)
        throw new AppError(
          true,
          'getReviewsByUserId_Error',
          HttpStatusCode.NotFound,
          'Review not found'
        );
      return review;
    } catch (error) {
      throw error;
    }
  }

  async removeReviewById(reviewId: string) {
    try {
      const review = await this.Review.findOne({ _id: reviewId }).exec();
      if (!review)
        throw new AppError(
          true,
          'getReviewsByUserId_Error',
          HttpStatusCode.NotFound,
          'Review not found'
        );

      await review.remove();
      this.updateTripRating(review.tripId);
    } catch (error) {
      throw error;
    }
  }

  async removeReviewsByTripId(tripId: string) {
    try {
      const Reviews = await this.Review.find({ tripId: tripId }).exec();

      if (!Reviews || Reviews.length === 0)
        throw new AppError(
          true,
          'getReviewsByUserId_Error',
          HttpStatusCode.NotFound,
          'No Reviews found for this trip'
        );

      await Promise.all(
        Reviews.map(async (review) => {
          await this.Review.findByIdAndDelete(review._id).exec();
        })
      );
      this.updateTripRating(tripId);
    } catch (error) {
      throw error;
    }
  }

  async removeReviewsByUserId(userId: string) {
    try {
      const deletedReviews = await this.Review.find({ userId: userId })
        .select('_id tripId')
        .exec();

      if (!deletedReviews || deletedReviews.length === 0)
        throw new AppError(
          true,
          'getReviewsByUserId_Error',
          HttpStatusCode.NotFound,
          'No Reviews found for this user'
        );

      const tripIdsToUpdate = [
        ...new Set(deletedReviews.map((review) => review.tripId)),
      ];

      await this.Review.deleteMany({ userId: userId }).exec();

      for (const tripId of tripIdsToUpdate) {
        await this.updateTripRating(tripId);
      }
    } catch (error) {
      throw error;
    }
  }

  async updateReviewById(reviewId: string, reviewFields: PatchReviewDto) {
    try {
      const review = await this.Review.findOneAndUpdate(
        { _id: reviewId },
        { $set: reviewFields },
        { new: true }
      ).exec();
      if (!review)
        throw new AppError(
          true,
          'getReviewsByUserId_Error',
          HttpStatusCode.NotFound,
          'Review not found'
        );

      this.updateTripRating(review.tripId);
      return review._id;
    } catch (error) {
      throw error;
    }
  }

  async listReviews(limit = 25, page = 0) {
    try {
      const reviews = await this.Review.find()
        .limit(limit)
        .skip(limit * page)
        .exec();
      return reviews;
    } catch (error) {
      throw error;
    }
  }

  async updateTripRating(tripId: string) {
    const reviews = await this.Review.find({ tripId: tripId }).exec();
    if (reviews.length === 0) {
      await tripsDao.Trip.findOneAndUpdate(
        { _id: tripId },
        { $set: { ratings: 0 } },
        { new: true }
      ).exec();
      return;
    }
    const ratingSum = reviews.reduce((acc, review) => acc + review.ratings, 0);
    const ratingAvg = (ratingSum / reviews.length).toFixed(1);

    await tripsDao.Trip.findOneAndUpdate(
      { _id: tripId },
      { $set: { ratings: ratingAvg } },
      { new: true }
    ).exec();
  }
  schema = mongooseService.getMongoose().Schema;

  reviewSchema = new this.schema(
    {
      _id: { type: this.schema.Types.String },
      tripId: {
        type: this.schema.Types.String,
        ref: tripsDao.Trip,
        required: true,
      },
      userId: {
        type: this.schema.Types.String,
        ref: usersDao.User,
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

  Review = mongooseService.getMongoose().model('Review', this.reviewSchema);
}

export default new ReviewsDao();
