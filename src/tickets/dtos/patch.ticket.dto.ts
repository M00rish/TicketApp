import { CreateTicketDto } from './create.ticket.dto';

export interface PatchTicketDto extends Partial<CreateTicketDto> {}
