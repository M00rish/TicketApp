import 'mocha';
import { expect } from 'chai';
import shortid from 'shortid';
import sinon from 'sinon';

import { CreateCityDto } from '../../../src/cities/dtos/create.city.dto';
import { PatchCityDto } from '../../../src/cities/dtos/patch.city.dto';
import { CitiesDao } from '../../../src/cities/daos/cities.dao';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';
import AppError from '../../../src/common/types/appError';
import HttpStatusCode from '../../../src/common/enums/HttpStatusCode.enum';

describe('CitiesDao', () => {
  describe('addCity', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let stubShortid: sinon.SinonStub;
    let saveStub: sinon.SinonStub;

    beforeEach(() => {
      stubShortid = sinon.stub(shortid, 'generate').returns('testId');
      saveStub = sinon.stub(citiesDao.City.prototype, 'save');
    });

    afterEach(() => {
      stubShortid.restore();
      saveStub.restore();
    });

    it('should add a city and return its id', async () => {
      const cityFields: CreateCityDto = {
        cityName: 'testCityName',
      };

      const cityId = await citiesDao.addCity(cityFields);

      expect(cityId).to.equal('testId');
      expect(saveStub.calledOnce).to.equal(true);
    });
  });

  describe('getCityById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let stubFindById: sinon.SinonStub;

    beforeEach(() => {
      stubFindById = sinon.stub(citiesDao.City, 'findById');
    });

    afterEach(() => {
      stubFindById.restore();
    });

    it('should return a city when a valid id is provided', async () => {
      const cityId = 'testId';
      const expectedCity = { _id: cityId, cityName: 'testCityName' };
      stubFindById.returns({
        exec: sinon.stub().resolves(expectedCity),
      });

      const city = await citiesDao.getCityById(cityId);

      expect(city).to.deep.equal(expectedCity);
    });

    it('should throw an error when no city is found', async () => {
      const cityId = 'testId';
      stubFindById.returns({
        exec: sinon.stub().resolves(undefined),
      });

      try {
        await citiesDao.getCityById(cityId);
        expect.fail('Expected method to throw');
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.name).to.equal('RessourceNotFoundError');
        expect(error.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(error.message).to.equal('City not found');
      }
    });
  });

  describe('listCities', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let stubFind: sinon.SinonStub;

    beforeEach(() => {
      stubFind = sinon.stub(citiesDao.City, 'find');
    });

    afterEach(() => {
      stubFind.restore();
    });

    it('should return a list of cities', async () => {
      const expectedCities = [
        { _id: 'testId1', cityName: 'testCityName1' },
        { _id: 'testId2', cityName: 'testCityName2' },
      ];
      stubFind.returns({
        exec: sinon.stub().resolves(expectedCities),
      });

      const cities = await citiesDao.listCities();

      expect(cities).to.deep.equal(expectedCities);
    });

    it('should throw an error when no cities are found', async () => {
      stubFind.returns({
        exec: sinon.stub().resolves(undefined),
      });

      try {
        await citiesDao.listCities();
        expect.fail('Expected method to throw');
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.name).to.equal('RessourceNotFoundError');
        expect(error.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(error.message).to.equal('No cities found');
      }
    });
  });

  describe('updateCityById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let stubFindByIdAndUpdate: sinon.SinonStub;

    beforeEach(() => {
      stubFindByIdAndUpdate = sinon.stub(citiesDao.City, 'findByIdAndUpdate');
    });

    afterEach(() => {
      stubFindByIdAndUpdate.restore();
    });

    it('should update a city and return its id', async () => {
      const cityId = 'testId';
      const cityFields: PatchCityDto = {
        cityName: 'updatedCityName',
      };
      const expectedCity = { _id: cityId, cityName: 'updatedCityName' };
      stubFindByIdAndUpdate.returns({
        exec: sinon.stub().resolves(expectedCity),
      });

      const updatedCityId = await citiesDao.updateCityById(cityId, cityFields);

      expect(updatedCityId).to.equal(cityId);
    });

    it('should throw an error when no city is found', async () => {
      const cityId = 'testId';
      const cityFields: PatchCityDto = {
        cityName: 'updatedCityName',
      };
      stubFindByIdAndUpdate.returns({
        exec: sinon.stub().resolves(undefined),
      });

      try {
        await citiesDao.updateCityById(cityId, cityFields);
        expect.fail('Expected method to throw');
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.name).to.equal('RessourceNotFoundError');
        expect(error.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(error.message).to.equal('City not found');
      }
    });
  });

  describe('removeCityById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let stubDeleteOne: sinon.SinonStub;

    beforeEach(() => {
      stubDeleteOne = sinon.stub(citiesDao.City, 'deleteOne');
    });

    afterEach(() => {
      stubDeleteOne.restore();
    });

    it('should remove a city and return its id', async () => {
      const cityId = 'testId';
      stubDeleteOne.returns({
        exec: sinon.stub().resolves({ deletedCount: 1 }),
      });

      await citiesDao.removeCityById(cityId);

      expect(stubDeleteOne.calledOnce).to.be.true;
    });

    it('should throw an error when no city is found', async () => {
      const cityId = 'testId';
      stubDeleteOne.returns({
        exec: sinon.stub().resolves({ deletedCount: 0 }),
      });

      try {
        await citiesDao.removeCityById(cityId);
        expect.fail('Expected method to throw');
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.name).to.equal('RessourceNotFoundError');
        expect(error.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(error.message).to.equal('City not found');
      }
    });
  });

  describe('getCityByName', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let stubFindOne: sinon.SinonStub;

    beforeEach(() => {
      stubFindOne = sinon.stub(citiesDao.City, 'findOne');
    });

    afterEach(() => {
      stubFindOne.restore();
    });

    it('should return a city when a valid name is provided', async () => {
      const cityName = 'testCityName';
      const expectedCity = { _id: 'testId', cityName: 'testCityName' };
      stubFindOne.returns({
        exec: sinon.stub().resolves(expectedCity),
      });

      const city = await citiesDao.getCityByName(cityName);

      expect(city).to.deep.equal(expectedCity);
    });

    it('should throw an error when no city is found', async () => {
      const cityName = 'testCityName';
      stubFindOne.returns({
        exec: sinon.stub().resolves(undefined),
      });

      try {
        await citiesDao.getCityByName(cityName);
        expect.fail('Expected method to throw');
      } catch (error: any) {
        expect(error).to.be.instanceOf(AppError);
        expect(error.name).to.equal('RessourceNotFoundError');
        expect(error.statusCode).to.equal(HttpStatusCode.NotFound);
        expect(error.message).to.equal('city not found');
      }
    });
  });
});
