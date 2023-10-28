import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateTripDto } from '../dtos/create.trip.dto';
import tripsDaos from '../daos/trips.dao';
import { PatchTripDto } from '../dtos/patch.trips.dto';

class TripService implements CRUD {
  async create(resource: CreateTripDto) {
    return await tripsDaos.addTrip(resource);
  }
  async deleteById(id: string) {
    return await tripsDaos.deleteTripById(id);
  }
  async list(limit: number, page: number) {
    return await tripsDaos.listTrips(limit, page);
  }
  async updateById(id: string, resource: PatchTripDto) {
    return await tripsDaos.updateTripById(id, resource);
  }
  async getById(id: string) {
    return await tripsDaos.getTripById(id);
  }
  async deleteAll() {
    return await tripsDaos.deleteAllTrips();
  }
  async updateTripStatus(tripId: string) {
    return await tripsDaos.updateTripStatus(tripId);
  }
}

export default new TripService();
