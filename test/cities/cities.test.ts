import app, { appServer } from '../../src/app';
import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongooseService from '../../src/common/service/mongoose.service';
import mongoose from 'mongoose';

let firstUserIdTest = '';
let firstcityIdTest = '';
let accessToken = '';

const firstUserBody = {
  email: `mas+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'testUserFirstName',
  lastName: 'testUserLastName',
};

const newFirstCity = {
  cityName: 'testCityName',
  location: 'testLocation',
};

describe('city endpoints', function () {
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
    it('should not allow a POST to /cities', async function () {
      const response = await request
        .post('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstCity);
      expect(response.status).to.equal(401);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
    });
  });

  describe('with a valid token and permissions', function () {
    it('should allow a PATCH to /users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${firstUserIdTest}/permissionFlags/7`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          permissionFlags: 7,
        });
      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
      expect(response.body.accessToken).to.be.a('string');

      accessToken = response.body.accessToken;
    });

    it('should allow a POST to /cities', async function () {
      const response = await request
        .post('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(newFirstCity);
      expect(response.status).to.equal(201);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      firstcityIdTest = response.body._id;
    });

    it('should allow a GET from /cities', async function () {
      const response = await request
        .get('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
    });

    it('should allow a PATCH to /cities/:cityId', async function () {
      const response = await request
        .patch(`/v1/cities/${firstcityIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ cityName: 'fes' });
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
    });

    it('should allow a GET from /cities/:cityId', async function () {
      const response = await request
        .get(`/v1/cities/${firstcityIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body.cityName).to.equal('fes');
    });

    it('should allow a DELETE to /cities/:cityId', async function () {
      const response = await request
        .delete(`/v1/cities/${firstcityIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`);
      expect(response.status).to.equal(204);
    });
  });
});
