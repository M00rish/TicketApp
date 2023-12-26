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

const body = {
  email: `sami${shortid.generate()}@gmail.com`,
  password: '123456',
  firstName: 'sami',
  lastName: 'malik',
};

let accessToken = '';

const newFirstName = 'markos';
const newLastName = 'Faraco';
const newFirstName2 = 'liza';
const newLastName2 = 'may';

describe('users and auth', function () {
  let request: supertest.SuperAgentTest;
  before(async function () {
    await mongooseService.connectWithRetry();
    await mongooseService.insertTestUsers([User, TripGuide, Admin]);
    request = supertest.agent(app);
  });

  after(async function () {
    await mongooseService.deleteTestData('User');
    await new Promise((resolve, reject) => {
      appServer.close(() => {
        mongoose.connection.close(resolve);
      });
    });
  });

  describe('Anynomous User', async function () {
    it('should allow a POST to /v1/users', async function () {
      const response = await request.post('/v1/users').send(body);

      expect(response.status).to.equal(201);
      expect(response.body._id).to.be.a('string');
    });

    it('should allow a POST to /v1/users and return error message when email already exists', async function () {
      const response = await request.post('/v1/users').send(body);

      expect(response.status).to.equal(400);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('EmailValidationError');
    });

    it('should not allow a GET to /v1/users', async function () {
      const response = await request.get('/v1/users');

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('LoginError');
    });
  });

  describe('User', function () {
    it('should allow a POST to /v1/login and return error message when password or email is wrong', async function () {
      const response = await request.post('/v1/login').send({
        email: User.email,
        password: '1234567',
      });

      expect(response.status).to.equal(404);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('LoginError');
    });

    it('should allow a POST to /v1/login', async function () {
      const response = await request.post('/v1/login').send({
        email: User.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should not allow a GET to /v1/users', async function () {
      const response = await request
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow an all delete to /v1/users/', async function () {
      const response = await request
        .delete('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should allow a PATCH to /v1/users/:userId with same id', async function () {
      const response = await request
        .patch(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName,
          lastName: newLastName,
        });

      expect(response.status).to.equal(200);
    });

    it('should allow a GET to /v1/users/:userId with same id', async function () {
      const response = await request
        .get(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body.firstName).to.equal(newFirstName);
      expect(response.body.lastName).to.equal(newLastName);
    });

    it('should not allow a GET to /v1/users/:userId with different id', async function () {
      const response = await request
        .get(`/v1/users/${TripGuide._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
    });

    it('should not allow a POST to /v1/users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${User._id}/permissionFlags/3`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should allow a delete to /v1/users/:userId with same id', async function () {
      const response = await request
        .delete(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(204);
    });

    it("should not allow a delete to /v1/users/:userId with another user's id", async function () {
      const response = await request
        .delete(`/v1/users/${TripGuide._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
    });
  });

  describe('TripGuide Role', function () {
    it('should allow a POST to /v1/users/login', async function () {
      const response = await request.post('/v1/login').send({
        email: TripGuide.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should not allow a GET to /v1/users', async function () {
      const response = await request
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should not allow an all delete to /v1/users/', async function () {
      const response = await request
        .delete('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should allow a GET to /v1/users/:userId with same id', async function () {
      const response = await request
        .get(`/v1/users/${TripGuide._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
    });

    it('should not allow a GET to /v1/users/:userId with different id', async function () {
      const response = await request
        .get(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });

    it('should allow a PATCH to /v1/users/:userId with same id', async function () {
      const response = await request
        .patch(`/v1/users/${TripGuide._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName2,
          lastName: newLastName2,
        });

      expect(response.status).to.equal(200);
    });

    it('should allow a delete to /v1/users/:userId with same id', async function () {
      const response = await request
        .delete(`/v1/users/${TripGuide._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(204);
    });

    it("should not allow a delete to /v1/users/:userId with another user's id", async function () {
      const response = await request
        .delete(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
    });

    it('should not allow a POST to /v1/users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${TripGuide._id}/permissionFlags/3`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(401);
      expect(response.body.error).to.be.an('object');
      expect(response.body.error.name).to.equal('PermissionFlagsError');
    });
  });

  describe('Admin Role', function () {
    it('should allow a POST to /v1/users/login', async function () {
      const response = await request.post('/v1/login').send({
        email: Admin.email,
        password: '123456',
      });

      expect(response.status).to.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should allow a GET to /v1/users', async function () {
      const response = await request
        .get('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
      expect(response.body).to.be.an('array');
    });

    it('should allow a GET to /v1/users/:userId with same id', async function () {
      const response = await request
        .get(`/v1/users/${Admin._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(200);
    });

    it('should allow a GET to /v1/users/:userId with different id', async function () {
      const response = await request
        .get(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(404);
    });

    it('should allow a PATCH to /v1/users/:userId with same id', async function () {
      const response = await request
        .patch(`/v1/users/${Admin._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName2,
          lastName: newLastName2,
        });

      expect(response.status).to.equal(200);
    });

    it('should allow a PATCH to /v1/users/:userId with different id', async function () {
      const response = await request
        .patch(`/v1/users/${User._id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName2,
          lastName: newLastName2,
        });

      expect(response.status).to.equal(404);
    });

    it('should allow a POST to /v1/users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${User._id}/permissionFlags/3`)
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(404);
    });

    it('should allow an all delete to /v1/users/', async function () {
      const response = await request
        .delete('/v1/users')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).to.equal(204);
    });
  });
});
