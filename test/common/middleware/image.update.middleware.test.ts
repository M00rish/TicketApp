import 'mocha';
import express from 'express';
import sinon from 'sinon';
import { expect } from 'chai';
import mockery from 'mockery';
import multer from 'multer';
import { Readable } from 'stream';
import { imageUpdateMiddleware } from '../../../src/common/middleware/image.update.middleware';

describe('Image Update Middleware', () => {
  //   let imageupdatemiddleware: imageUpdateMiddleware;
  //   let updateImage;
  //   let multerMock;
  //   let req;
  //   let res;
  //   let next;
  //   before(() => {
  //     mockery.enable({
  //       warnOnReplace: false,
  //       warnOnUnregistered: false,
  //       useCleanCache: true,
  //     });
  //     imageupdatemiddleware = new imageUpdateMiddleware();
  //     let multerInstance = multer({});
  //     sinon.stub(multerInstance, 'single').returns((req, res, next) => {
  //       const buffer = Buffer.from('test buffer');
  //       const stream = new Readable();
  //       stream.push(buffer);
  //       stream.push(null);
  //       req.file = {
  //         fieldname: 'testField',
  //         originalname: 'testOriginal.jpg',
  //         encoding: '7bit',
  //         mimetype: 'image/jpeg',
  //         size: 5000,
  //         destination: '/uploads/',
  //         filename: 'test.jpg',
  //         path: '/uploads/test.jpg',
  //         buffer: buffer,
  //         stream: stream,
  //       };
  //       next();
  //     });
  //     mockery.registerMock('multer', multerMock);
  //     updateImage = imageupdatemiddleware.updateImage;
  //   });
  //   beforeEach(() => {
  //     req = express.request;
  //     res = express.response;
  //     next = sinon.stub();
  //   });
  //   afterEach(() => {
  //     sinon.restore();
  //   });
  //   after(() => {
  //     mockery.deregisterAll();
  //     mockery.disable();
  //   });
  //   it('should update user image', async () => {
  //     req.body = { image: 'old.jpg' };
  //     await updateImage('user')(req, res, next);
  //     expect(req.body.image).to.equal('test.jpg');
  //     expect(next.calledOnce).to.be.true;
  //   });
  //   it('should update bus image', async () => {
  //     req.body = { image: 'old.jpg' };
  //     await updateImage('bus')(req, res, next);
  //     expect(req.body.image).to.equal('test.jpg');
  //     expect(next.calledOnce).to.be.true;
  //   });
  //   it('should handle error', async () => {
  //     multerMock.throws(new Error('Test error'));
  //     await updateImage('bus')(req, res, next);
  //     expect(next.calledOnce).to.be.true;
  //     expect(next.calledWith(sinon.match.instanceOf(Error))).to.be.true;
  //   });
});
