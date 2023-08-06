import app, { appServer } from '../../src/app';
import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongooseService from '../../src/common/service/mongoose.service';
import mongoose from 'mongoose';

let firstUserIdTest = '';
let firstTripIdTest = '';
let firstReviewIdTest = '';
let accessToken = '';

const firstUserBody = {
  email: `mas+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'testUserFirstName',
  lastName: 'testUserLastName',
};

const newFirstReview = {
  reviewText: 'Awesome!!',
  ratings: 2.5,
};

describe('review endpoints', function () {
  let request: supertest.SuperAgentTest;
  before(function () {
    mongooseService.connectWithRetry();
    request = supertest.agent(app);
  });
  after(function (done) {
    appServer.close(() => {
      mongoose.connection.close(done);
    });
  });

  it('should allow a POST to /users', async function () {
    const response = await request.post('/v1/users').send(firstUserBody);
    expect(response.status).to.equal(201);
    expect(response.body).not.to.be.empty;
    expect(response.body).to.be.an('Object');
    expect(response.body._id).to.be.a('string');
    firstUserIdTest = response.body._id;
  });

  it('should allow a login to /login', async function () {
    const response = await request
      .post('/v1/login')
      .send({ email: firstUserBody.email, password: firstUserBody.password });
    expect(response.status).to.equal(200);
    expect(response.body).not.to.be.empty;
    expect(response.body).to.be.an('Object');
    expect(response.body.accessToken).to.be.a('string');
    accessToken = response.body.accessToken;
  });

  describe('with a valid token', function () {
    it('should not allow a POST to /trips', async function () {
      const response = await request
        .post('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstReview);
      expect(response.status).to.equal(401);
    });

    it('should allow a GET to /trips', async function () {
      const response = await request
        .get('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;

      firstTripIdTest = response.body[0]._id;
    });

    it('should allow a POST to /trips/:tripId/reviews', async function () {
      const response = await request
        .post(`/v1/trips/${firstTripIdTest}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstReview);
      expect(response.status).to.equal(201);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');

      firstReviewIdTest = response.body._id;
    });

    it('should allow a GET to /trips/:tripId/reviews', async function () {
      const response = await request
        .get(`/v1/trips/${firstTripIdTest}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Array');
      expect(response.body[0]._id).to.be.a('string');
    });

    it('should not allow a DELETE to /trips/:tripId/reviews', async function () {
      const response = await request
        .delete(`/v1/trips/${firstTripIdTest}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(401);
    });

    it('should allow a GET to /users/:userId/reviews', async function () {
      const response = await request
        .get(`/v1/users/${firstUserIdTest}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Array');
      expect(response.body[0]._id).to.be.a('string');
    });

    it('should allow a GET to /reviews/:reviewId', async function () {
      const response = await request
        .get(`/v1/reviews/${firstReviewIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
    });

    it('should allow a PATCH to /reviews/:reviewId', async function () {
      const response = await request
        .patch(`/v1/reviews/${firstReviewIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstReview);
      expect(response.status).to.equal(204);
    });

    it('should allow a DELETE to /users/:userId/reviews', async function () {
      const response = await request
        .delete(`/v1/users/${firstUserIdTest}/reviews`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(204);
    });

    // it('should allow a DELETE to /reviews/:reviewId', async function () {
    //   const response = await request
    //     .delete(`/v1/reviews/${firstUserIdTest}`)
    //     .set('Authorization', `Bearer ${accessToken}`);
    //   expect(response.status).to.equal(204);
    // }); TODO: fix this test and add admin tests
  });
});
