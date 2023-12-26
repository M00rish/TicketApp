import 'mocha';
import { expect } from 'chai';
import sinon from 'sinon';

import { CitiesService } from '../../../src/cities/services/cities.service';
import { MongooseService } from '../../../src/common/service/mongoose.service';
import { CommonService } from '../../../src/common/service/common.service';
import { CitiesDao } from '../../../src/cities/daos/cities.dao';
import { PatchCityDto } from '../../../src/cities/dtos/patch.city.dto';

describe('CitiesService', () => {
  describe('create', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let stubAddCity: sinon.SinonStub;

    beforeEach(() => {
      stubAddCity = sinon.stub(citiesDao, 'addCity');
    });

    afterEach(() => {
      stubAddCity.restore();
    });

    it('should create a city and return it', async () => {
      const cityData = { cityName: 'testCityName' };
      const expectedCity = { _id: 'testId', cityName: 'testCityName' };
      stubAddCity.resolves(expectedCity);

      const city = await citiesService.create(cityData);

      expect(stubAddCity.calledOnceWith(cityData)).to.be.true;
      expect(city).to.deep.equal(expectedCity);
    });

    it('should throw an error when the creation fails', async () => {
      const cityData = { cityName: 'testCityName' };
      const error = new Error('Creation failed');
      stubAddCity.rejects(error);

      try {
        await citiesService.create(cityData);
        expect.fail('Expected method to throw');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
  describe('deleteById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let stubRemoveCityById: sinon.SinonStub;

    beforeEach(() => {
      stubRemoveCityById = sinon.stub(citiesDao, 'removeCityById');
    });

    afterEach(() => {
      stubRemoveCityById.restore();
    });

    it('should delete a city and return its id', async () => {
      const cityId = 'testId';
      stubRemoveCityById.resolves(null);

      await citiesService.deleteById(cityId);

      expect(stubRemoveCityById.calledOnceWith(cityId)).to.be.true;
    });

    it('should throw an error when no city is found', async () => {
      const cityId = 'testId';
      const error = new Error('City not found');
      stubRemoveCityById.rejects(error);

      try {
        await citiesService.deleteById(cityId);
        expect.fail('Expected method to throw');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('list', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let stubListCities: sinon.SinonStub;

    beforeEach(() => {
      stubListCities = sinon.stub(citiesDao, 'listCities');
    });

    afterEach(() => {
      stubListCities.restore();
    });

    it('should return a list of cities', async () => {
      const expectedCities = [
        { _id: 'testId1', cityName: 'testCityName1' },
        { _id: 'testId2', cityName: 'testCityName2' },
      ];
      stubListCities.resolves(expectedCities);

      const cities = await citiesService.list(10, 1);

      expect(stubListCities.calledOnce).to.be.true;
      expect(cities).to.deep.equal(expectedCities);
    });

    it('should throw an error when the retrieval fails', async () => {
      const error = new Error('Retrieval failed');
      stubListCities.rejects(error);

      try {
        await citiesService.list(10, 1);
        expect.fail('Expected method to throw');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('updateById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let stubUpdateCityById: sinon.SinonStub;

    beforeEach(() => {
      stubUpdateCityById = sinon.stub(citiesDao, 'updateCityById');
    });

    afterEach(() => {
      stubUpdateCityById.restore();
    });

    it('should update a city and return its id', async () => {
      const cityId = 'testId';
      const cityFields: PatchCityDto = {
        cityName: 'updatedCityName',
      };
      stubUpdateCityById.resolves(cityId);

      const updatedCityId = await citiesService.updateById(cityId, cityFields);

      expect(stubUpdateCityById.calledOnceWith(cityId, cityFields)).to.be.true;
      expect(updatedCityId).to.equal(cityId);
    });

    it('should throw an error when no city is found', async () => {
      const cityId = 'testId';
      const cityFields: PatchCityDto = {
        cityName: 'updatedCityName',
      };
      const error = new Error('City not found');
      stubUpdateCityById.rejects(error);

      try {
        await citiesService.updateById(cityId, cityFields);
        expect.fail('Expected method to throw');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('getById', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let stubGetCityById: sinon.SinonStub;

    beforeEach(() => {
      stubGetCityById = sinon.stub(citiesDao, 'getCityById');
    });

    afterEach(() => {
      stubGetCityById.restore();
    });

    it('should return a city when a valid id is provided', async () => {
      const cityId = 'testId';
      const expectedCity = { _id: 'testId', cityName: 'testCityName' };
      stubGetCityById.resolves(expectedCity);

      const city = await citiesService.getById(cityId);

      expect(stubGetCityById.calledOnceWith(cityId)).to.be.true;
      expect(city).to.deep.equal(expectedCity);
    });

    it('should throw an error when no city is found', async () => {
      const cityId = 'testId';
      const error = new Error('City not found');
      stubGetCityById.rejects(error);

      try {
        await citiesService.getById(cityId);
        expect.fail('Expected method to throw');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });

  describe('getCityByName', () => {
    let mongooseService = new MongooseService();
    let commonService = new CommonService(mongooseService);
    let citiesDao = new CitiesDao(commonService);
    let citiesService = new CitiesService(citiesDao);
    let stubGetCityByName: sinon.SinonStub;

    beforeEach(() => {
      stubGetCityByName = sinon.stub(citiesDao, 'getCityByName');
    });

    afterEach(() => {
      stubGetCityByName.restore();
    });

    it('should return a city when a valid name is provided', async () => {
      const cityName = 'testCityName';
      const expectedCity = { _id: 'testId', cityName: 'testCityName' };
      stubGetCityByName.resolves(expectedCity);

      const city = await citiesService.getCityByName(cityName);

      expect(stubGetCityByName.calledOnceWith(cityName)).to.be.true;
      expect(city).to.deep.equal(expectedCity);
    });

    it('should throw an error when no city is found', async () => {
      const cityName = 'testCityName';
      const error = new Error('City not found');
      stubGetCityByName.rejects(error);

      try {
        await citiesService.getCityByName(cityName);
        expect.fail('Expected method to throw');
      } catch (err) {
        expect(err).to.equal(error);
      }
    });
  });
});
