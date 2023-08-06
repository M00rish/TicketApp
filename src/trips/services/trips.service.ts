import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateTripDto } from '../dtos/create.trip.dto';
import tripsDaos from '../daos/trips.dao';
import { PatchTripDto } from '../dtos/patch.trips.dto';

class TripService implements CRUD {
  async create(resource: CreateTripDto) {
    return await tripsDaos.addTrip(resource);
  }
  async deleteById(id: string) {
    return await tripsDaos.removeTripById(id);
  }
  async list(limit: number, page: number) {
    return await tripsDaos.listTrips(limit, page);
  }
  async patchById(id: string, resource: PatchTripDto) {
    return await tripsDaos.updateTripById(id, resource);
  }
  async readById(id: string) {
    return await tripsDaos.getTripById(id);
  }
}

export default new TripService();
