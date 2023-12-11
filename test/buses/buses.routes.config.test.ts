import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongoose from 'mongoose';
import mocha from 'mocha';
import bcrypt from 'bcryptjs';

import app, { appServer } from '../../src/app';
import mongooseService from '../../src/common/service/mongoose.service';

const User = {
  _id: '11223344',
  email: `sami${shortid.generate()}@gmail.com`,
  password: bcrypt.hashSync('123456', 10),
  firstName: 'sami',
  lastName: 'malik',
  image: 'default.jpg',
  permissionFlags: 1,
};

const TripGuide = {
  _id: '1122334455',
  email: `sami${shortid.generate()}@gmail.com`,
  password: bcrypt.hashSync('123456', 10),
  firstName: 'sami',
  lastName: 'malik',
  image: 'default.jpg',
  permissionFlags: 3,
};

const Admin = {
  _id: '112233445566',
  email: `sami${shortid.generate()}@gmail.com`,
  password: bcrypt.hashSync('123456', 10),
  firstName: 'sami',
  lastName: 'malik',
  image: 'default.jpg',
  permissionFlags: 7,
};

const Bus = {
  _id: '11223344556677',
  busModel: 'busModel',
  seats: 10,
  busType: 'busType',
};

let BusId = '';
let accessToken = '';

describe('Buses Routes', () => {
  let request: supertest.SuperAgentTest;
  before(async function () {
    mongooseService.connectWithRetry();
    await mongooseService.insertTestUsers([User, TripGuide, Admin]);
    await mongooseService.insertTestData('Bus', [Bus]);
    request = supertest.agent(app);
  });

  after(async function () {
    await mongooseService.deleteTestData('Bus');
    await mongooseService.deleteTestData('User');
    await new Promise((resolve, reject) => {
      appServer.close(() => {
        mongoose.connection.close(resolve);
      });
    });
  });

  describe('Anyonmus user', () => {
    it('should not allow a GET to /v1/buses', async () => {
      const res = await request.get('/v1/buses');
      expect(res.status).to.equal(401);
    });

    it('should not allow a POST to /v1/buses', async () => {
      const res = await request.post('/v1/buses');
      expect(res.status).to.equal(401);
    });
  });

  describe('User', () => {
    it('should allow a POST to /v1/login', async function () {
      const response = await request.post('/v1/login').send({
        email: User.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should not allow a GET to /v1/buses', async () => {
      const response = await request
        .get('/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a POST to /v1/buses', async () => {
      const response = await request
        .post('/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          busModel: 'busModel',
          seats: 10,
          busType: 'busType',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a GET to /v1/buses/:busId', async () => {
      const response = await request
        .get('/v1/buses/123456')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a PATCH to /v1/buses/:busId', async () => {
      const response = await request
        .patch('/v1/buses/123456')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          busModel: 'busModel',
          seats: 10,
          busType: 'busType',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a DELETE to /v1/buses/:busId', async () => {
      const response = await request
        .delete('/v1/buses/123456')
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
    it('should allow a POST to /v1/login', async function () {
      const response = await request.post('/v1/login').send({
        email: TripGuide.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should allow a GET to /v1/buses', async () => {
      const response = await request
        .get('/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should not allow a POST to /v1/buses', async () => {
      const response = await request
        .post('/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          busModel: 'busModel',
          seats: 10,
          busType: 'busType',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should allow a GET to /v1/buses/:busId', async () => {
      const response = await request
        .get(`/v1/buses/${Bus._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
    });

    it('should not allow a PATCH to /v1/buses/:busId', async () => {
      const response = await request
        .patch(`/v1/buses/${Bus._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          busModel: 'busModel',
          seats: 10,
          busType: 'busType',
        });

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow a DELETE to /v1/buses/:busId', async () => {
      const response = await request
        .delete(`/v1/buses/${Bus._id}`)
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

  describe('Admin', () => {
    it('should allow a POST to /v1/login', async function () {
      const response = await request.post('/v1/login').send({
        email: Admin.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should allow a GET to /v1/buses', async () => {
      const response = await request
        .get('/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should allow a POST to /v1/buses', async () => {
      const response = await request
        .post('/v1/buses')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          busModel: 'busModel',
          seats: 10,
          busType: 'busType',
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
      BusId = response.body._id;
    });

    it('should allow a GET to /v1/buses/:busId', async () => {
      const response = await request
        .get(`/v1/buses/${BusId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
    });

    it('should allow a PATCH to /v1/buses/:busId', async () => {
      const response = await request
        .patch(`/v1/buses/${BusId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          busModel: 'UpdatedbusModel',
          seats: 20,
          busType: 'UpdatedbusType',
        });

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('object');
    });

    it('should allow a DELETE to /v1/buses/:busId', async () => {
      const response = await request
        .delete(`/v1/buses/${BusId}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(204);
      expect(response.body).to.be.an('object');
    });

    it('should allow a GET to /v1/logout', async () => {
      const response = await request
        .get('/v1/logout')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
    });
  });
});
