import app, { appServer } from '../../src/app';
import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongooseService from '../../src/common/service/mongoose.service';
import mongoose from 'mongoose';

let firstUserIdTest = '';
let SecondUserIdTest = '';

const firstUserBody = {
  email: `mas+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'Mark',
  lastName: 'mas',
};

const secondUserBody = {
  email: `koo+${shortid.generate()}@gmail.com`,
  password: '123qw',
  firstName: 'sad',
  lastName: 'nas',
};

let accessToken = '';
let refreshToken = '';
const newFirstName = 'markos';
const newLastName = 'Faraco';
const newFirstName2 = 'liza';
const newLastName2 = 'may';

describe('users and auth endpoints', function () {
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

  it('should allow a POST to /login', async function () {
    const response = await request.post('/v1/login').send(firstUserBody);
    expect(response.status).to.equal(201);
    expect(response.body).not.to.be.empty;
    expect(response.body).to.be.an('Object');
    expect(response.body.accessToken).to.be.a('string');
    accessToken = response.body.accessToken;
    refreshToken = response.headers['set-cookie'][0];
  });

  describe('with an access token', function () {
    it('should not allow a GET to /users', async function () {
      const response = await request
        .get(`/v1/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      expect(response.status).to.equal(403);
    });

    it('should allow a GET to /users/:userId ', async function () {
      const response = await request
        .get(`/v1/users/${firstUserIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      expect(response.body._id).to.equal(firstUserIdTest);
      expect(response.body.email).to.equal(firstUserBody.email);
      expect(response.body.firstName).to.be.an('string');
      expect(response.body.lastName).to.be.a('string');
    });

    it('should allow a PATCH to /users/:userId', async function () {
      const response = await request
        .patch(`/v1/users/${firstUserIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName,
          lastName: newLastName,
        });
      expect(response.status).to.equal(204);
    });

    it('should not allow a Patch to /users/:userId to change permission Flags for a user', async function () {
      const response = await request
        .patch(`/v1/users/${firstUserIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          permissionFlags: 4,
        });
      expect(response.status).to.equal(403);
    });

    it('should allow a Post to /refresh-token for a refreshtoken', async function () {
      const response = await request
        .post(`/v1/refresh-token`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshToken)
        .send({ firstUserBody });

      expect(response.body).to.be.an('object');
      expect(response.status).to.equal(201);
      expect(response.body).to.be.not.be.empty;
      expect(response.body.accessToken).to.be.a('string');

      accessToken = response.body.accessToken;
      refreshToken = response.headers['set-cookie'][0];
    });

    it('should not allow a POST to /refresh-token for a refreshtoken twice ', async function () {
      const response = await request
        .post(`/v1/refresh-token`)
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Cookie', refreshToken)
        .send();
      expect(response.status).to.equal(429);
    });

    it('should not allow a PACTH to /users/:id with an id that does not exist', async function () {
      const response = await request
        .patch(`/v1/users/nonExistingId`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName2,
          lastName: newLastName,
        });

      expect(response.status).to.equal(404);
      expect(response.body).to.be.an('object');
    });

    it('should allow a patch to /users/:userId/permissionFlags/:permissionFlags', async function () {
      const response = await request
        .patch(`/v1/users/${firstUserIdTest}/permissionFlags/4`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          permissionFlags: 4,
        });

      expect(response.status).to.equal(201);
      expect(response.body).to.be.an('object');
      accessToken = response.body.accessToken;
    });

    describe('with an admin permission flag', function () {
      it('should allow a POST to /users', async function () {
        const response = await request
          .post('/v1/users')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(secondUserBody);
        expect(response.status).to.equal(201);
        expect(response.body).not.to.be.empty;
        expect(response.body).to.be.an('Object');
        expect(response.body._id).to.be.a('string');

        SecondUserIdTest = response.body._id;
      });

      it('should allow a patch to /users/:userId/ to change firstname and lastname for a user', async function () {
        const response = await request
          .patch(`/v1/users/${SecondUserIdTest}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            firstName: newFirstName2,
            lastName: newLastName2,
          });

        expect(response.status).to.equal(204);
      });

      it('should allow a get from /users/:userId to see the new firstname and lastname for a user', async function () {
        const response = await request
          .get(`/v1/users/${SecondUserIdTest}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send();
        expect(response.status).to.equal(200);
        expect(response.body).not.to.be.empty;
        expect(response.body).to.be.an('Object');
        expect(response.body._id).to.be.a('string');
        expect(response.body._id).to.equal(SecondUserIdTest);
        expect(response.body.email).to.equal(secondUserBody.email);
        expect(response.body.firstName).to.be.a('string');
        expect(response.body.firstName).to.equal(newFirstName2);
        expect(response.body.lastName).to.be.a('string');
        expect(response.body.lastName).to.equal(newLastName2);
      });

      it('should allow a DELETE to /users/:userId', async function () {
        const response = await request
          .delete(`/v1/users/${SecondUserIdTest}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send();
        expect(response.status).to.equal(204);
        expect(response.body).to.be.empty;
      });
    });
  });
});
