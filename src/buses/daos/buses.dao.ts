import debug from 'debug';
import shortid from 'shortid';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';
import { MongooseService } from '../../common/service/mongoose.service';
import { CommonService } from '../../common/service/common.service';
import { CreateBusDto } from '../dtos/create.bus.dto';
import { PatchBusDto } from '../dtos/patch.bus.dto';
import { inject, injectable } from 'inversify';
import { TYPES } from '../../ioc/types';

const log: debug.IDebugger = debug('app:buses-dao');

/**
 * Data Access Object (DAO) for managing buses in the database.
 */
class BusesDao {
  constructor(private commonService: CommonService) {
    log('Created new instance of BusesDao');

    this.Bus = this.commonService.getOrCreateModel('Bus', this.busSchema);
  }

  /**
   * Creates a new bus record in the database.
   * @param busFields - The data for the new bus record.
   * @returns A Promise that resolves to the ID of the created bus record.
   */
  async create(busFields: CreateBusDto): Promise<string> {
    const busId = shortid.generate();
    const bus = new this.Bus({
      _id: busId,
      ...busFields,
    });

    await bus.save();
    return busId;
  }

  /**
   * Retrieves a bus by its ID.
   * @param busId - The ID of the bus to retrieve.
   * @returns A Promise that resolves to the bus object.
   */
  async getById(busId: string): Promise<CreateBusDto> {
    const bus = await this.Bus.findById(busId).exec();
    return bus;
  }

  /**
   * Retrieves a list of buses.
   * @param limit - The maximum number of buses to retrieve.
   * @param page - The page number of the results.
   * @returns A Promise that resolves to the list of buses.
   */
  async list(limit: number = 25, page: number = 0): Promise<CreateBusDto[]> {
    const buses = await this.Bus.find()
      .limit(limit)
      .skip(limit * page)
      .exec();
    return buses;
  }

  /**
   * Updates a bus record by its ID.
   * @param {string} busId - The ID of the bus to update.
   * @param {PatchBusDto} busFields - The fields to update on the bus.
   * @returns {Promise<void>} - A promise that resolves when the update is complete.
   */
  async updateById(busId: string, busFields: PatchBusDto): Promise<void> {
    await this.Bus.findByIdAndUpdate(busId).exec();
  }

  /**
   * Deletes a bus by its ID.
   * @param {string} busId - The ID of the bus to delete.
   * @returns {Promise<void>} - A promise that resolves when the bus is deleted.
   */
  async deleteById(busId: string) {
    await this.Bus.findByIdAndDelete(busId).exec();
  }

  /**
   * Checks if a bus with the given ID exists in the database.
   * @param {string} BusId - The ID of the bus to validate.
   * @returns {Promise<boolean>} - A promise that resolves to a boolean indicating whether the bus exists or not.
   */
  validateBusExists = async (BusId: string) => {
    const busExists = await this.Bus.exists({ _id: BusId });
    return busExists;
  };

  schema = this.commonService.getMongoose().Schema;

  busSchema = new this.schema(
    {
      _id: this.schema.Types.String,
      busModel: { type: String, required: true },
      seats: {
        type: Number,
        min: [10, 'seats can not be less than 10'],
        max: [50, 'seats can not be more than 50'],
        required: true,
      },
      busType: String,
      image: String,
    },
    { id: false, timestamps: true }
  );
  //   .pre(/^find/, function () {
  //   // this.select('-createdAt -updatedAt -__v');
  // });

  Bus = this.commonService.getOrCreateModel('Bus', this.busSchema);
}

export { BusesDao };
