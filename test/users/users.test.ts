import app, { appServer } from '../../src/app';
import supertest from 'supertest';
import { expect } from 'chai';
import shortid from 'shortid';
import mongooseService from '../../src/common/service/mongoose.service';
import mongoose from 'mongoose';

let firstUserIdTest = '';

const firstUserBody = {
  email: `mas+${shortid.generate()}@gmail.com`,
  password: '123qw',
};

let accessToken = '';
let refreshToken = '';
const newFirstName = 'markos';
const newFirstName2 = 'Paulo';
const newLastName = 'Faraco';

describe('users and auth endpoints', function () {
  let request: supertest.SuperAgentTest;
  before(function () {
    mongooseService.connectWithRetry(process.env.MONGODB_TEST_URI);
    request = supertest.agent(app);
  });
  after(function (done) {
    appServer.close(() => {
      mongoose.connection.close(done);
    });
  });

  it('should allow a POST to /users', async function () {
    const response = await request.post('/users').send(firstUserBody);
    expect(response.status).to.equal(201);
    expect(response.body).not.to.be.empty;
    expect(response.body).to.be.an('Object');
    expect(response.body._id).to.be.a('string');
    firstUserIdTest = response.body._id;
  });

  it('should allow a POST to /login', async function () {
    const response = await request.post('/login').send(firstUserBody);
    expect(response.status).to.equal(201);
    expect(response.body).not.to.be.empty;
    expect(response.body).to.be.an('Object');
    expect(response.body.accessToken).to.be.a('string');
    accessToken = response.body.accessToken;
  });

  describe('with an access token', function () {
    it('should not allow a GET to /users', async function () {
      const response = await request
        .get(`/users`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      expect(response.status).to.equal(403);
    });

    it('should allow a GET to /users/:userId ', async function () {
      const response = await request
        .get(`/users/${firstUserIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send();
      expect(response.status).to.equal(200);
      expect(response.body).not.to.be.empty;
      expect(response.body).to.be.an('Object');
      expect(response.body._id).to.be.a('string');
      expect(response.body._id).to.equal(firstUserIdTest);
      expect(response.body.email).to.equal(firstUserBody.email);
      // expect(response.body.firstName).to.be.a('string');
      // expect(response.body.lastName).to.be.a('string');
    });

    it('should allow a PATCH to /users/:userId', async function () {
      const response = await request
        .patch(`/users/${firstUserIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName,
          lastName: newLastName,
        });
      expect(response.status).to.equal(204);
    });

    it('should not allow a Patch to /users/:userId to change permission Flags for a user', async function () {
      const response = await request
        .patch(`/users/${firstUserIdTest}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          permissionFlags: 4,
        });
      expect(response.status).to.equal(403);
    });

    it('should allow a patch to /users/:userId/permissionFlags/4', async function () {
      const response = await request
        .patch(`/users/${firstUserIdTest}/permissionFlags/4`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      expect(response.status).to.equal(204);
    });

    describe('with a admin permission flag', function () {
      it('should allow a patch to /users/:userId/ to change firstname and lastname', async function () {
        const response = await request
          .patch(`/users/${firstUserIdTest}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            firstName: newFirstName2,
            lastName: newLastName,
          });
        expect(response.status).to.equal(204);
      });

      it('should allow a get from /users/:userId to see the new firstname and lastname', async function () {
        const response = await request
          .get(`/users/${firstUserIdTest}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send();
        expect(response.status).to.equal(200);
        expect(response.body).not.to.be.empty;
        expect(response.body).to.be.an('Object');
        expect(response.body._id).to.be.a('string');
        expect(response.body._id).to.equal(firstUserIdTest);
        expect(response.body.email).to.equal(firstUserBody.email);
        expect(response.body.firstName).to.be.a('string');
        expect(response.body.firstName).to.equal(newFirstName2);
        expect(response.body.lastName).to.be.a('string');
        expect(response.body.lastName).to.equal(newLastName);
      });

      it('should allow a DELETE to /users/:userId', async function () {
        const response = await request
          .delete(`/users/${firstUserIdTest}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send();
        expect(response.status).to.equal(204);
      });
    });

    it('should not allow a put request with an id that does not exist', async function () {
      const response = await request
        .put(`/users/nonExistingId`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          firstName: newFirstName2,
          lastName: newLastName,
        });
      expect(response.status).to.equal(404);
    });
  });
});
