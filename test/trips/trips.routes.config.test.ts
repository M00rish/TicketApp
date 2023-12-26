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

let accessToken = '';

describe('Trips Routes', function () {
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

  describe('Anonymous User', function () {
    it('should not allow a GET to /v1/trips', async function () {
      const response = await request.get('/v1/trips');

      expect(response.status).to.be.equal(401);
    });

    it('should not allow a POST on /v1/trips', async function () {
      const response = await request.post('/v1/trips');

      expect(response.status).to.be.equal(401);
    });
  });

  describe('User', function () {
    it('should allow a GET to /v1/login', async function () {
      const response = await request.post('/v1/login').send({
        email: User.email,
        password: '123456',
      });

      expect(response.status).to.be.equal(200);
      expect(response.body.accessToken).to.be.a('string');
      accessToken = response.body.accessToken;
    });

    it('should allow a GET to /v1/trips', async function () {
      const response = await request
        .get('/v1/trips')
        .set('Authorization', `Bearer ${accessToken}`);
      console.log(response.body);
      expect(response.status).to.be.equal(200);
      expect(response.body).to.be.an('array');
    });
  });
});
