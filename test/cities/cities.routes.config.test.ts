import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongoose from 'mongoose';
import mocha from 'mocha';
import bcrypt from 'bcryptjs';

import app, { appServer } from '../../src/app';
import mongooseService from '../../src/common/service/mongoose.service';

const User = {
  _id: shortid.generate(),
  email: `sami${shortid.generate()}@gmail.com`,
  password: bcrypt.hashSync('123456', 10),
  firstName: 'sami',
  lastName: 'malik',
  image: 'default.jpg',
  permissionFlags: 1,
};

const TripGuide = {
  _id: shortid.generate(),
  email: `sami${shortid.generate()}@gmail.com`,
  password: bcrypt.hashSync('123456', 10),
  firstName: 'sami',
  lastName: 'malik',
  image: 'default.jpg',
  permissionFlags: 3,
};

const Admin = {
  _id: shortid.generate(),
  email: `sami${shortid.generate()}@gmail.com`,
  password: bcrypt.hashSync('123456', 10),
  firstName: 'sami',
  lastName: 'malik',
  image: 'default.jpg',
  permissionFlags: 7,
};

const City = {
  _id: shortid.generate(),
  cityName: 'Lahore',
  location: {
    type: 'Point',
    coordinates: [74.3436, 31.5497],
  },
};

let accessToken = '';
let cityId = '';

describe('Cities Routes', () => {
  let request: supertest.SuperAgentTest;
  before(async function () {
    mongooseService.connectWithRetry();
    await mongooseService.insertTestUsers([User, TripGuide, Admin]);
    await mongooseService.insertTestData('City', [City]);
    request = supertest.agent(app);
  });

  after(async function () {
    await mongooseService.deleteTestData('City');
    await mongooseService.deleteTestData('User');
    await new Promise((resolve, reject) => {
      appServer.close(() => {
        mongoose.connection.close(resolve);
      });
    });
  });

  describe('Anyonmus user', () => {
    it('should not allow a GET to /v1/cities', async () => {
      const response = await request.get('/v1/cities');
      expect(response.status).to.equal(401);
    });

    it('should not allow a POST to /v1/cities', async () => {
      const response = await request.post('/v1/cities');
      expect(response.status).to.equal(401);
    });
  });

  describe('User', () => {
    it('should allow a POST to /v1/login', async () => {
      const response = await request.post('/v1/login').send({
        email: User.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should not allow a GET to /v1/cities', async () => {
      const response = await request
        .get('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a POST to /v1/cities', async () => {
      const response = await request
        .post('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          cityName: 'Lahore',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a GET to /v1/cities/:cityId', async () => {
      const response = await request
        .get(`/v1/cities/${City._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a PATCH to /v1/cities/:cityId', async () => {
      const response = await request
        .patch(`/v1/cities/${City._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          cityName: 'Lahore',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a DELETE to /v1/cities/:cityId', async () => {
      const response = await request
        .delete(`/v1/cities/${City._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should allow a GET to /v1/logout', async () => {
      const response = await request
        .get('/v1/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
    });
  });

  describe('TripGuide', () => {
    it('should allow a POST to /v1/login', async () => {
      const response = await request.post('/v1/login').send({
        email: TripGuide.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should allow a GET to /v1/cities', async () => {
      const response = await request
        .get('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should allow a POST to /v1/cities', async () => {
      const response = await request
        .post('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          cityName: 'Milan',
          location: {
            type: 'Point',
            coordinates: [74.3436, 31.5497],
          },
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
    });

    it('should allow a GET to /v1/cities/:cityId', async () => {
      const response = await request
        .get(`/v1/cities/${City._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
    });

    it('should not allow a PATCH to /v1/cities/:cityId', async () => {
      const response = await request
        .patch(`/v1/cities/${City._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          cityName: 'London',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a DELETE to /v1/cities/:cityId', async () => {
      const response = await request
        .delete(`/v1/cities/${City._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
    });

    it('should allow a GET to /v1/logout', async () => {
      const response = await request
        .get('/v1/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
    });
  });

  describe('Admin', () => {
    it('should allow a POST to /v1/login', async () => {
      const response = await request.post('/v1/login').send({
        email: Admin.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should allow a GET to /v1/cities', async () => {
      const response = await request
        .get('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should allow a POST to /v1/cities', async () => {
      const response = await request
        .post('/v1/cities')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          cityName: 'Casa',
          location: {
            type: 'Point',
            coordinates: [74.3436, 31.5497],
          },
        });

      cityId = response.body._id;
      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
    });

    it('should allow a GET to /v1/cities/:cityId', async () => {
      const response = await request
        .get(`/v1/cities/${cityId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
    });

    it('should allow a PATCH to /v1/cities/:cityId', async () => {
      const response = await request
        .patch(`/v1/cities/${cityId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          cityName: 'Tanja',
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
    });

    it('should allow a DELETE to /v1/cities/:cityId', async () => {
      const response = await request
        .delete(`/v1/cities/${cityId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(204);
    });

    it('should allow a GET to /v1/logout', async () => {
      const response = await request
        .get('/v1/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
    });
  });
});
