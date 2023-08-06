import debug from 'debug';
import shortid from 'shortid';
import HttpStatusCode from '../../common/enums/HttpStatusCode.enum';
import AppError from '../../common/types/appError';
import mongooseService from '../../common/service/mongoose.service';
import { CreateBusDto } from '../dtos/create.bus.dto';
import { PatchBusDto } from '../dtos/patch.bus.dto';

const log: debug.IDebugger = debug('app:buses-dao');

class BusesDao {
  constructor() {
    log('created new instance of BusesDao');
  }

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

  async getBuses() {
    try {
      const buses = await this.Bus.find().exec();
      if (!buses)
        throw new AppError(
          true,
          'getBuses_Error',
          HttpStatusCode.NotFound,
          'No buses found'
        );
      return buses;
    } catch (error) {
      throw error;
    }
  }

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
      seats: { type: Number, required: true },
      busType: String,
      image: String,
    },
    { id: false, timestamps: true }
  );

  Bus = mongooseService.getMongoose().model('Buses', this.busSchema);
}

export default new BusesDao();
