import app from '../src/app';
import request from 'supertest';
import chai, { expect } from 'chai';

describe('App', () => {
  it('should return a starting message', async () => {
    const response = await request(app).get('/').send();
    expect(response.status).to.equal(200);
    expect(response.text).to.equal('server is running on 3000');
  });
});
