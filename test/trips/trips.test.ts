import app, { appServer } from '../../src/app';
import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongooseService from '../../src/common/service/mongoose.service';
import mongoose from 'mongoose';
import mocha from 'mocha';
import tripsDao from '../../src/trips/daos/trips.dao';

let firstUserIdTest = '';
let firstTripIdTest = '';
let accessToken = '';

const firstUserBody = {
  email: `mas+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'testUserFirstName',
  lastName: 'testUserLastName',
};

const newFirstTrip = {
  departureCity: 'Berlin',
  arrivalCity: 'Paris',
  departureTime: '2021-01-01T00:00:00.000Z',
  arrivalTime: '2021-01-01T08:00:00.000Z',
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
    // tripsDao.removeAllTrips();
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

  describe('with a valid access token and admin permissions', function () {
    it('should allow a PATCH to /v1/users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${firstUserIdTest}/permissionFlags/7`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
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

    it('should allow a POST to /v1/trips', async function () {
      const response = await request
        .post('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstTrip);
      console.log(response.body);
      expect(response.status).to.equal(201);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      firstTripIdTest = response.body._id;
    });

    it('should allow a PATCH to /v1/trips/:tripId', async function () {
      const response = await request
        .patch(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ departureCity: 'Taza' });
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
    });

    it('should allow a GET to /v1/trips/:tripId', async function () {
      const response = await request
        .get(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      expect(response.body.departureCity).to.equal('Taza');
    });

    // it('should allow a DELETE to /v1/trips/:tripId', async function () {
    //   const response = await request
    //     .delete(`/v1/trips/${firstTripIdTest}`)
    //     .set('Authorization', `Bearer ${accessToken}`);
    //   expect(response.status).to.equal(204);
    // });

    it('should allow a GET to /v1/trips', async function () {
      const response = await request
        .get('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Array');
      expect(response.body[0]._id).to.be.a('string');
    });
  });

  describe('with a valid access token and trip guide permissions', function () {
    it('should allow a PATCH to /v1/users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${firstUserIdTest}/permissionFlags/3`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          permissionFlags: 3,
        });
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');

      accessToken = response.body.accessToken;
    });

    it('should not allow a POST to /v1/trips', async function () {
      const response = await request
        .post('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstTrip);
      expect(response.status).to.equal(401);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
    });

    it('should allow a PATCH to /v1/trips/:tripId', async function () {
      const response = await request
        .patch(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ departureCity: 'Tanja' });

      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
    });

    it('should allow a GET to /v1/trips/:tripId', async function () {
      const response = await request
        .get(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      expect(response.body.departureCity).to.equal('Tanja');
    });

    it('should not allow a DELETE to /v1/trips/:tripId', async function () {
      const response = await request
        .delete(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(401);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
    });

    it('should allow a GET to /v1/trips', async function () {
      const response = await request
        .get('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Array');
      expect(response.body[0]._id).to.be.a('string');
    });
  });

  describe('with a valid access token and user permission', function () {
    it('should not allow a POST to /v1/trips', async function () {
      const response = await request
        .post('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstTrip);
      expect(response.status).to.equal(401);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body.error).to.be.a('string');

      firstTripIdTest = response.body._id;
    });

    it('should allow a GET to /v1/trips', async function () {
      const response = await request
        .get('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('Array');

      console.log(response.body);
    });

    it('should allow a GET to /v1/trips/:tripId', async function () {
      const response = await request
        .get(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      console.log(firstTripIdTest);
      expect(response.status).to.equal(200);
    });

    it('should not allow a PATCH to /v1/trips/:tripId', async function () {
      const response = await request
        .patch(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ departureCity: 'Warsaw' });
      console.log(firstTripIdTest);
      expect(response.status).to.equal(401);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body.error).to.be.a('string');
    });

    it('should not allow a DELETE to /v1/trips/:tripId', async function () {
      const response = await request
        .delete(`/v1/trips/${firstTripIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(401);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body.error).to.be.a('string');
    });
  });
});
