import 'mocha';
import sinon from 'sinon';
import { expect } from 'chai';
import httpMocks from 'node-mocks-http';
import sinonMongoose from 'sinon-mongoose';

import { ReviewsDao } from '../../../src/reviews/daos/reviews.dao';
import { PermissionMiddleware } from '../../../src/common/middlewares/common.permission.middleware';
import AppError from '../../../src/common/types/appError';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';
import { permissionsFlags } from '../../../src/common/enums/common.permissionflag.enum';
import { ReviewsService } from '../../../src/reviews/services/reviews.service';

describe('CommonPermissionMiddleware', () => {
  describe('permissionsFlagsRequired', () => {
    let permissionMiddleware: PermissionMiddleware;

    beforeEach(() => {
      permissionMiddleware = new PermissionMiddleware(
        new ReviewsService(new ReviewsDao())
      );
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() if the user has the required permissions', () => {
      const request = httpMocks.createRequest();
      const response = httpMocks.createResponse();
      response.locals.jwt = { payload: { permissionFlags: '4' } };
      const next = sinon.spy();

      permissionMiddleware.permissionsFlagsRequired(4)(request, response, next);

      expect(next.calledOnce).to.be.true;
    });

    it('should call next() with an error if the user does not have the required permissions', () => {
      const request = httpMocks.createRequest();
      const response = httpMocks.createResponse();
      response.locals.jwt = { payload: { permissionFlags: '2' } };
      const next = sinon.spy();

      permissionMiddleware.permissionsFlagsRequired(4)(request, response, next);

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args[0]).to.be.instanceOf(AppError);
      expect(next.getCall(0).args[0].message).to.equal(
        "you're not authorized to perform this operation"
      );
      expect(next.getCall(0).args[0].statusCode).to.equal(
        HttpStatusCode.Unauthorized
      );
    });
  });

  describe('onlySameUserOrAdminCanAccess', () => {
    let permissionMiddleware: PermissionMiddleware;

    beforeEach(() => {
      permissionMiddleware = new PermissionMiddleware(
        new ReviewsService(new ReviewsDao())
      );
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() if the user ID in the request parameters matches the user ID in the JWT payload', () => {
      const request = httpMocks.createRequest({
        params: {
          userId: '123',
        },
      });
      const response = httpMocks.createResponse();
      response.locals.jwt = {
        payload: { permissionFlags: '4', userId: '123' },
      };
      const next = sinon.spy();

      permissionMiddleware.onlySameUserOrAdminCanAccess(
        request,
        response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args.length).to.equal(0);
    });

    it('should call next() if the user ID in the request parameters does not match the user ID in the JWT payload, but the user has admin permissions', () => {
      const request = httpMocks.createRequest({
        params: {
          userId: '123',
        },
      });
      const response = httpMocks.createResponse();
      response.locals.jwt = {
        payload: { permissionFlags: permissionsFlags.ADMIN, userId: '456' },
      };
      const next = sinon.spy();

      permissionMiddleware.onlySameUserOrAdminCanAccess(
        request,
        response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args.length).to.equal(0);
    });

    it('should call next() with an error if the user ID in the request parameters does not match the user ID in the JWT payload and the user does not have admin permissions', () => {
      const request = httpMocks.createRequest({
        params: {
          userId: '123',
        },
      });
      const response = httpMocks.createResponse();
      response.locals.jwt = {
        payload: { permissionFlags: '1', userId: '456' },
      };
      const next = sinon.spy();

      permissionMiddleware.onlySameUserOrAdminCanAccess(
        request,
        response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args[0]).to.be.instanceOf(AppError);
      expect(next.getCall(0).args[0].message).to.equal(
        "you're not authorized to perform this operation"
      );
      expect(next.getCall(0).args[0].statusCode).to.equal(
        HttpStatusCode.Unauthorized
      );
    });
  });

  describe('onlyAdminOrUserWhoCreatedReviewCanAccess', () => {
    let permissionMiddleware: PermissionMiddleware;
    let reviewsService: ReviewsService;
    let reviewsDao: ReviewsDao;

    beforeEach(() => {
      reviewsDao = new ReviewsDao();
      reviewsService = new ReviewsService(reviewsDao);
      permissionMiddleware = new PermissionMiddleware(reviewsService);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should call next() if the user has admin permissions', async () => {
      const request = httpMocks.createRequest({
        params: {
          reviewId: '123',
        },
      });
      const response = httpMocks.createResponse();
      response.locals.jwt = {
        payload: { permissionFlags: permissionsFlags.ADMIN, userId: '456' },
      };
      const next = sinon.spy();

      await permissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess(
        request,
        response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args.length).to.equal(0);
    });

    it('should call next() if the user is the one who created the review', async () => {
      const request = httpMocks.createRequest({
        params: {
          reviewId: '123',
        },
      });
      const response = httpMocks.createResponse();
      response.locals.jwt = {
        payload: { permissionFlags: '4', userId: '456' },
      };
      const next = sinon.spy();

      sinon.mock(reviewsService).expects('getById').withArgs('123').resolves({
        userId: '456',
        tripId: '123',
        ratings: 5,
        reviewText: 'Great trip!',
        _id: '789',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await permissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess(
        request,
        response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args.length).to.equal(0);
    });

    it('should call next() with an error if the user does not have admin permissions and is not the one who created the review', async () => {
      const request = httpMocks.createRequest({
        params: {
          reviewId: '123',
        },
      });
      const response = httpMocks.createResponse();
      response.locals.jwt = {
        payload: { permissionFlags: '1', userId: '456' },
      };
      const next = sinon.spy();

      sinon.mock(reviewsService).expects('getById').withArgs('123').resolves({
        userId: '122',
        tripId: '123',
        ratings: 5,
        reviewText: 'Cool trip!',
        _id: '123',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await permissionMiddleware.onlyAdminOrUserWhoCreatedReviewCanAccess(
        request,
        response,
        next
      );

      expect(next.calledOnce).to.be.true;
      expect(next.getCall(0).args[0]).to.be.instanceOf(AppError);
      expect(next.getCall(0).args[0].message).to.equal(
        "you're not authorized to perform this operation"
      );
      expect(next.getCall(0).args[0].statusCode).to.equal(
        HttpStatusCode.Unauthorized
      );
    });
  });
});
