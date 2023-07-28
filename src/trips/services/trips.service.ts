import { CRUD } from '../../common/interfaces/crud.interface';
import { CreateTripDto } from '../dtos/create.trip.dto';
import tripsDaos from '../daos/trips.daos';
import { PatchTripDto } from '../dtos/patch.trips.dto';

class TripService implements CRUD {
  async create(resource: CreateTripDto) {
    return tripsDaos.addTrip(resource);
  }
  async deleteById(id: string) {
    return tripsDaos.removeTripById(id);
  }
  async list(limit: number, page: number) {
    return tripsDaos.listTrips(limit, page);
  }
  async patchById(id: string, resource: PatchTripDto) {
    return tripsDaos.updateTripById(id, resource);
  }
  async readById(id: string) {
    return tripsDaos.getTripById(id);
  }
}

export default new TripService();
