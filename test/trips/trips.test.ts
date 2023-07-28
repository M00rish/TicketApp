import app, { appServer } from '../../src/app';
import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongooseService from '../../src/common/service/mongoose.service';
import mongoose from 'mongoose';

let firstUserIdTest = '';
let firstTripIdTest = '';
let accessToken = '';

const firstUserBody = {
  email: `mas+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'testUserFirstName',
  lastName: 'testUserLastName',
};

const secondUserBody = {
  email: `koo+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'sad',
  lastName: 'nas',
};

const newFirstTrip = {
  startCity: 'Berlin',
  finishCity: 'Paris',
  startDate: '2021-01-01T00:00:00.000Z',
  finishDate: '2021-01-01T08:00:00.000Z',
  price: 100,
  seats: 50,
  busId: '1',
};

describe('trips endpoints', function () {
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
    const response = await request.post('/v1/login').send(firstUserBody);
    expect(response.status).to.equal(201);
    expect(response.body).not.to.be.empty;
    expect(response.body).to.be.an('Object');
    expect(response.body.accessToken).to.be.a('string');
    accessToken = response.body.accessToken;
  });

  describe('with a valid access token', function () {
    it('should allow a POST to /v1/trips', async function () {
      const response = await request
        .post('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstTrip);
      expect(response.status).to.equal(201);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      firstTripIdTest = response.body._id;
    });

    it('should allow a GET from /v1/trips', async function () {
      const response = await request
        .get('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Array');
      expect(response.body[0]._id).to.be.a('string');
    });

    it('should allow a GET from /v1/trips/:tripId', async function () {
      const response = await request
        .get(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
    });

    it('should not allow a PATCH to /v1/trips/:tripId', async function () {
      const response = await request
        .patch(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ startCity: 'Warsaw' });
      expect(response.status).to.equal(403);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      // expect(response.body.message).to.be.a('string');
    });

    it('should not allow a DELETE to /v1/trips/:tripId', async function () {
      const response = await request
        .delete(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(403);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
    });
  });
});
