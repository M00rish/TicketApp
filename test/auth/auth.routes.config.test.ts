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

let accessToken = '';
let refreshToken = '';

describe('AuthRoutes', () => {
  let request: supertest.SuperAgentTest;
  before(async function () {
    mongooseService.connectWithRetry();
    await mongooseService.insertTestUsers([User]);
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

  it('should allow a POST to /v1/users/login and return error message when password or email is wrong', async function () {
    const response = await request.post('/v1/login').send({
      email: User.email,
      password: '1234567',
    });

    expect(response.status).to.equal(404);
    expect(response.body.error).to.be.an('object');
    expect(response.body.error.name).to.equal('LoginError');
  });

  it('should allow a POST to /v1/users/login', async function () {
    const response = await request.post('/v1/login').send({
      email: User.email,
      password: '123456',
    });

    expect(response.status).to.equal(200);
    expect(response.body.accessToken).to.be.a('string');
    accessToken = response.body.accessToken;
    refreshToken = response.headers['set-cookie'][0];
  });

  it('should allow a POST to /v1/refresh-token', async function () {
    const response = await request
      .post('/v1/refresh-token')
      .set({ Authorization: `Bearer ${accessToken}` })
      .set('Cookie', refreshToken)
      .send({});

    expect(response.status).to.equal(200);
    expect(response.body.accessToken).to.be.a('string');
    accessToken = response.body.accessToken;
    refreshToken = response.headers['set-cookie'][0];
  });

  it('should allow a GET to /v1/users/logout', async function () {
    const response = await request
      .get('/v1/logout')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).to.equal(200);
  });
});
