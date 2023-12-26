import { CreateCityDto } from './create.city.dto';

export interface PatchCityDto extends Partial<CreateCityDto> {}
