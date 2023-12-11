import debug from 'debug';
import shortid from 'shortid';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';
import mongooseService from '../../common/service/mongoose.service';
import commonService, {
  CommonService,
} from '../../common/service/common.service';
import { CreateBusDto } from '../dtos/create.bus.dto';
import { PatchBusDto } from '../dtos/patch.bus.dto';

const log: debug.IDebugger = debug('app:buses-dao');

class BusesDao {
  constructor(private commonService: CommonService) {
    log('created new instance of BusesDao');
  }

  /**
   * Adds a new bus to the database.
   * @param busFields - The fields of the bus to be added.
   * @returns The ID of the newly added bus.
   * @throws Throws an error if there is an issue adding the bus.
   */
  async addBus(busFields: CreateBusDto) {
    try {
      const busId = shortid.generate();
      const bus = new this.Bus({
        _id: busId,
        ...busFields,
      });

      await bus.save();
      return busId;
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Retrieves a bus by its ID.
   * @param busId - The ID of the bus to retrieve.
   * @returns A Promise that resolves to the retrieved bus.
   * @throws {AppError} If the bus is not found.
   */
  async getBusById(busId: string) {
    try {
      const bus = await this.Bus.findById(busId).exec();
      if (!bus)
        throw new AppError(
          true,
          'getBusById_Error',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
      return bus;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves all buses from the database.
   * @returns {Promise<Array<Bus>>} A promise that resolves to an array of Bus objects.
   * @throws {Error} If there is an error while retrieving the buses.
   */
  async getBuses() {
    try {
      const buses = await this.Bus.find().exec();

      return buses;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Updates a bus by its ID.
   * @param {string} busId - The ID of the bus to update.
   * @param {PatchBusDto} busFields - The fields to update on the bus.
   * @returns {Promise<string>} The ID of the updated bus.
   * @throws {AppError} If the bus is not found.
   */
  async updateBusById(busId: string, busFields: PatchBusDto) {
    try {
      const bus = await this.Bus.findById(busId).exec();
      if (!bus)
        throw new AppError(
          true,
          'updateBusById_Error',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
      bus.set(busFields);
      await bus.save();
      return busId;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Removes a bus by its ID.
   * @param {string} busId - The ID of the bus to be removed.
   * @returns {Promise<string>} - The ID of the removed bus.
   * @throws {AppError} - If the bus is not found.
   */
  async removeBusById(busId: string) {
    try {
      const bus = await this.Bus.findById(busId).exec();
      if (!bus)
        throw new AppError(
          true,
          'removeBusById_Error',
          HttpStatusCode.NotFound,
          'Bus not found'
        );
      await bus.remove();
      return busId;
    } catch (error) {
      throw error;
    }
  }

  schema = mongooseService.getMongoose().Schema;

  busSchema = new this.schema(
    {
      _id: this.schema.Types.String,
      busModel: { type: String, required: true },
      seats: {
        type: Number,
        min: [2, 'seats can not be less than 10'],
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

  Bus = this.commonService.getOrCreateModel(this.busSchema, 'Bus');
}

export default new BusesDao(commonService);
export { BusesDao };
