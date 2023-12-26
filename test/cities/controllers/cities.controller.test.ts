import 'mocha';
import express from 'express';
import sinon from 'sinon';
import { expect } from 'chai';
import httpMocks from 'node-mocks-http';

import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';
import { CitiesController } from '../../../src/cities/controllers/cities.controller';
import { CitiesService } from '../../../src/cities/services/cities.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';
import { CitiesDao } from '../../../src/cities/daos/cities.dao';
import AppError from '../../../src/common/types/appError';

describe('CitiesController', () => {
  describe('listcities', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let citiesController = new CitiesController(citiesService);

    interface ResponseWithBody extends express.Response {
      body: any;
    }

    let req: express.Request;
    let res: ResponseWithBody;
    let next: sinon.SinonStub;
    let stubList: sinon.SinonStub;

    beforeEach(() => {
      req = {} as express.Request;
      res = {
        status: function (code: number) {
          this.statusCode = code;
          return this;
        },
        json: function (obj: any) {
          this.body = obj;
          return this;
        },
      } as ResponseWithBody;
      next = sinon.stub();
      stubList = sinon.stub(citiesService, 'list');
    });

    afterEach(() => {
      stubList.restore();
    });

    it('should return a list of cities', async () => {
      const expectedCities = [
        { _id: 'testId1', cityName: 'testCityName1' },
        { _id: 'testId2', cityName: 'testCityName2' },
      ];
      stubList.resolves(expectedCities);

      await citiesController.listCities(req, res, next);

      expect(res.statusCode).to.equal(HttpStatusCode.Ok);
      expect(res.body).to.deep.equal(expectedCities);
      expect(next.called).to.be.false;
    });

    it('should call next with an error when the retrieval fails', async () => {
      const error = new Error('Retrieval failed');
      stubList.rejects(error);

      await citiesController.listCities(req, res, next);

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('getcityById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let citiesController = new CitiesController(citiesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let stubGetById: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          cityId: 'testId',
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      stubGetById = sinon.stub(citiesService, 'getById');
    });

    afterEach(() => {
      stubGetById.restore();
    });

    it('should return a city when a valid id is provided', async () => {
      const expectedCity = { _id: 'testId', cityName: 'testCityName' };
      stubGetById.resolves(expectedCity);

      await citiesController.getCityById(req, res, next);

      expect(res.statusCode).to.equal(HttpStatusCode.Ok);
      expect(res._getJSONData()).to.deep.equal(expectedCity);
      expect(next.called).to.be.false;
    });

    it('should call next with an error when no city is found', async () => {
      const error = new AppError(
        true,
        'RessourceNotFoundError',
        HttpStatusCode.NotFound,
        'city not found'
      );
      stubGetById.rejects(error);

      await citiesController.getCityById(req, res, next);

      expect(next.calledOnceWith(error)).to.be.true;
    });

    it('should call next with an error when the retrieval fails', async () => {
      const error = new Error('Retrieval failed');
      stubGetById.rejects(error);

      await citiesController.getCityById(req, res, next);

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('addcity', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let citiesController = new CitiesController(citiesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let stubCreate: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        body: {
          cityName: 'testCityName',
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      stubCreate = sinon.stub(citiesService, 'create');
    });

    afterEach(() => {
      stubCreate.restore();
    });

    it('should create a city and return its id', async () => {
      const expectedCityId = 'testId';
      stubCreate.resolves(expectedCityId);

      await citiesController.addCity(req, res, next);

      expect(res.statusCode).to.equal(HttpStatusCode.Created);
      expect(res._getJSONData()).to.deep.equal({ _id: expectedCityId });
      expect(next.called).to.be.false;
    });

    it('should call next with an error when the creation fails', async () => {
      const error = new Error('Creation failed');
      stubCreate.rejects(error);

      await citiesController.addCity(req, res, next);

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('updatecity', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let citiesController = new CitiesController(citiesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let stubUpdateById: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          cityId: 'testId',
        },
        body: {
          cityName: 'updatedCityName',
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      stubUpdateById = sinon.stub(citiesService, 'updateById');
    });

    afterEach(() => {
      stubUpdateById.restore();
    });

    it('should update a city and return its id', async () => {
      const expectedCityId = 'testId';
      stubUpdateById.resolves(expectedCityId);

      await citiesController.updateCity(req, res, next);

      expect(res.statusCode).to.equal(HttpStatusCode.Ok);
      expect(res._getJSONData()).to.deep.equal({ _id: expectedCityId });
      expect(next.called).to.be.false;
    });

    it('should call next with an error when the update fails', async () => {
      const error = new Error('Update failed');
      stubUpdateById.rejects(error);

      await citiesController.updateCity(req, res, next);

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });

  describe('deletecity', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let citiesController = new CitiesController(citiesService);
    let req: httpMocks.MockRequest<express.Request>;
    let res: httpMocks.MockResponse<express.Response>;
    let next: sinon.SinonStub;
    let stubDeleteById: sinon.SinonStub;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          cityId: 'testId',
        },
      });
      res = httpMocks.createResponse();
      next = sinon.stub();
      stubDeleteById = sinon.stub(citiesService, 'deleteById');
    });

    afterEach(() => {
      stubDeleteById.restore();
    });

    it('should delete a city and return no content', async () => {
      stubDeleteById.resolves();

      await citiesController.deleteCity(req, res, next);

      expect(res.statusCode).to.equal(HttpStatusCode.NoContent);
      expect(res._getData()).to.equal('');
      expect(next.called).to.be.false;
    });

    it('should call next with an error when the deletion fails', async () => {
      const error = new Error('Deletion failed');
      stubDeleteById.rejects(error);

      await citiesController.deleteCity(req, res, next);

      expect(next.calledOnceWith(error)).to.be.true;
    });
  });
});
