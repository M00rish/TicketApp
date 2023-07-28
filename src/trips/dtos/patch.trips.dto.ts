import { CreateTripDto } from './create.trip.dto';

export interface PatchTripDto extends Partial<CreateTripDto> {}
